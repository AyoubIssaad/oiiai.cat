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
        title="🎮 Oiiai Cat / Banana Cat Games - Test Your Cat-Like Reflexes!"
        description="Challenge yourself with our collection of Banana Cat games! Type like the spinning cat, set high scores, and become a true Oiiai Cat champion. Endless feline fun awaits! 🏆"
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
