import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Button } from './ui/Button';
import { Volume2, VolumeX, Trophy } from 'lucide-react';
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
    this.difficultyLevel = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.onGameOver = null;
  }

  create() {
    // Create a starfield background effect
    this.createStarfield();

    // Create the danger zone at bottom
    const dangerGradient = this.add.graphics();
    dangerGradient.fillGradientStyle(0xFF6B6B, 0xFF8787, 0xFFA5A5, 0xFFBEBE, 1);
    dangerGradient.fillRect(0, 500, 400, 100);

    // Add pulsing effect to danger zone
    this.tweens.add({
      targets: dangerGradient,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Create danger line
    this.dangerLine = this.add.graphics();
    this.dangerLine.lineStyle(3, 0xEF5350, 1);
    this.dangerLine.lineBetween(0, 500, 400, 500);

    // Add pulsing glow to danger line
    this.tweens.add({
      targets: this.dangerLine,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add score display
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontFamily: 'Orbitron',
      fontSize: '24px',
      fill: '#3B82F6',
      padding: { x: 10, y: 5 },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 5
    });

    // Add combo display
    this.comboText = this.add.text(20, 60, 'Combo: x1', {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      fill: '#60A5FA',
      padding: { x: 10, y: 5 },
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 5,
      alpha: 0
    });

    // Setup keyboard input
    this.input.keyboard.on('keydown', this.handleKeyPress, this);
  }

  createStarfield() {
    const particlesConfig = {
      frame: 'white',
      color: [ 0xffffff, 0x60A5FA, 0x93C5FD ],
      x: 0,
      y: 0,
      lifespan: 3000,
      speed: { min: 20, max: 50 },
      angle: 90,
      gravityY: 0,
      scale: { start: 0.1, end: 0 },
      quantity: 1,
      blendMode: 'ADD'
    };

    this.particles = this.add.particles(0, 0, particlesConfig);
    this.particles.createEmitter({
      ...particlesConfig,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(0, 0, 400, 600)
      }
    });
  }

  createHexagon(x, y, size, color) {
    const hexagon = this.add.graphics();
    hexagon.lineStyle(2, 0xffffff, 1);
    hexagon.fillStyle(color, 1);

    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 + Math.PI / 6;
      points.push({
        x: x + size * Math.cos(angle),
        y: y + size * Math.sin(angle)
      });
    }

    hexagon.beginPath();
    hexagon.moveTo(points[0].x, points[0].y);
    points.forEach(point => hexagon.lineTo(point.x, point.y));
    hexagon.closePath();
    hexagon.fillPath();
    hexagon.strokePath();

    return hexagon;
  }

  spawnLetter() {
    if (!this.gameStarted) return;

    const letters = ['O', 'I', 'A'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const colors = {
      'O': 0x3B82F6,
      'I': 0xFBBF24,
      'A': 0x1D4ED8
    };

    // Find a suitable x position
    const minHorizontalSpacing = 60;
    let attempts = 0;
    let newX;

    do {
      newX = Phaser.Math.Between(50, 350);
      attempts++;

      const recentLetters = this.letters.slice(-3);
      const isTooClose = recentLetters.some(letter => {
        const distance = Math.abs(letter.x - newX);
        return distance < minHorizontalSpacing;
      });

      if (!isTooClose || attempts > 5) break;
    } while (true);

    // Create letter container
    const container = this.add.container(newX, -50);

    // Create hexagonal background
    const hexSize = 30;
    const hexagon = this.createHexagon(0, 0, hexSize, colors[randomLetter]);

    // Make container interactive
    const hitArea = new Phaser.Geom.Polygon([
      ...Array(6).keys()].map(i => {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        return new Phaser.Geom.Point(
          hexSize * Math.cos(angle),
          hexSize * Math.sin(angle)
        );
      })
    );

    container.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
    container.on('pointerdown', () => this.handleLetterClick(container));

    // Add letter text
    const text = this.add.text(0, 0, randomLetter, {
      fontFamily: 'Orbitron',
      fontSize: '32px',
      fill: '#FFFFFF'
    }).setOrigin(0.5);

    // Add glow effect
    text.setPipeline('Light2D');

    // Add entry animation
    container.alpha = 0;
    container.scale = 0.5;
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });

    container.add([hexagon, text]);
    container.value = randomLetter;
    this.letters.push(container);
    this.totalLetters++;
  }

  handleCorrectLetter() {
    const lowestLetter = this.getLowestLetter();
    if (lowestLetter) {
      // Increment combo
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      // Calculate bonus points based on combo
      const comboBonus = Math.floor(this.combo / 5) * 50;
      const points = 100 + comboBonus;

      // Show floating score text
      this.showFloatingScore(lowestLetter.x, lowestLetter.y, points);

      // Update combo display
      this.comboText.setText(`Combo: x${this.combo}`);
      this.comboText.setAlpha(1);

      // Add particles
      this.addSuccessParticles(lowestLetter.x, lowestLetter.y);

      // Remove letter with animation
      this.tweens.add({
        targets: lowestLetter,
        alpha: 0,
        scale: 1.5,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.letters = this.letters.filter(l => l !== lowestLetter);
          lowestLetter.destroy();
        }
      });

      this.score += points;
      this.correctLetters++;

      // Update difficulty every 5 correct letters
      if (this.correctLetters % 5 === 0) {
        this.difficultyLevel++;

        // Gradually increase speed
        this.speed = Math.min(
          this.maxSpeed,
          this.baseSpeed * (1 + Math.log1p(this.difficultyLevel * 0.3))
        );

        // Gradually decrease spawn delay
        this.currentSpawnDelay = Math.max(
          this.minSpawnDelay,
          this.baseSpawnDelay * Math.pow(0.95, this.difficultyLevel)
        );

        if (this.spawnTimer) {
          this.spawnTimer.delay = this.currentSpawnDelay;
        }
      }

      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  showFloatingScore(x, y, points) {
    const floatingText = this.add.text(x, y, `+${points}`, {
      fontFamily: 'Orbitron',
      fontSize: '20px',
      fill: '#60A5FA'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => floatingText.destroy()
    });
  }

  addSuccessParticles(x, y) {
    const particles = this.add.particles(x, y, {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      gravityY: 200
    });

    particles.createEmitter({
      frame: 'white',
      quantity: 10,
      color: [ 0x60A5FA, 0x93C5FD, 0xBFDBFE ]
    });

    this.time.delayedCall(1000, () => particles.destroy());
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    const lowestLetter = this.getLowestLetter();
    if (lowestLetter.value.toLowerCase() === event.key.toLowerCase()) {
      this.handleCorrectLetter();
    } else {
      // Reset combo
      this.combo = 0;
      this.comboText.setAlpha(0.5);

      // Flash and shake the letter
      const container = lowestLetter;
      const hexagon = container.list[0];

      // Save original color
      const originalColor = hexagon.fillStyle;

      // Flash red
      hexagon.clear();
      this.createHexagon(0, 0, 30, 0xff0000);

      // Shake effect
      this.tweens.add({
        targets: container,
        x: container.x - 10,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          if (container.active) {
            hexagon.clear();
            this.createHexagon(0, 0, 30, originalColor);
          }
        }
      });

      this.gameOver(false);
    }
  }

  handleLetterClick(clickedLetter) {
    if (!this.gameStarted) return;

    const lowestLetter = this.getLowestLetter();
    if (clickedLetter === lowestLetter) {
      this.handleCorrectLetter();
    } else {
      this.combo = 0;
      this.comboText.setAlpha(0.5);
      this.gameOver(false);
    }
  }

  update() {
    if (!this.gameStarted) return;

    this.letters.forEach(letter => {
      letter.y += this.speed * (this.game.loop.delta / 1000);

      if (letter.y >= 500) {
        this.gameOver(false);
      }
    });
  }

  getLowestLetter() {
    return this.letters.reduce((lowest, current) =>
      !lowest || current.y > lowest.y ? current : lowest
    , null);
  }

  gameOver(success = false) {
    if (!this.gameStarted) return;

    this.gameStarted = false;
    const endTime = this.time.now;
    const duration = (endTime - this.startTime) / 1000;
    const lettersPerSecond = (this.correctLetters / duration).toFixed(2);

    // Clear letters with particles
    this.letters.forEach(letter => {
      this.addSuccessParticles(letter.x, letter.y);
      letter.destroy();
    });
    this.letters = [];

    // Show game over message
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const messageContainer = this.add.container(centerX, centerY);

    // Create glass-like background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-150, -100, 300, 200, 16);
    bg.lineStyle(2, success ? 0x4ade80 : 0xef4444);
    bg.strokeRoundedRect(-150, -100, 300, 200, 16);
    messageContainer.add(bg);

    const messageConfig = {
      fontFamily: 'Orbitron',
      fontSize: '28px',
      fontWeight: 'bold',
      fill: '#FFFFFF',
      align: 'center'
    };

    if (success) {
      const messageText = this.add.text(0, -60, 'Perfect Run!', messageConfig).setOrigin(0.5);
      const scoreText = this.add.text(0, -10, `Score: ${this.score}`, messageConfig).setOrigin(0.5);
      const speedText = this.add.text(0, 40, `${lettersPerSecond} letters/sec`, {
        ...messageConfig,
        fontSize: '20px'
      }).setOrigin(0.5);

      messageContainer.add([messageText, scoreText, speedText]);
      this.addCelebrationParticles();
    } else {
      const messageText = this.add.text(0, -70, 'Game Over!', {
        ...messageConfig,
        fontSize: '32px'
      }).setOrigin(0.5);

      const scoreText = this.add.text(0, -20, `Score: ${this.score}`, {
        ...messageConfig,
        fontSize: '24px'
      }).setOrigin(0.5);

      const comboText = this.add.text(0, 20, `Max Combo: x${this.maxCombo}`, {
        ...messageConfig,
        fontSize: '20px',
        fill: '#60A5FA'
      }).setOrigin(0.5);

      // Create interactive retry button
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(0x2563EB, 1);
      buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);
      buttonBg.lineStyle(2, 0x3B82F6);
      buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);

      const buttonText = this.add.text(0, 50, 'Try Again', {
        ...messageConfig,
        fontSize: '20px'
      }).setOrigin(0.5);

      // Make button interactive
      const buttonHitArea = new Phaser.Geom.Rectangle(-80, 30, 160, 40);
      buttonBg.setInteractive(buttonHitArea, Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => {
          buttonBg.clear();
          buttonBg.fillStyle(0x1D4ED8, 1);
          buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);
          buttonBg.lineStyle(2, 0x3B82F6);
          buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);
          buttonText.setScale(1.1);
        })
        .on('pointerout', () => {
          buttonBg.clear();
          buttonBg.fillStyle(0x2563EB, 1);
          buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);
          buttonBg.lineStyle(2, 0x3B82F6);
          buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);
          buttonText.setScale(1);
        })
        .on('pointerdown', () => {
          messageContainer.destroy();
          this.startGame();
        });

      messageContainer.add([messageText, scoreText, comboText, buttonBg, buttonText]);
    }

    // Add fade-in animation with bounce
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.8);
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    // Shake camera on failure
    if (!success) {
      this.cameras.main.shake(500, 0.01);
    }

    // Call the onGameOver callback with stats
    if (this.onGameOver) {
      this.onGameOver({
        success,
        score: this.score,
        time: duration.toFixed(2),
        speed: lettersPerSecond,
        totalLetters: this.totalLetters,
        correctLetters: this.correctLetters,
        maxCombo: this.maxCombo
      });
    }
  }

  addCelebrationParticles() {
    const particles = this.add.particles(0, 0, {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 2000,
      gravityY: 300,
      emitting: false
    });

    particles.createEmitter({
      frame: 'white',
      quantity: 30,
      color: [ 0x4ade80, 0x60A5FA, 0xFBBF24 ],
      emitCallback: (particle) => {
        particle.velocityX = (Math.random() - 0.5) * 400;
        particle.velocityY = Math.random() * -300;
      }
    });

    particles.emitParticleAt(
      this.cameras.main.centerX,
      this.cameras.main.centerY
    );

    this.time.delayedCall(2000, () => particles.destroy());
  }

  startGame() {
    // Initialize with easier starting conditions
    this.baseSpeed = 80;
    this.maxSpeed = 400;
    this.baseSpawnDelay = 2000;
    this.minSpawnDelay = 500;
    this.currentSpawnDelay = this.baseSpawnDelay;
    this.speed = this.baseSpeed;
    this.difficultyLevel = 1;
    this.combo = 0;
    this.maxCombo = 0;

    // Reset game state
    this.letters.forEach(letter => letter.destroy());
    this.letters = [];
    this.score = 0;
    this.totalLetters = 0;
    this.correctLetters = 0;
    this.gameStarted = true;
    this.startTime = this.time.now;

    // Reset UI
    this.scoreText.setText('Score: 0');
    this.comboText.setText('Combo: x0').setAlpha(0);

    // Start spawning letters with dynamic timing
    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: () => {
        this.spawnLetter();
        this.currentSpawnDelay = Math.max(
          this.minSpawnDelay,
          this.baseSpawnDelay * Math.pow(0.95, this.difficultyLevel)
        );
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
    const config = {
      type: Phaser.AUTO,
      width: 400,
      height: 600,
      backgroundColor: '#1a1a2e',
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
          max_combo: gameStats.maxCombo
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
          <div className="font-['Orbitron'] text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Score: {gameStats?.score || 0}
          </div>
          <div className="flex gap-2 items-center">
            {gameStats?.maxCombo > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <Trophy className="w-4 h-4" />
                <span className="font-['Orbitron'] text-sm">x{gameStats.maxCombo}</span>
              </div>
            )}
            <Button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-blue-600" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-[400px] aspect-[2/3] bg-[#1a1a2e] rounded-lg overflow-hidden shadow-xl">
        <div id="game-container" className="w-full h-full" />

        {/* Game Over Overlay */}
        {isGameOver && gameStats && (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
            <GameOverMessage
              success={gameStats.success}
              score={gameStats.score}
              time={gameStats.time}
              speed={gameStats.speed}
              maxCombo={gameStats.maxCombo}
              onSubmitScore={handleSubmitScore}
              submitting={submitting}
            />
          </div>
        )}

        {/* Start Game Overlay */}
        {!isGameStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col items-center justify-center">
            <h2 className="text-2xl font-['Orbitron'] text-white mb-4">OIIAI Challenge</h2>
            <Button
              onClick={handleStartGame}
              className="kawaii-button accent text-lg px-8 py-4 transform hover:scale-105 transition-all duration-200 animate-pulse"
            >
              Start Game
            </Button>
            <p className="text-blue-400 mt-4 font-['Orbitron'] text-sm">Press to begin the challenge!</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-blue-700 px-4 py-3 mt-4 font-['Orbitron']">
        <p className="text-sm mb-1">Type <span className="font-bold text-blue-500">O</span>, <span className="font-bold text-amber-500">I</span>, or <span className="font-bold text-indigo-500">A</span> to match the closest letter</p>
        <p className="text-xs text-blue-600">or tap letters to remove them</p>
      </div>
    </div>
  );
};

export default OiiaiGame;
