import React, { useState } from "react";
import { Trophy } from "lucide-react";

export const ScoreSubmitModal = ({
  isOpen,
  onClose,
  gameStats,
  onSubmitScore,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Try to get stored credentials
  React.useEffect(() => {
    const storedUser = localStorage.getItem("oiiaiShooterUser");
    if (storedUser) {
      const { username: storedUsername, email: storedEmail } =
        JSON.parse(storedUser);
      setUsername(storedUsername);
      setEmail(storedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Register/verify user
      const userResponse = await fetch("/api/oiiai-shooter/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || "Failed to register user");
      }

      // Store user data locally
      localStorage.setItem(
        "oiiaiShooterUser",
        JSON.stringify({
          username,
          email,
          id: userData.id,
        }),
      );

      // Submit score
      const scoreData = {
        userId: userData.id,
        score: gameStats.score,
        time: parseFloat(gameStats.time),
        lettersPerSecond: parseFloat(gameStats.speed),
        totalLetters: gameStats.totalLetters,
        correctLetters: gameStats.correctLetters,
        maxCombo: gameStats.maxCombo,
      };

      const scoreResponse = await fetch("/api/oiiai-shooter/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scoreData),
      });

      const scoreResult = await scoreResponse.json();

      if (!scoreResponse.ok) {
        throw new Error(scoreResult.error || "Failed to submit score");
      }

      onSubmitScore(scoreResult);
      onClose();
    } catch (error) {
      console.error("Error submitting score:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-xl font-bold text-white">Submit Your Score</h2>
        </div>

        <p className="text-gray-400 mb-6">
          Register to save your score and compete on the leaderboard!
        </p>

        {gameStats && (
          <div className="bg-blue-950/30 p-4 rounded-lg space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Score:</span>
              <span className="font-bold text-blue-400">{gameStats.score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Speed:</span>
              <span className="font-bold text-blue-400">
                {gameStats.speed} letters/sec
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Max Combo:</span>
              <span className="font-bold text-blue-400">
                x{gameStats.maxCombo}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Choose a username"
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_-]+"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              placeholder="Enter your email"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Used to verify your identity when playing from a different device.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-gray-200 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Score"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
