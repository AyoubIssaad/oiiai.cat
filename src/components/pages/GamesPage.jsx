import React, { useState } from "react";
import { Gamepad2, Trophy, Keyboard } from "lucide-react";
import { Button } from "../ui/Button";
import OiiaiGame from "../OiiaiGame";
import { Leaderboard } from "../Leaderboard";
import SEO from "../SEO";

export function GamesPage() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedGame, setSelectedGame] = useState("typing");

  return (
    <>
      <SEO
        title="Oiiai Games - Fun Typing Challenge and More"
        description="Play the Oiiai typing challenge and other fun games! Test your skills, compete on leaderboards, and enjoy our growing collection of games."
        path="/games"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="kawaii-heading text-4xl mb-4">
            Oiiai Games
            <span className="animate-bounce inline-block ml-4 delay-100">
              🎮
            </span>
          </h1>
          <p className="text-lg text-blue-700 mb-6">
            Test your skills, set high scores, and have fun with our collection
            of games!
          </p>
          <Button
            onClick={() => setShowLeaderboard(true)}
            className="kawaii-button"
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Leaderboard
          </Button>
        </div>

        {/* Game Selection */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="kawaii-card p-6">
            <h2 className="kawaii-title text-xl mb-4">Available Games</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedGame("typing")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedGame === "typing"
                    ? "border-blue-500 bg-blue-50"
                    : "border-blue-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Keyboard className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <h3 className="kawaii-subtitle text-lg">
                      Typing Challenge
                    </h3>
                    <p className="text-sm text-blue-600">
                      Master the "oiiai" sequence
                    </p>
                  </div>
                </div>
              </button>

              {/* Placeholder for future games */}
              <div className="p-4 rounded-lg border-2 border-gray-200 opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="w-6 h-6 text-gray-500" />
                  <div className="text-left">
                    <h3 className="kawaii-subtitle text-lg">
                      More Coming Soon!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Stay tuned for new games
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="max-w-4xl mx-auto">
          {selectedGame === "typing" && (
            <div className="kawaii-card p-6">
              <h2 className="kawaii-title text-2xl mb-6">
                Oiiai Typing Challenge
              </h2>
              <OiiaiGame onShowLeaderboard={() => setShowLeaderboard(true)} />
            </div>
          )}
        </div>

        {/* Quick Tips */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="kawaii-card p-6">
            <h2 className="kawaii-subtitle text-xl mb-4">Game Tips:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="kawaii-text font-bold text-blue-700">
                  How to Play:
                </h3>
                <ul className="space-y-2 text-blue-700">
                  <li>⌨️ Use your keyboard or click the buttons</li>
                  <li>🎯 Type the sequence correctly</li>
                  <li>⚡ Aim for speed and accuracy</li>
                  <li>🏆 Submit your score to the leaderboard</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="kawaii-text font-bold text-blue-700">
                  Pro Tips:
                </h3>
                <ul className="space-y-2 text-blue-700">
                  <li>🎵 Toggle sound for better rhythm</li>
                  <li>🔄 Practice makes perfect</li>
                  <li>📈 Track your progress on the leaderboard</li>
                  <li>🌟 Challenge your friends to beat your score</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="leaderboard-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLeaderboard(false);
            }
          }}
        >
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

          {/* Modal position container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <div
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GamesPage;
