import React, { useState, useEffect } from "react";
import { Medal, Trophy, Award, X } from "lucide-react";
import { Button } from "./ui/Button";

const API_URL = process.env.REACT_APP_API_URL || "/api";

export function Leaderboard({ onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      console.log("Fetching leaderboard from:", `${API_URL}/leaderboard`);
      setLoading(true);
      const response = await fetch(`${API_URL}/leaderboard`);
      console.log("Leaderboard response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Leaderboard data:", data);
      setLeaderboard(data);
    } catch (err) {
      console.error("Leaderboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <div className="kawaii-card p-8 relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        aria-label="Close leaderboard"
      >
        <X className="w-6 h-6" />
      </button>

      <h2 className="kawaii-title text-2xl mb-6 text-center">Top Players</h2>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-blue-600">Loading scores...</p>
        </div>
      )}

      {error && (
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <p className="text-red-600 mb-4">
            Error loading leaderboard: {error}
          </p>
          <Button onClick={fetchLeaderboard} className="kawaii-button">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <p className="text-blue-600 mb-2">No scores yet!</p>
          <p className="text-blue-500">Be the first to submit a score.</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b-2 border-blue-200">
                <th className="p-2">Rank</th>
                <th className="p-2">Player</th>
                <th className="p-2">Score</th>
                <th className="p-2">Time</th>
                <th className="p-2">Speed</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`
                    border-b border-blue-100
                    ${index < 3 ? "font-bold" : ""}
                    hover:bg-blue-50 transition-colors
                  `}
                >
                  <td className="p-2 flex items-center gap-2">
                    {getRankIcon(index)}
                    {index + 1}
                  </td>
                  <td className="p-2">{entry.player_name}</td>
                  <td className="p-2">
                    {Math.round(entry.score).toLocaleString()}
                  </td>
                  <td className="p-2">{entry.time}s</td>
                  <td className="p-2">{entry.letters_per_second}/s</td>
                  <td className="p-2">{formatDate(entry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
