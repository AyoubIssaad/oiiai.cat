import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { Button } from "./ui/Button";
import { Volume2, VolumeX, Trophy } from "lucide-react";

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
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
    this.sounds = {};
    this.isMuted = false;
    // Fixed column positions for spawning
    this.columnPositions = [80, 160, 240, 320];
    this.lastUsedColumns = [];
  }

  preload() {
    // Load sound effects
    this.load.audio("sound-a", "/sounds/a.wav");
    this.load.audio("sound-o", "/sounds/o.wav");
    this.load.audio("sound-i", "/sounds/i.wav");
  }

  getAvailableSpawnPosition() {
    // Filter out recently used columns
    let availableColumns = this.columnPositions.filter(
      (pos) => !this.lastUsedColumns.includes(pos),
    );

    // If all columns were recently used, reset the tracking
    if (availableColumns.length === 0) {
      availableColumns = [...this.columnPositions];
      this.lastUsedColumns = [];
    }

    // Get a random available column
    const index = Math.floor(Math.random() * availableColumns.length);
    const position = availableColumns[index];

    // Track this column as recently used
    this.lastUsedColumns.push(position);

    // Keep only the last 2 used columns in memory
    if (this.lastUsedColumns.length > 2) {
      this.lastUsedColumns.shift();
    }

    return position;
  }

  create() {
    // Initialize sounds
    this.sounds = {
      A: this.sound.add("sound-a", { volume: 0.5 }),
      O: this.sound.add("sound-o", { volume: 0.5 }),
      I: this.sound.add("sound-i", { volume: 0.5 }),
    };

    // Create a starfield background effect
    this.createStarfield();

    // Create the danger zone at bottom
    const dangerGradient = this.add.graphics();
    dangerGradient.fillGradientStyle(0xff6b6b, 0xff8787, 0xffa5a5, 0xffbebe, 1);
    dangerGradient.fillRect(0, 500, 400, 100);

    // Add pulsing effect to danger zone
    this.tweens.add({
      targets: dangerGradient,
      alpha: 0.8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Create danger line
    this.dangerLine = this.add.graphics();
    this.dangerLine.lineStyle(3, 0xef5350, 1);
    this.dangerLine.lineBetween(0, 500, 400, 500);

    // Add pulsing glow to danger line
    this.tweens.add({
      targets: this.dangerLine,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Add score display
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontFamily: "Orbitron",
      fontSize: "24px",
      fill: "#3B82F6",
      padding: { x: 10, y: 5 },
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      borderRadius: 5,
    });

    // Add combo display
    this.comboText = this.add.text(20, 60, "Combo: x1", {
      fontFamily: "Orbitron",
      fontSize: "20px",
      fill: "#60A5FA",
      padding: { x: 10, y: 5 },
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      borderRadius: 5,
      alpha: 0,
    });

    // Setup keyboard input
    this.input.keyboard.on("keydown", this.handleKeyPress, this);
  }

  createStarfield() {
    // Create graphics for stars
    const stars = this.add.graphics();

    // Create an array to store star positions and properties
    this.starField = [];

    // Initialize stars
    for (let i = 0; i < 50; i++) {
      this.starField.push({
        x: Math.random() * 400,
        y: Math.random() * 600,
        speed: Math.random() * 30 + 20,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        color: Phaser.Display.Color.GetColor(
          155 + Math.random() * 100,
          155 + Math.random() * 100,
          255,
        ),
      });
    }

    // Create update event for star animation
    this.events.on("update", () => {
      stars.clear();

      this.starField.forEach((star) => {
        // Update star position
        star.y += star.speed * (this.game.loop.delta / 1000);

        // Reset star if it goes off screen
        if (star.y > 600) {
          star.y = 0;
          star.x = Math.random() * 400;
        }

        // Draw star
        stars.fillStyle(star.color, star.alpha);
        stars.fillCircle(star.x, star.y, star.size);
      });
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
        y: y + size * Math.sin(angle),
      });
    }

    hexagon.beginPath();
    hexagon.moveTo(points[0].x, points[0].y);
    points.forEach((point) => hexagon.lineTo(point.x, point.y));
    hexagon.closePath();
    hexagon.fillPath();
    hexagon.strokePath();

    return hexagon;
  }

  spawnLetter() {
    if (!this.gameStarted) return;

    const letters = ["O", "I", "A"];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const colors = {
      O: 0x3b82f6,
      I: 0xfbbf24,
      A: 0x1d4ed8,
    };

    // Get spawn position using fixed columns
    const newX = this.getAvailableSpawnPosition();

    // Create letter container
    const container = this.add.container(newX, -50);

    // Create hexagonal background
    const hexSize = 35;
    const hexagon = this.createHexagon(0, 0, hexSize, colors[randomLetter]);

    // Make container interactive
    const hitArea = new Phaser.Geom.Polygon(
      [...Array(6).keys()].map((i) => {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        return new Phaser.Geom.Point(
          hexSize * Math.cos(angle),
          hexSize * Math.sin(angle),
        );
      }),
    );

    container.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);
    container.on("pointerdown", () => this.handleLetterClick(container));

    // Add letter text
    const text = this.add
      .text(0, 0, randomLetter, {
        fontFamily: "Orbitron",
        fontSize: "40px",
        fill: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { blur: 0, stroke: true, fill: true },
      })
      .setOrigin(0.5);

    // Add entry animation
    container.alpha = 0;
    container.scale = 0.5;
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: "Back.easeOut",
    });

    container.add([hexagon, text]);
    container.value = randomLetter;
    this.letters.push(container);
    this.totalLetters++;
  }

  handleCorrectLetter() {
    const lowestLetter = this.getLowestLetter();
    if (lowestLetter) {
      // Play the corresponding sound if not muted
      if (!this.isMuted && this.sounds[lowestLetter.value]) {
        this.sounds[lowestLetter.value].play();
      }

      // Increment combo
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      // Calculate bonus points based on combo
      const comboBonus = Math.floor(this.combo / 2) * 2;
      const points = 2 + comboBonus;

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
        ease: "Back.easeIn",
        onComplete: () => {
          this.letters = this.letters.filter((l) => l !== lowestLetter);
          lowestLetter.destroy();
        },
      });

      this.score += points;
      this.correctLetters++;

      // Update difficulty every 5 correct letters
      if (this.correctLetters % 5 === 0) {
        this.difficultyLevel++;

        // Gradually increase speed
        this.speed = Math.min(
          this.maxSpeed,
          this.baseSpeed * (1 + Math.log1p(this.difficultyLevel * 0.3)),
        );

        // Gradually decrease spawn delay
        this.currentSpawnDelay = Math.max(
          this.minSpawnDelay,
          this.baseSpawnDelay * Math.pow(0.95, this.difficultyLevel),
        );

        if (this.spawnTimer) {
          this.spawnTimer.delay = this.currentSpawnDelay;
        }
      }

      this.scoreText.setText(`Score: ${this.score}`);
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  showFloatingScore(x, y, points) {
    const floatingText = this.add
      .text(x, y, `+${points}`, {
        fontFamily: "Orbitron",
        fontSize: "20px",
        fill: "#60A5FA",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: "Cubic.easeOut",
      onComplete: () => floatingText.destroy(),
    });
  }

  addSuccessParticles(x, y) {
    const particles = [];
    const totalParticles = 10;

    for (let i = 0; i < totalParticles; i++) {
      const angle = ((Math.PI * 2) / totalParticles) * i;
      const speed = Phaser.Math.Between(50, 150);
      const particle = this.add.circle(x, y, 3, 0x60a5fa);

      particles.push({
        gameObject: particle,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        gravity: 200,
        alpha: 1,
        scale: 1,
      });
    }

    // Create update event for particle animation
    const particleEvent = this.events.addListener("update", (time, delta) => {
      const dt = delta / 1000;

      particles.forEach((particle) => {
        // Update position
        particle.velocityY += particle.gravity * dt;
        particle.gameObject.x += particle.velocityX * dt;
        particle.gameObject.y += particle.velocityY * dt;

        // Update appearance
        particle.alpha -= dt;
        particle.scale -= dt;

        particle.gameObject.setAlpha(Math.max(0, particle.alpha));
        particle.gameObject.setScale(Math.max(0, particle.scale));
      });

      // Check if all particles are invisible
      if (particles.every((p) => p.alpha <= 0)) {
        // Clean up
        particles.forEach((p) => p.gameObject.destroy());
        this.events.removeListener("update", particleEvent);
      }
    });
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    // Convert to uppercase for consistency
    const pressedKey = event.key.toUpperCase();

    // Only respond to O, I, and A keys
    if (!["O", "I", "A"].includes(pressedKey)) {
      return; // Ignore any other key press
    }

    const lowestLetter = this.getLowestLetter();
    if (lowestLetter && lowestLetter.value === pressedKey) {
      this.handleCorrectLetter();
    } else if (lowestLetter) {
      // Wrong key pressed - game over
      this.combo = 0;
      this.comboText.setAlpha(0.5);
      this.gameOver(false);
    }
  }

  handleLetterClick(clickedLetter) {
    if (!this.gameStarted) return;

    const lowestLetter = this.getLowestLetter();
    if (clickedLetter === lowestLetter) {
      // Only handle as correct if clicking the right letter value
      if (clickedLetter.value === lowestLetter.value) {
        this.handleCorrectLetter();
      } else {
        // Wrong letter clicked - game over
        this.combo = 0;
        this.comboText.setAlpha(0.5);
        this.gameOver(false);
      }
    } else {
      // Clicking wrong position - game over
      this.combo = 0;
      this.comboText.setAlpha(0.5);
      this.gameOver(false);
    }
  }

  update() {
    if (!this.gameStarted) return;

    this.letters.forEach((letter) => {
      letter.y += this.speed * (this.game.loop.delta / 1000);

      if (letter.y >= 500) {
        this.gameOver(false);
      }
    });
  }

  getLowestLetter() {
    return this.letters.reduce(
      (lowest, current) => (!lowest || current.y > lowest.y ? current : lowest),
      null,
    );
  }

  gameOver(success = false) {
    if (!this.gameStarted) return;

    this.gameStarted = false;
    const endTime = this.time.now;
    const duration = (endTime - this.startTime) / 1000;
    const lettersPerSecond = (this.correctLetters / duration).toFixed(2);

    // Clear letters with particles
    this.letters.forEach((letter) => {
      this.addSuccessParticles(letter.x, letter.y);
      letter.destroy();
    });
    this.letters = [];

    // Show game over message
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const messageContainer = this.add.container(centerX, centerY);

    // Create modern glass-like background with gradient
    const bg = this.add.graphics();

    // Add outer glow effect
    bg.lineStyle(4, success ? 0x4ade80 : 0xef4444, 0.3);
    bg.strokeRoundedRect(-155, -105, 310, 210, 20);

    // Main background with gradient
    bg.fillGradientStyle(
      0x1a1a2e,
      0x1a1a2e,
      0x2a2a3e,
      0x2a2a3e,
      0.95,
      0.95,
      0.95,
      0.95,
    );
    bg.fillRoundedRect(-150, -100, 300, 200, 16);

    // Inner border
    bg.lineStyle(2, success ? 0x4ade80 : 0xef4444, 0.8);
    bg.strokeRoundedRect(-150, -100, 300, 200, 16);

    // Add subtle inner glow
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(1, success ? 0x4ade80 : 0xef4444, 0.2);
    innerGlow.strokeRoundedRect(-145, -95, 290, 190, 14);

    messageContainer.add([bg, innerGlow]);

    // Configure text style with enhanced visibility
    const messageConfig = {
      fontFamily: "Orbitron",
      fontSize: "28px",
      fontWeight: "bold",
      fill: "#FFFFFF",
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      shadow: { blur: 2, color: "#000000", fill: true, offsetX: 1, offsetY: 1 },
    };

    if (success) {
      const messageText = this.add
        .text(0, -60, "Perfect Run!", messageConfig)
        .setOrigin(0.5);
      const scoreText = this.add
        .text(0, -10, `Score: ${this.score}`, messageConfig)
        .setOrigin(0.5);
      const speedText = this.add
        .text(0, 40, `${lettersPerSecond} letters/sec`, {
          ...messageConfig,
          fontSize: "20px",
        })
        .setOrigin(0.5);

      messageContainer.add([messageText, scoreText, speedText]);
      this.addCelebrationParticles();
    } else {
      const messageText = this.add
        .text(0, -70, "Game Over!", {
          ...messageConfig,
          fontSize: "32px",
        })
        .setOrigin(0.5);

      const scoreText = this.add
        .text(0, -20, `Score: ${this.score}`, {
          ...messageConfig,
          fontSize: "24px",
        })
        .setOrigin(0.5);

      const comboText = this.add
        .text(0, 20, `Max Combo: x${this.maxCombo}`, {
          ...messageConfig,
          fontSize: "20px",
          fill: "#60A5FA",
        })
        .setOrigin(0.5);

      // Create interactive retry button with modern styling
      const buttonBg = this.add.graphics();

      // Button shadow
      buttonBg.fillStyle(0x1d4ed8, 0.3);
      buttonBg.fillRoundedRect(-78, 52, 156, 38, 8);

      // Button gradient
      buttonBg.fillGradientStyle(0x2563eb, 0x2563eb, 0x1d4ed8, 0x1d4ed8, 1);
      buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);

      // Button border with glow
      buttonBg.lineStyle(2, 0x60a5fa, 1);
      buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);

      // Add subtle inner glow
      buttonBg.lineStyle(1, 0x93c5fd, 0.5);
      buttonBg.strokeRoundedRect(-77, 53, 154, 34, 6);

      const buttonText = this.add
        .text(0, 70, "Try Again", {
          ...messageConfig,
          fontSize: "20px",
        })
        .setOrigin(0.5);

      // Make button interactive with enhanced hover effects
      const buttonHitArea = new Phaser.Geom.Rectangle(-80, 50, 160, 40);
      buttonBg
        .setInteractive(buttonHitArea, Phaser.Geom.Rectangle.Contains)
        .on("pointerover", () => {
          buttonBg.clear();
          // Enhanced hover effect
          // Larger shadow
          buttonBg.fillStyle(0x1d4ed8, 0.4);
          buttonBg.fillRoundedRect(-77, 53, 154, 38, 8);
          // Brighter gradient
          buttonBg.fillGradientStyle(0x3b82f6, 0x3b82f6, 0x2563eb, 0x2563eb, 1);
          buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);
          // Brighter border with enhanced glow
          buttonBg.lineStyle(2, 0x93c5fd, 1);
          buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);
          // Enhanced inner glow
          buttonBg.lineStyle(1, 0xbfdbfe, 0.6);
          buttonBg.strokeRoundedRect(-77, 53, 154, 34, 6);
          buttonText.setScale(1.1);
        })
        .on("pointerout", () => {
          buttonBg.clear();
          // Reset to normal state
          buttonBg.fillStyle(0x1d4ed8, 0.3);
          buttonBg.fillRoundedRect(-78, 52, 156, 38, 8);
          buttonBg.fillGradientStyle(0x2563eb, 0x2563eb, 0x1d4ed8, 0x1d4ed8, 1);
          buttonBg.fillRoundedRect(-80, 50, 160, 40, 8);
          buttonBg.lineStyle(2, 0x60a5fa, 1);
          buttonBg.strokeRoundedRect(-80, 50, 160, 40, 8);
          buttonBg.lineStyle(1, 0x93c5fd, 0.5);
          buttonBg.strokeRoundedRect(-77, 53, 154, 34, 6);
          buttonText.setScale(1);
        })
        .on("pointerdown", () => {
          messageContainer.destroy();
          this.startGame();
        });

      messageContainer.add([
        messageText,
        scoreText,
        comboText,
        buttonBg,
        buttonText,
      ]);
    }

    // Add fade-in animation with bounce
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.8);
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    // Shake camera on failure
    if (!success) {
      this.cameras.main.shake(500, 0.01);
    }

    if (this.onGameOver) {
      this.onGameOver({
        success,
        score: this.score,
        time: duration.toFixed(2),
        speed: lettersPerSecond,
        totalLetters: this.totalLetters,
        correctLetters: this.correctLetters,
        maxCombo: this.maxCombo,
      });
    }
  }

  addCelebrationParticles() {
    const particles = this.add.particles(0, 0, {
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      blendMode: "ADD",
      lifespan: 2000,
      gravityY: 300,
      emitting: false,
    });

    particles.createEmitter({
      frame: "white",
      quantity: 30,
      color: [0x4ade80, 0x60a5fa, 0xfbbf24],
      emitCallback: (particle) => {
        particle.velocityX = (Math.random() - 0.5) * 400;
        particle.velocityY = Math.random() * -300;
      },
    });

    particles.emitParticleAt(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
    );

    this.time.delayedCall(2000, () => particles.destroy());
  }

  startGame() {
    // Clear any existing letters
    this.letters.forEach((letter) => letter.destroy());
    this.letters = [];

    // Reset spawn position tracking
    this.lastUsedColumns = [];

    // Initialize game parameters
    this.baseSpeed = 80;
    this.maxSpeed = 400;
    this.baseSpawnDelay = 2000;
    this.minSpawnDelay = 500;
    this.currentSpawnDelay = this.baseSpawnDelay;
    this.speed = this.baseSpeed;
    this.difficultyLevel = 1;
    this.combo = 0;
    this.maxCombo = 0;
    this.score = 0;
    this.totalLetters = 0;
    this.correctLetters = 0;
    this.gameStarted = true;
    this.startTime = this.time.now;

    // Reset UI
    this.scoreText.setText("Score: 0");
    this.comboText.setText("Combo: x0").setAlpha(0);

    // Start spawning letters with fixed delay to maintain spacing
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    this.spawnTimer = this.time.addEvent({
      delay: this.currentSpawnDelay,
      callback: () => {
        this.spawnLetter();
        // Update spawn delay for next letter
        this.currentSpawnDelay = Math.max(
          this.minSpawnDelay,
          this.baseSpawnDelay * Math.pow(0.95, this.difficultyLevel),
        );
        this.spawnTimer.delay = this.currentSpawnDelay;
      },
      callbackScope: this,
      loop: true,
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
    const initGame = async () => {
      const config = {
        type: Phaser.AUTO,
        width: 400,
        height: 600,
        backgroundColor: "#1a1a2e",
        parent: "game-container",
        scene: MainScene,
        physics: {
          default: "arcade",
          arcade: {
            debug: false,
            gravity: { y: 0 },
          },
        },
      };

      gameRef.current = new Phaser.Game(config);

      // Wait for the scene to be ready
      await new Promise((resolve) => {
        const checkScene = () => {
          const scene = gameRef.current?.scene.getScene("MainScene");
          if (scene) {
            scene.onGameOver = (stats) => {
              setGameStats(stats);
              setIsGameOver(true);
              setIsGameStarted(false);
            };
            scene.setMuted(isMuted);
            resolve();
          } else {
            setTimeout(checkScene, 100);
          }
        };
        checkScene();
      });
    };

    initGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // Initial game setup

  // Handle mute state changes
  useEffect(() => {
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScene("MainScene");
      if (scene) {
        scene.setMuted(isMuted);
      }
    }
  }, [isMuted]);

  const handleStartGame = () => {
    const scene = gameRef.current?.scene.getScene("MainScene");
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
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_name: playerName,
          score: gameStats.score,
          time: parseFloat(gameStats.time),
          letters_per_second: parseFloat(gameStats.speed),
          total_letters: gameStats.totalLetters,
          correct_letters: gameStats.correctLetters,
          max_combo: gameStats.maxCombo,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit score");
      }

      if (onShowLeaderboard) {
        onShowLeaderboard();
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      alert("Failed to submit score. Please try again.");
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
                <span className="font-['Orbitron'] text-sm">
                  x{gameStats.maxCombo}
                </span>
              </div>
            )}
            <Button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 hover:bg-blue-200 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-blue-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-blue-600" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-[400px] aspect-[2/3] bg-[#1a1a2e] rounded-lg overflow-hidden shadow-xl">
        <div id="game-container" className="w-full h-full" />

        {/* Start Game Overlay */}
        {!isGameStarted && !isGameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col items-center justify-center">
            <h2 className="text-2xl font-['Orbitron'] text-white mb-4">
              OIIAI Challenge
            </h2>
            <Button
              onClick={handleStartGame}
              className="kawaii-button accent text-lg px-8 py-4 transform hover:scale-105 transition-all duration-200 animate-pulse"
            >
              Start Game
            </Button>
            <p className="text-blue-400 mt-4 font-['Orbitron'] text-sm">
              Press to begin the challenge!
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-blue-700 px-4 py-3 mt-4 font-['Orbitron']">
        <p className="text-sm mb-1">
          Type <span className="font-bold text-blue-500">O</span>,{" "}
          <span className="font-bold text-amber-500">I</span>, or{" "}
          <span className="font-bold text-indigo-500">A</span> to match the
          closest letter
        </p>
        <p className="text-xs text-blue-600">or tap letters to remove them</p>
      </div>
    </div>
  );
};

export default OiiaiGame;
