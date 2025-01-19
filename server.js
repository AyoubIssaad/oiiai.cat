const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
app.use(cors());

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

      CREATE TABLE IF NOT EXISTS memes (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        platform VARCHAR(20) NOT NULL,
        video_id VARCHAR(100) NOT NULL,
        votes INTEGER DEFAULT 0,
        description TEXT,
        tags TEXT[] DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_by VARCHAR(50),
        reviewed_at TIMESTAMP,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(platform, video_id)
        );
     CREATE TABLE IF NOT EXISTS game_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email)
      );

      CREATE TABLE IF NOT EXISTS game_scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES game_users(id),
        score INTEGER NOT NULL,
        time DECIMAL(10,2) NOT NULL,
        letters_per_second DECIMAL(10,2) NOT NULL,
        total_letters INTEGER NOT NULL,
        correct_letters INTEGER NOT NULL,
        max_combo INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
      CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
      CREATE INDEX IF NOT EXISTS idx_memes_votes ON memes(votes DESC);
      CREATE INDEX IF NOT EXISTS idx_memes_platform_video ON memes(platform, video_id);
      CREATE INDEX IF NOT EXISTS idx_memes_status ON memes(status);
      CREATE INDEX IF NOT EXISTS idx_memes_tags ON memes USING GIN (tags);
    `);
  } finally {
    client.release();
  }
}

initDB().catch(console.error);

// Rate limiting configurations with admin bypass
const createRateLimiter = (opts) => {
  const limiter = rateLimit(opts);
  return (req, res, next) => {
    if (req.adminId) {
      return next();
    }
    return limiter(req, res, next);
  };
};

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});

const submissionLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

const voteLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
});

app.use("/api/", apiLimiter);

// Middleware to verify admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// Shared meme validation middleware
const validateMemeSubmission = async (req, res, next) => {
  const { url, platform, videoId } = req.body;

  if (!url || !platform || !videoId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["INSTAGRAM", "TIKTOK"].includes(platform.toUpperCase())) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  try {
    const existingMeme = await pool.query(
      "SELECT id FROM memes WHERE platform = $1 AND video_id = $2",
      [platform, videoId],
    );

    if (existingMeme.rows.length > 0) {
      return res.status(409).json({ error: "Meme already exists" });
    }

    req.validatedMeme = {
      url,
      platform: platform.toUpperCase(),
      videoId,
    };

    next();
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ error: "Failed to validate meme" });
  }
};

// Shared meme creation service
const createMeme = async (memeData, isAdmin = false) => {
  const { url, platform, videoId } = memeData;
  const status = isAdmin ? "approved" : "pending";

  const query = `
    INSERT INTO memes (url, platform, video_id, status, reviewed_by, reviewed_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    url,
    platform,
    videoId,
    status,
    isAdmin ? memeData.adminUsername : null,
    isAdmin ? new Date() : null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

// API Endpoints

// Public meme submission
app.post(
  "/api/memes",
  submissionLimit,
  validateMemeSubmission,
  async (req, res) => {
    try {
      const meme = await createMeme(req.validatedMeme);
      res.status(201).json(meme);
    } catch (error) {
      console.error("Error adding meme:", error);
      res.status(500).json({ error: "Failed to add meme" });
    }
  },
);

// Admin meme submission
app.post(
  "/api/admin/memes",
  authenticateAdmin,
  validateMemeSubmission,
  async (req, res) => {
    try {
      const adminUsername = await pool.query(
        "SELECT username FROM admins WHERE id = $1",
        [req.adminId],
      );

      const meme = await createMeme(
        {
          ...req.validatedMeme,
          adminUsername: adminUsername.rows[0].username,
        },
        true,
      );

      res.status(201).json(meme);
    } catch (error) {
      console.error("Error adding meme:", error);
      res.status(500).json({ error: "Failed to add meme" });
    }
  },
);

// Get pending memes (admin only)
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

// Review meme (admin only)
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

// Vote on meme
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
       WHERE id = $2 AND status = 'approved'
       RETURNING *`,
      [type === "up" ? 1 : -1, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meme not found or not approved" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update vote" });
  }
});

// Discover memes
app.get("/api/memes/discover", async (req, res) => {
  const {
    category = "popular",
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
      query += ` AND (description ILIKE $${paramCount} OR tags @> ARRAY[$${paramCount + 1}])`;
      params.push(`%${search}%`, search.toLowerCase());
      paramCount += 2;
    }

    // Add ordering based on category
    switch (category) {
      case "trending":
        query +=
          " ORDER BY (votes / EXTRACT(EPOCH FROM (NOW() - created_at)))::numeric DESC";
        break;
      case "latest":
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

// Admin login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM admins WHERE username = $1",
      [username],
    );

    const admin = result.rows[0];
    if (!admin) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

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

// In server.js, add this new endpoint:

const fetch = require("node-fetch"); // Make sure to install this package

// Endpoint to resolve Instagram share URLs
app.get("/api/resolve-url", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow", // This is important - it tells fetch to follow redirects
    });

    // Get the final URL after all redirects
    const finalUrl = response.url;

    res.json({ resolvedUrl: finalUrl });
  } catch (error) {
    console.error("Error resolving URL:", error);
    res.status(500).json({ error: "Failed to resolve URL" });
  }
});

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

// Check if username is available
app.get("/api/game/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM game_users WHERE username = $1)",
      [username],
    );
    res.json({ exists: result.rows[0].exists });
  } catch (error) {
    res.status(500).json({ error: "Failed to check username" });
  }
});

// Get user by email
app.get("/api/game/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const result = await pool.query(
      "SELECT id, username, email FROM game_users WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0) {
      res.json({ exists: false });
    } else {
      res.json({ exists: true, user: result.rows[0] });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Create new user
app.post("/api/game/users", async (req, res) => {
  const { username, email } = req.body;

  try {
    // Check if email already exists
    const emailCheck = await pool.query(
      "SELECT id FROM game_users WHERE email = $1",
      [email],
    );
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Check if username is taken
    const usernameCheck = await pool.query(
      "SELECT id FROM game_users WHERE username = $1",
      [username],
    );
    if (usernameCheck.rows.length > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const result = await pool.query(
      "INSERT INTO game_users (username, email) VALUES ($1, $2) RETURNING id, username, email",
      [username, email],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Submit score
app.post("/api/game/scores", async (req, res) => {
  const {
    userId,
    score,
    time,
    lettersPerSecond,
    totalLetters,
    correctLetters,
    maxCombo,
  } = req.body;

  try {
    // Get user's current best score
    const currentBest = await pool.query(
      "SELECT score FROM game_scores WHERE user_id = $1 ORDER BY score DESC LIMIT 1",
      [userId],
    );

    const result = await pool.query(
      `INSERT INTO game_scores
       (user_id, score, time, letters_per_second, total_letters, correct_letters, max_combo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        score,
        time,
        lettersPerSecond,
        totalLetters,
        correctLetters,
        maxCombo,
      ],
    );

    // Get user's rank
    const rankResult = await pool.query(
      `
      WITH ranked_scores AS (
        SELECT
          user_id,
          MAX(score) as max_score,
          RANK() OVER (ORDER BY MAX(score) DESC) as rank
        FROM game_scores
        GROUP BY user_id
      )
      SELECT rank
      FROM ranked_scores
      WHERE user_id = $1
    `,
      [userId],
    );

    const response = {
      score: result.rows[0],
      rank: rankResult.rows[0].rank,
      isNewBest: !currentBest.rows.length || score > currentBest.rows[0].score,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit score" });
  }
});

// Get leaderboard
app.get("/api/game/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH UserBestScores AS (
        SELECT DISTINCT ON (gs.user_id)
          gs.user_id,
          gu.username,
          gs.score,
          gs.time,
          gs.letters_per_second,
          gs.total_letters,
          gs.correct_letters,
          gs.max_combo,
          gs.created_at
        FROM game_scores gs
        JOIN game_users gu ON gs.user_id = gu.id
        ORDER BY gs.user_id, gs.score DESC
      )
      SELECT
        username,
        score,
        time,
        letters_per_second,
        total_letters,
        correct_letters,
        max_combo,
        created_at,
        RANK() OVER (ORDER BY score DESC) as rank
      FROM UserBestScores
      ORDER BY score DESC
      LIMIT 50
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
