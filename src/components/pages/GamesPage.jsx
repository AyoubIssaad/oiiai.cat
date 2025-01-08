import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import OiiaiGame from '../OiiaiGame';
import { Leaderboard } from '../Leaderboard';
import SEO from '../SEO';

export function GamesPage() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <>
      <SEO
        title="🎮 Oiiai Cat / Banana Cat Games - Test Your Cat-Like Reflexes!"
        description="Challenge yourself with our collection of Banana Cat games! Type like the spinning cat, set high scores, and become a true Oiiai Cat champion. Endless feline fun awaits! 🏆"
        path="/games"
      />

      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
        {/* Header Section - Made more compact */}
        <div className="text-center py-6 sm:py-8">
          <h1 className="font-['Orbitron'] text-2xl sm:text-3xl font-bold text-blue-700 mb-2">
            OIIAI GAMES
          </h1>
          <p className="text-sm sm:text-base text-blue-600 mb-4">
            Test your skills, set high scores, and have fun!
          </p>
          <Button
            onClick={() => setShowLeaderboard(true)}
            className="inline-flex items-center gap-2 text-sm"
          >
            <Trophy className="w-4 h-4" />
            View Leaderboard
          </Button>
        </div>

        {/* Game Container */}
        <div className="max-w-screen-sm mx-auto">
          <OiiaiGame onShowLeaderboard={() => setShowLeaderboard(true)} />
        </div>

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowLeaderboard(false);
              }
            }}
          >
            <div className="min-h-screen px-4 text-center flex items-center justify-center">
              <div
                className="relative inline-block w-full max-w-2xl text-left align-middle"
                onClick={(e) => e.stopPropagation()}
              >
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default GamesPage;
