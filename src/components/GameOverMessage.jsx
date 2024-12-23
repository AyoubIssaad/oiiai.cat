import React, { useState } from "react";
import { Trophy, Share2 } from "lucide-react";
import { Button } from "./ui/Button";

const GameOverMessage = ({
  success,
  time,
  speed,
  score,
  onSubmitScore,
  submitting,
}) => {
  const [playerName, setPlayerName] = useState("");
  const [hasShared, setHasShared] = useState(false);

  // Calculate score from speed if not provided directly
  const calculateScore = () => {
    if (typeof score === "object" && score !== null && "points" in score) {
      return score.points;
    }
    // Fallback calculation based on speed
    return Math.round(parseFloat(speed) * 1000);
  };

  const handleShare = async () => {
    try {
      const calculatedScore = calculateScore();

      const shareData = {
        title: "Oiiai Cat Achievement!",
        text: `I just scored ${calculatedScore.toLocaleString()} points in Oiiai Cat! Can you beat my speed of ${speed} letters/second?`,
        url: "https://oiiai.cat/games",
      };

      if (navigator.share) {
        await navigator.share(shareData);
        setHasShared(true);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`,
        );
        alert("Score copied to clipboard! Share with your friends!");
        setHasShared(true);
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (!success) {
    return (
      <div className="kawaii-card p-6 text-center border-yellow-500 bg-yellow-50">
        <h3 className="kawaii-title font-black text-xl font-bold text-yellow-700">
          Try Again! 💫
        </h3>
        <p className="text-yellow-600 mt-2 font-['Orbitron']">
          Keep practicing to master the sequence
        </p>
      </div>
    );
  }

  const finalScore = calculateScore();

  return (
    <div className="kawaii-card p-6 text-center">
      <h3 className="kawaii-title text-xl mb-4 font-black">Perfect Run! ⭐</h3>
      <div className="space-y-4 text-blue-700">
        <div className="flex flex-col items-center gap-2">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <p className="text-2xl font-bold">
            {finalScore.toLocaleString()} points
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 my-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-bold">Time</p>
            <p>{time}s</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-bold">Speed</p>
            <p>{speed} letters/sec</p>
          </div>
        </div>

        {!submitting && !hasShared && (
          <Button
            onClick={handleShare}
            className="kawaii-button accent w-full mb-4"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Achievement
          </Button>
        )}

        {!submitting && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter your name for the leaderboard"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="kawaii-input mb-2 p-2 border-2 border-blue-300 rounded w-full"
              maxLength={50}
            />
            <Button
              onClick={() => onSubmitScore(playerName)}
              className="kawaii-button w-full"
              disabled={!playerName.trim()}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Submit to Leaderboard
            </Button>
          </div>
        )}

        {submitting && <p className="animate-pulse">Submitting score...</p>}
      </div>
    </div>
  );
};

export default GameOverMessage;
