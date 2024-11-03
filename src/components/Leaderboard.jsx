import React, { useState, useEffect } from "react";
import { Medal, Trophy, Award } from "lucide-react";
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
      const response = await fetch(`${API_URL}/leaderboard`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      setError("Failed to load leaderboard");
      console.error("Leaderboard error:", err);
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

  if (loading) {
    return (
      <div className="kawaii-card p-8 animate-pulse">
        <div className="flex justify-between items-center mb-6">
          <h2 className="kawaii-title text-2xl">Top Players</h2>
          <div className="h-8 w-20 bg-blue-200 rounded"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-blue-50 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="kawaii-card p-8 text-center">
        <h2 className="kawaii-title text-2xl mb-4">Oops!</h2>
        <p className="text-blue-700 mb-4">{error}</p>
        <Button onClick={() => fetchLeaderboard()} className="kawaii-button">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="kawaii-card p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="kawaii-title text-2xl">Top Players</h2>
        <Button onClick={onClose} className="kawaii-button">
          Close
        </Button>
      </div>

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
                <td className="p-2">{entry.score.toFixed(0)}</td>
                <td className="p-2">{entry.time}s</td>
                <td className="p-2">{entry.letters_per_second}/s</td>
                <td className="p-2">{formatDate(entry.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
