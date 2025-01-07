const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting configurations
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const voteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 votes per window
});

const submissionLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 submissions per hour
});

app.use("/api/", apiLimiter);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Initialize database tables
async function initDB() {
  const client = await pool.connect();
  try {
    // Create scores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL,
        score DECIMAL(10,2) NOT NULL,
        time DECIMAL(10,2) NOT NULL,
        letters_per_second DECIMAL(10,2) NOT NULL,
        mistakes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

      -- Create memes table
      CREATE TABLE IF NOT EXISTS memes (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        platform VARCHAR(20) NOT NULL,
        video_id VARCHAR(100) NOT NULL,
        votes INTEGER DEFAULT 0,
        description TEXT,
        tags TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, video_id)
      );

      CREATE INDEX IF NOT EXISTS idx_memes_votes ON memes(votes DESC);
      CREATE INDEX IF NOT EXISTS idx_memes_platform_video ON memes(platform, video_id);
      CREATE INDEX IF NOT EXISTS idx_memes_tags ON memes USING GIN (tags);
    `);
  } finally {
    client.release();
  }
}

initDB().catch(console.error);

// API Endpoints

// Scores endpoints
app.post("/api/scores", async (req, res) => {
  console.log("Received score submission:", req.body);

  const { playerName, score, time, lettersPerSecond, mistakes } = req.body;

  // Basic validation
  if (!playerName || !score || !time || !lettersPerSecond) {
    console.log("Validation failed:", {
      playerName,
      score,
      time,
      lettersPerSecond,
    });
    return res.status(400).json({
      error: "Missing required fields",
      received: { playerName, score, time, lettersPerSecond },
    });
  }

  try {
    console.log("Attempting database insertion...");
    const result = await pool.query(
      "INSERT INTO scores (player_name, score, time, letters_per_second, mistakes) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [playerName, score, time, lettersPerSecond, mistakes],
    );

    console.log("Database insertion successful:", result.rows[0]);
    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error("Database error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({
      error: "Failed to save score",
      details: error.message,
      code: error.code,
    });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH RankedScores AS (
        SELECT
          id,
          player_name,
          score,
          time,
          letters_per_second,
          mistakes,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY player_name
            ORDER BY score DESC, time ASC
          ) as rank
        FROM scores
      )
      SELECT
        id,
        player_name,
        score,
        time,
        letters_per_second,
        mistakes,
        created_at
      FROM RankedScores
      WHERE rank = 1
      ORDER BY score DESC, time ASC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Memes endpoints
app.get("/api/memes", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT * FROM memes
       ORDER BY votes DESC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching memes:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});

app.post("/api/memes", submissionLimit, async (req, res) => {
  const { url, platform, videoId } = req.body;

  if (!url || !platform || !videoId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingMeme = await pool.query(
      "SELECT id FROM memes WHERE platform = $1 AND video_id = $2",
      [platform, videoId],
    );

    if (existingMeme.rows.length > 0) {
      return res.status(409).json({ error: "Meme already exists" });
    }

    const result = await pool.query(
      `INSERT INTO memes (url, platform, video_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [url, platform, videoId],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding meme:", error);
    res.status(500).json({ error: "Failed to add meme" });
  }
});

app.post("/api/memes/:id/vote", voteLimit, async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  if (!["up", "down"].includes(type)) {
    return res.status(400).json({ error: "Invalid vote type" });
  }

  try {
    const result = await pool.query(
      `UPDATE memes
       SET votes = votes + $1
       WHERE id = $2
       RETURNING *`,
      [type === "up" ? 1 : -1, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meme not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating vote:", error);
    res.status(500).json({ error: "Failed to update vote" });
  }
});

app.get("/api/memes/discover", async (req, res) => {
  const {
    category,
    platform,
    dateRange,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  try {
    let query = "SELECT * FROM memes WHERE status = 'approved'";
    const params = [];
    let paramCount = 1;

    if (platform && platform !== "all") {
      query += ` AND platform = $${paramCount}`;
      params.push(platform.toUpperCase());
      paramCount++;
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let dateFilter;

      switch (dateRange) {
        case "today":
          dateFilter = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      if (dateFilter) {
        query += ` AND created_at > $${paramCount}`;
        params.push(dateFilter);
        paramCount++;
      }
    }

    if (search) {
      query += ` AND (
        description ILIKE $${paramCount} OR
        tags @> ARRAY[$${paramCount + 1}]
      )`;
      params.push(`%${search}%`, search.toLowerCase());
      paramCount += 2;
    }

    switch (category) {
      case "trending":
        query +=
          " ORDER BY (votes / EXTRACT(EPOCH FROM (NOW() - created_at)))::numeric DESC";
        break;
      case "newest":
        query += " ORDER BY created_at DESC";
        break;
      case "popular":
        query += " ORDER BY votes DESC";
        break;
      default:
        query += " ORDER BY created_at DESC";
    }

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error in meme discovery:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});

app.get("/api/memes/trending-tags", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        unnest(tags) as tag,
        COUNT(*) as usage_count
      FROM memes
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY tag
      ORDER BY usage_count DESC, tag
      LIMIT 10
    `);

    res.json(result.rows.map((row) => row.tag));
  } catch (error) {
    console.error("Error fetching trending tags:", error);
    res.status(500).json({ error: "Failed to fetch trending tags" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Middleware to verify admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists and is valid
    const session = await pool.query(
      "SELECT * FROM admin_sessions WHERE token = $1 AND expires_at > NOW()",
      [token],
    );

    if (session.rows.length === 0) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin meme submission endpoint
app.post("/api/admin/memes", authenticateAdmin, async (req, res) => {
  const { url, platform, videoId, status = "approved" } = req.body;

  if (!url || !platform || !videoId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check if meme already exists
    const existingMeme = await pool.query(
      "SELECT id FROM memes WHERE platform = $1 AND video_id = $2",
      [platform, videoId],
    );

    if (existingMeme.rows.length > 0) {
      return res.status(409).json({ error: "Meme already exists" });
    }

    // Insert new meme with admin-specific fields
    const result = await pool.query(
      `INSERT INTO memes
        (url, platform, video_id, status, reviewed_by, reviewed_at)
       VALUES ($1, $2, $3, $4, (SELECT username FROM admins WHERE id = $5), NOW())
       RETURNING *`,
      [url, platform, videoId, status, req.adminId],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding meme:", error);
    res.status(500).json({ error: "Failed to add meme" });
  }
});

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Get admin user
    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username],
    );

    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create session token
    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Store session
    await pool.query(
      "INSERT INTO admin_sessions (admin_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '24 hours')",
      [admin.id, token],
    );

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Get pending memes
app.get("/api/admin/memes/pending", authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM memes WHERE status = 'pending' ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pending memes" });
  }
});

// Review meme
app.post("/api/admin/memes/:id/review", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const result = await pool.query(
      `UPDATE memes
       SET status = $1,
           admin_notes = $2,
           reviewed_at = NOW(),
           reviewed_by = (SELECT username FROM admins WHERE id = $3)
       WHERE id = $4
       RETURNING *`,
      [status, adminNotes, req.adminId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meme not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update meme status" });
  }
});

// Modify the existing memes endpoint to only show approved memes
app.get("/api/memes/discover", async (req, res) => {
  const {
    category,
    platform,
    dateRange,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  try {
    let query = "SELECT * FROM memes WHERE status = 'approved'"; // Add status filter
    const params = [];
    let paramCount = 1;

    // ... rest of the existing discover endpoint code ...
  } catch (error) {
    console.error("Error in meme discovery:", error);
    res.status(500).json({ error: "Failed to fetch memes" });
  }
});
