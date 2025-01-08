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

  init(data) {
    this.onGameOver = data.onGameOver;
  }

  preload() {
    // Load any assets if needed
  }

  create() {
    // Create danger zone
    const dangerZone = this.add.rectangle(50, 200, 100, 400, 0xFFEBEE);
    const dangerLine = this.add.line(0, 0, 100, 0, 100, 400, 0xEF5350);
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

  startGame() {
    this.letters.forEach(letter => letter.destroy());
    this.letters = [];
    this.score = 0;
    this.speed = 100;
    this.totalLetters = 0;
    this.correctLetters = 0;
    this.gameStarted = true;
    this.startTime = this.time.now;
    this.scoreText.setText('Score: 0');

    // Initialize spawn timing
    this.baseSpawnDelay = 1200; // Start with 1.2 seconds between letters
    this.minSpawnDelay = 400;   // Don't go faster than 0.4 seconds between letters
    this.currentSpawnDelay = this.baseSpawnDelay;

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

  spawnLetter() {
    if (!this.gameStarted) return;

    const letters = ['O', 'I', 'A'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const color = randomLetter === 'O' ? 0x3B82F6 :
                 randomLetter === 'I' ? 0xFBBF24 :
                 0x1D4ED8;

    // Create background
    const container = this.add.container(800, Phaser.Math.Between(50, 350));
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

  handleLetterClick(clickedLetter) {
    if (!this.gameStarted) return;

    const leftmostLetter = this.letters[0];
    if (clickedLetter === leftmostLetter) {
      this.handleCorrectLetter();
    } else {
      this.gameOver();
    }
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    const leftmostLetter = this.letters[0];
    if (leftmostLetter.value.toLowerCase() === event.key.toLowerCase()) {
      this.handleCorrectLetter();
    } else {
      this.gameOver();
    }
  }

  handleCorrectLetter() {
    const letter = this.letters.shift();
    letter.destroy();
    this.score += 100;
    this.correctLetters++;
    this.speed += 5;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  gameOver() {
    this.gameStarted = false;
    const timePlayed = (this.time.now - this.startTime) / 1000;
    const lettersPerSecond = this.correctLetters / timePlayed;

    if (this.onGameOver) {
      this.onGameOver({
        score: this.score,
        time: timePlayed.toFixed(1),
        speed: lettersPerSecond.toFixed(2),
        totalLetters: this.totalLetters,
        correctLetters: this.correctLetters
      });
    }
  }

  update() {
    if (!this.gameStarted) return;

    // Move letters
    this.letters.forEach(letter => {
      letter.x -= this.speed * (this.game.loop.delta / 1000);

      // Check if letter has reached danger zone
      if (letter.x <= 100) {
        this.gameOver();
      }
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
    // Initialize Phaser game
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 400,
      backgroundColor: '#F0F9FF',
      parent: 'game-container',
      scene: MainScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    // Create game instance
    gameRef.current = new Phaser.Game(config);

    // Pass callback to scene
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
    <div className="flex flex-col items-center gap-8">
      {/* Game Header */}
      <div className="flex items-center justify-between w-full">
        <div className="text-2xl font-bold text-blue-700">
          Score: {gameStats?.score || 0}
        </div>
        <Button
          onClick={() => setIsMuted(!isMuted)}
          className="kawaii-button"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Game Container */}
      <div className="relative rounded-lg overflow-hidden border-4 border-blue-200 w-[800px] h-[400px] bg-blue-50">
        <div id="game-container" />

        {/* Game Over Overlay */}
        {isGameOver && gameStats && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
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
        {/* Add proper game state tracking */}
        {!isGameStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Button onClick={handleStartGame} className="kawaii-button accent text-lg px-8 py-4">
              Start Game
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-blue-700">
        <p>Type <span className="font-bold">O</span>, <span className="font-bold">I</span>, or <span className="font-bold">A</span> to match the leftmost letter!</p>
        <p className="text-sm mt-2">Or click/tap the letters directly</p>
      </div>
    </div>
  );
};

export default OiiaiGame;
