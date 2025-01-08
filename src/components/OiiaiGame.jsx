import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from './ui/Button';
import { Volume2, VolumeX } from 'lucide-react';
import GameOverMessage from './GameOverMessage';

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.letters = [];
    this.score = 0;
    this.speed = 100;
    this.gameStarted = false;
    this.totalLetters = 0;
    this.correctLetters = 0;
    this.startTime = 0;
  }

  create() {
    // Create danger zone at bottom
    const dangerZone = this.add.rectangle(400, 350, 800, 100, 0xFFEBEE);
    const dangerLine = this.add.line(400, 300, -400, 0, 400, 0, 0xEF5350);
    dangerLine.setLineWidth(2);

    // Add score text
    this.scoreText = this.add.text(10, 10, 'Score: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#3B82F6'
    });

    // Setup keyboard input
    this.input.keyboard.on('keydown', this.handleKeyPress, this);
  }

  spawnLetter() {
    if (!this.gameStarted) return;

    const letters = ['O', 'I', 'A'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const color = randomLetter === 'O' ? 0x3B82F6 :
                 randomLetter === 'I' ? 0xFBBF24 :
                 0x1D4ED8;

    // Create letter container at random x position at top
    const container = this.add.container(
      Phaser.Math.Between(50, 750),  // Random x position
      -50  // Start above screen
    );

    // Create background
    const bg = this.add.rectangle(0, 0, 50, 50, color, 1);
    bg.setInteractive();
    bg.on('pointerdown', () => this.handleLetterClick(container));

    // Create text
    const text = this.add.text(0, 0, randomLetter, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    container.add([bg, text]);
    container.value = randomLetter;
    this.letters.push(container);
    this.totalLetters++;
  }

  update() {
    if (!this.gameStarted) return;

    // Move letters downward
    this.letters.forEach(letter => {
      letter.y += this.speed * (this.game.loop.delta / 1000);

      // Check if letter has reached danger zone
      if (letter.y >= 300) {  // Danger line y-position
        this.gameOver();
      }
    });
  }

  handleLetterClick(clickedLetter) {
    if (!this.gameStarted) return;

    const lowestLetter = this.getLowestLetter();
    if (clickedLetter === lowestLetter) {
      this.handleCorrectLetter();
    } else {
      this.gameOver();
    }
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    const lowestLetter = this.getLowestLetter();
    if (lowestLetter.value.toLowerCase() === event.key.toLowerCase()) {
      this.handleCorrectLetter();
    } else {
      this.gameOver();
    }
  }

  getLowestLetter() {
    // Return the letter closest to the bottom
    return this.letters.reduce((lowest, current) =>
      !lowest || current.y > lowest.y ? current : lowest
    , null);
  }

  handleCorrectLetter() {
    const lowestLetter = this.getLowestLetter();
    if (lowestLetter) {
      this.letters = this.letters.filter(l => l !== lowestLetter);
      lowestLetter.destroy();
      this.score += 100;
      this.correctLetters++;

      // Smooth speed increase using a logarithmic curve
      this.speed = Math.min(
        this.maxSpeed,
        this.baseSpeed * (1 + Math.log1p(this.correctLetters * 0.1))
      );

      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  startGame() {
    // Initialize game parameters
    this.baseSpeed = 150;    // Slightly faster for vertical movement
    this.maxSpeed = 500;
    this.baseSpawnDelay = 1000;  // Start with 1 second between letters
    this.minSpawnDelay = 400;    // Don't go faster than 0.4 seconds
    this.currentSpawnDelay = this.baseSpawnDelay;
    this.speed = this.baseSpeed;

    this.letters.forEach(letter => letter.destroy());
    this.letters = [];
    this.score = 0;
    this.totalLetters = 0;
    this.correctLetters = 0;
    this.gameStarted = true;
    this.startTime = this.time.now;
    this.scoreText.setText('Score: 0');

    // Start spawning letters with dynamic timing
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: () => {
        this.spawnLetter();

        // Gradually decrease spawn delay
        this.currentSpawnDelay = Math.max(
          this.minSpawnDelay,
          this.baseSpawnDelay * Math.pow(0.98, this.correctLetters)
        );

        // Update timer delay
        this.spawnTimer.delay = this.currentSpawnDelay;
      },
      callbackScope: this,
      loop: true
    });
  }
}

const OiiaiGame = ({ onShowLeaderboard }) => {
  const gameRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameStats, setGameStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initialize Phaser game with vertical layout
    const config = {
      type: Phaser.AUTO,
      width: 400,  // Narrower width
      height: 600, // Taller height
      backgroundColor: '#F0F9FF',
      parent: 'game-container',
      scene: MainScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
          gravity: { y: 0 }
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    const scene = gameRef.current.scene.getScene('MainScene');
    if (scene) {
      scene.onGameOver = (stats) => {
        setGameStats(stats);
        setIsGameOver(true);
        setIsGameStarted(false);
      };
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleStartGame = () => {
    const scene = gameRef.current?.scene.getScene('MainScene');
    if (scene) {
      setIsGameOver(false);
      setIsGameStarted(true);
      setGameStats(null);
      scene.startGame();
    }
  };

  const handleSubmitScore = async (playerName) => {
    if (!gameStats) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_name: playerName,
          score: gameStats.score,
          time: parseFloat(gameStats.time),
          letters_per_second: parseFloat(gameStats.speed),
          total_letters: gameStats.totalLetters,
          correct_letters: gameStats.correctLetters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      if (onShowLeaderboard) {
        onShowLeaderboard();
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      alert('Failed to submit score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Game Header */}
      <div className="w-full max-w-[400px] px-4 mb-2">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-blue-700">
            Score: {gameStats?.score || 0}
          </div>
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Game Container - Vertical aspect ratio */}
      <div className="relative w-full max-w-[400px] aspect-[2/3] bg-blue-50">
        <div id="game-container" className="w-full h-full" />

        {/* Game Over Overlay */}
        {isGameOver && gameStats && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <GameOverMessage
              success={true}
              score={gameStats.score}
              time={gameStats.time}
              speed={gameStats.speed}
              onSubmitScore={handleSubmitScore}
              submitting={submitting}
            />
          </div>
        )}

        {/* Start Game Overlay */}
        {!isGameStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Button onClick={handleStartGame} className="kawaii-button accent text-lg px-6 py-3">
              Start Game
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-blue-700 px-4 py-3 mt-2 text-sm">
        <p>Type <span className="font-bold">O</span>, <span className="font-bold">I</span>, or <span className="font-bold">A</span> to match the closest letter</p>
        <p className="text-xs mt-1 text-blue-600">or tap letters to remove them</p>
      </div>
    </div>
  );
};

export default OiiaiGame;
