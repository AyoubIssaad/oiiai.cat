const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(cors());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Initialize database
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
    `);
  } finally {
    client.release();
  }
}

initDB().catch(console.error);

// API Endpoints
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

// In server.js
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
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
