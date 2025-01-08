import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Button } from './ui/Button';
import { Volume2, VolumeX } from 'lucide-react';

// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const INITIAL_SPEED = 1; // pixels per frame (slower for testing)
const LETTER_SIZE = 50;
const LETTER_SPAWN_INTERVAL = 2000; // ms between letters

class Game {
  constructor(canvas, onGameOver) {
    this.onGameOver = onGameOver;

    // Initialize PIXI Application using v8 syntax
    PIXI.Application.init({
      view: canvas,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0xF0F9FF,
      resolution: window.devicePixelRatio || 1,
    }).then((app) => {
      this.app = app;
      this.init();
    });

    // Game state
    this.letters = [];
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.isPlaying = false;
    this.isInitialized = false;
  }

  async init() {
    try {
      if (!this.app || this.isInitialized) return;

      // Create game container
      this.gameContainer = new PIXI.Container();
      this.app.stage.addChild(this.gameContainer);

      // Setup game area
      this.setupGameArea();

      // Set up the game ticker
      this.app.ticker.add(() => {
        if (this.isPlaying) {
          this.gameLoop();
        }
      });

      this.isInitialized = true;
      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }

  setupGameArea() {
    // Create danger zone using v8 syntax
    const dangerZone = new PIXI.Graphics();
    dangerZone.fill({ color: 0xFFEBEE });
    dangerZone.rect(0, 0, 100, GAME_HEIGHT);
    this.gameContainer.addChild(dangerZone);

    // Create border for danger zone
    const dangerBorder = new PIXI.Graphics();
    dangerBorder.setStrokeStyle({ width: 2, color: 0xEF5350 });
    dangerBorder.moveTo(100, 0);
    dangerBorder.lineTo(100, GAME_HEIGHT);
    this.gameContainer.addChild(dangerBorder);
  }

  createLetter() {
    if (!this.isInitialized || !this.gameContainer) {
      console.warn('Cannot create letter - game not initialized');
      return;
    }

    const letters = ['O', 'I', 'A'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];

    // Create letter container
    const letterContainer = new PIXI.Container();
    letterContainer.x = GAME_WIDTH - LETTER_SIZE;
    letterContainer.y = GAME_HEIGHT / 2;

    // Create background using v8 syntax
    const background = new PIXI.Graphics();
    const color = randomLetter === 'O' ? 0x3B82F6 :
                 randomLetter === 'I' ? 0xFBBF24 :
                 0x1D4ED8;

    background.fill({ color });
    background.roundRect(-LETTER_SIZE/2, -LETTER_SIZE/2, LETTER_SIZE, LETTER_SIZE, 10);

    // Create text using v8 syntax
    const text = new PIXI.Text({
      text: randomLetter,
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fill: 0xFFFFFF,
        align: 'center',
      }
    });
    text.anchor.set(0.5);

    letterContainer.addChild(background);
    letterContainer.addChild(text);
    letterContainer.value = randomLetter;
    letterContainer.eventMode = 'static';
    letterContainer.cursor = 'pointer';
    letterContainer.on('pointerdown', () => this.handleLetterClick(letterContainer));

    this.gameContainer.addChild(letterContainer);
    this.letters.push(letterContainer);

    console.log(`Letter ${randomLetter} created at ${letterContainer.x}, ${letterContainer.y}`);
  }

  handleLetterClick(letterContainer) {
    if (!this.isPlaying) return;

    const leftmostLetter = this.letters[0];
    if (letterContainer === leftmostLetter) {
      this.letters = this.letters.filter(l => l !== letterContainer);
      this.gameContainer.removeChild(letterContainer);
      this.score += 100;
      this.speed += 0.1;
    } else {
      this.gameOver();
    }
  }

  gameLoop() {
    if (!this.isPlaying || !this.isInitialized) return;

    // Move letters
    for (const letter of this.letters) {
      letter.x -= this.speed;

      // Check if letter has reached danger zone
      if (letter.x <= 100) {
        this.gameOver();
        return;
      }
    }

    // Remove off-screen letters
    this.letters = this.letters.filter(letter => {
      if (letter.x < -LETTER_SIZE) {
        this.gameContainer.removeChild(letter);
        return false;
      }
      return true;
    });

    // Generate new letters
    const lastLetter = this.letters[this.letters.length - 1];
    if (!lastLetter || lastLetter.x < GAME_WIDTH - 200) {
      this.createLetter();
    }
  }

  async start() {
    if (!this.isInitialized) {
      console.warn('Game not initialized yet');
      return;
    }

    console.log('Starting game...');

    // Reset game state
    this.letters.forEach(letter => {
      if (letter.parent) {
        letter.parent.removeChild(letter);
      }
    });
    this.letters = [];
    this.score = 0;
    this.speed = INITIAL_SPEED;
    this.isPlaying = true;

    this.createLetter();
  }

  gameOver() {
    this.isPlaying = false;
    if (this.onGameOver) {
      this.onGameOver(this.score);
    }
  }

  destroy() {
    try {
      this.isPlaying = false;
      this.isInitialized = false;

      if (this.letters) {
        this.letters.forEach(letter => {
          if (letter?.parent) {
            letter.parent.removeChild(letter);
          }
        });
        this.letters = [];
      }

      if (this.gameContainer?.parent) {
        this.gameContainer.parent.removeChild(this.gameContainer);
        this.gameContainer.destroy({ children: true });
      }

      if (this.app?.stage) {
        this.app.stage.removeChildren();
      }

      if (this.app && !this.app.destroyed) {
        this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      }

      this.app = null;
      this.gameContainer = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

const OiiaiGame = ({ onShowLeaderboard }) => {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const initGame = async () => {
      if (canvasRef.current && !gameRef.current) {
        try {
          gameRef.current = new Game(canvasRef.current, (finalScore) => {
            setScore(finalScore);
            setIsGameOver(true);
          });
        } catch (error) {
          console.error('Error creating game:', error);
        }
      }
    };

    initGame();

    return () => {
      try {
        if (gameRef.current) {
          gameRef.current.destroy();
          gameRef.current = null;
        }
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };
  }, []);

  const handleStartGame = () => {
    if (gameRef.current?.isInitialized) {
      setIsGameOver(false);
      gameRef.current.start();
    } else {
      console.warn('Game not ready yet');
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Game Header */}
      <div className="flex items-center justify-between w-full">
        <div className="text-2xl font-bold text-blue-700">
          Score: {gameRef.current?.score || 0}
        </div>
        <Button
          onClick={() => setIsMuted(!isMuted)}
          className="kawaii-button"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
      </div>

      {/* Game Canvas */}
      <div className="relative rounded-lg overflow-hidden border-4 border-blue-200 w-[800px] h-[400px] bg-blue-50">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />

        {/* Overlay for game over / start screen */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-blue-700 mb-4">Game Over!</h2>
              <p className="text-xl text-blue-600 mb-4">Score: {score}</p>
              <Button onClick={handleStartGame} className="kawaii-button accent">
                Play Again
              </Button>
            </div>
          </div>
        )}

        {(!gameRef.current?.isPlaying && !isGameOver) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Button onClick={handleStartGame} className="kawaii-button accent text-lg px-8 py-4">
              Start Game
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OiiaiGame;
