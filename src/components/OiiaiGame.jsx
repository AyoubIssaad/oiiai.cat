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
    this.catProjectiles = []; // Track active projectiles
    // Fixed column positions for spawning
    this.columnPositions = [80, 160, 240, 320];
    this.lastUsedColumns = [];
  }

  preload() {
    // Load sound effects
    this.load.audio("sound-a", "/sounds/a.wav");
    this.load.audio("sound-o", "/sounds/o.wav");
    this.load.audio("sound-i", "/sounds/i.wav");
    // Load cat image for cannon and projectiles
    this.load.image("cat", "/cat_game.png");
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

  // Create the cat cannon
  this.createCatCannon();

  // Create the danger zone at bottom with gradient
  const dangerGradient = this.add.graphics();
  dangerGradient.fillGradientStyle(0xff6b6b, 0xff8787, 0xffa5a5, 0xffbebe, 1);
  dangerGradient.fillRect(0, 500, 400, 100);

  // Create letter buttons in danger zone
  this.createLetterButtons();

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

  createCatCannon() {
  // Create the cannon base (semi-circle with platform)
  this.cannon = this.add.graphics();

  // Add platform base
  this.cannon.fillStyle(0x2563eb);
  this.cannon.fillRect(160, 560, 80, 10);

  // Add dome/cannon part
  this.cannon.lineStyle(3, 0x4287f5);
  this.cannon.fillStyle(0x2563eb);
  this.cannon.beginPath();
  this.cannon.arc(200, 560, 40, Math.PI, 0, false);
  this.cannon.closePath();
  this.cannon.fillPath();
  this.cannon.strokePath();

  // Add cat sprite on the cannon - now with correct orientation
  this.catSprite = this.add.image(200, 530, 'cat');
  this.catSprite.setScale(0.2);
  this.catSprite.setOrigin(0.5, 0.5);
  this.catSprite.setAngle(180); // Rotate the cat 180 degrees to face upward

  // Add subtle bobbing animation to the cat
  this.tweens.add({
    targets: this.catSprite,
    y: 535,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
}

  createStarfield() {
    // Create graphics for stars
    const stars = this.add.graphics();
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
        star.y += star.speed * (this.game.loop.delta / 1000);
        if (star.y > 600) {
          star.y = 0;
          star.x = Math.random() * 400;
        }
        stars.fillStyle(star.color, star.alpha);
        stars.fillCircle(star.x, star.y, star.size);
      });
    });
  }

  getAvailableSpawnPosition() {
    let availableColumns = this.columnPositions.filter(
      (pos) => !this.lastUsedColumns.includes(pos),
    );

    if (availableColumns.length === 0) {
      availableColumns = [...this.columnPositions];
      this.lastUsedColumns = [];
    }

    const index = Math.floor(Math.random() * availableColumns.length);
    const position = availableColumns[index];

    this.lastUsedColumns.push(position);

    if (this.lastUsedColumns.length > 2) {
      this.lastUsedColumns.shift();
    }

    return position;
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

    const newX = this.getAvailableSpawnPosition();
    const container = this.add.container(newX, -50);

    // Create hexagonal background
    const hexSize = 35;
    const hexagon = this.createHexagon(0, 0, hexSize, colors[randomLetter]);

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

  createLetterButtons() {
    const letters = ["O", "I", "A"];
    const colors = {
      O: 0x3b82f6,
      I: 0xfbbf24,
      A: 0x1d4ed8,
    };
    const buttonWidth = 80;
    const spacing = 40;
    const startX = (400 - (buttonWidth * 3 + spacing * 2)) / 2;
    const buttonY = 520;

    letters.forEach((letter, index) => {
      // Create button background
      const button = this.add.graphics();
      const x = startX + (buttonWidth + spacing) * index;

      // Create hexagonal button
      button.lineStyle(2, 0xffffff, 1);
      button.fillStyle(colors[letter], 0.8);

      const hexPoints = [];
      const hexSize = 25;
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        hexPoints.push({
          x: x + buttonWidth / 2 + hexSize * Math.cos(angle),
          y: buttonY + hexSize * Math.sin(angle),
        });
      }

      button.beginPath();
      button.moveTo(hexPoints[0].x, hexPoints[0].y);
      hexPoints.forEach((point) => button.lineTo(point.x, point.y));
      button.closePath();
      button.fillPath();
      button.strokePath();

      // Add letter text
      const text = this.add
        .text(x + buttonWidth / 2, buttonY, letter, {
          fontFamily: "Orbitron",
          fontSize: "24px",
          fill: "#FFFFFF",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5);

      // Make button interactive
      const hitArea = new Phaser.Geom.Polygon(hexPoints);
      button.setInteractive(hitArea, Phaser.Geom.Polygon.Contains);

      // Add hover effects
      button.on("pointerover", () => {
        button.clear();
        button.lineStyle(2, 0xffffff, 1);
        button.fillStyle(colors[letter], 1);
        button.beginPath();
        button.moveTo(hexPoints[0].x, hexPoints[0].y);
        hexPoints.forEach((point) => button.lineTo(point.x, point.y));
        button.closePath();
        button.fillPath();
        button.strokePath();
        text.setScale(1.1);
      });

      button.on("pointerout", () => {
        button.clear();
        button.lineStyle(2, 0xffffff, 1);
        button.fillStyle(colors[letter], 0.8);
        button.beginPath();
        button.moveTo(hexPoints[0].x, hexPoints[0].y);
        hexPoints.forEach((point) => button.lineTo(point.x, point.y));
        button.closePath();
        button.fillPath();
        button.strokePath();
        text.setScale(1);
      });

      // Add click handler
      button.on("pointerdown", () => {
        if (!this.gameStarted) return;

        // Find matching letter
        const matchingLetters = this.letters
          .filter((l) => l.value === letter)
          .sort((a, b) => b.y - a.y);

        if (matchingLetters.length > 0) {
          this.handleCorrectLetter(matchingLetters[0]);
        }
      });
    });
  }

  update() {
    if (!this.gameStarted) return;

    // Update letters position
    this.letters.forEach((letter) => {
      letter.y += this.speed * (this.game.loop.delta / 1000);

      if (letter.y >= 500) {
        this.gameOver(false);
      }
    });

    // Update projectiles if any
    this.catProjectiles.forEach((projectile) => {
      if (projectile.active) {
        // Check for collisions with letters
        this.letters.forEach((letter) => {
          if (
            Phaser.Geom.Intersects.RectangleToRectangle(
              projectile.getBounds(),
              letter.getBounds(),
            )
          ) {
            this.handleProjectileHit(projectile, letter);
          }
        });
      }
    });
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    const pressedKey = event.key.toUpperCase();
    if (!["O", "I", "A"].includes(pressedKey)) return;

    // Find any letter matching the pressed key
    const matchingLetters = this.letters
      .filter((letter) => letter.value === pressedKey)
      .sort((a, b) => b.y - a.y); // Sort by y position, lowest (highest y value) first

    if (matchingLetters.length > 0) {
      // Take the lowest matching letter
      this.handleCorrectLetter(matchingLetters[0]);
    }
    // If no matching letter is found, do nothing - no penalty
  }

  handleLetterClick(clickedLetter) {
    if (!this.gameStarted) return;

    // Simply handle the letter if clicked
    if (clickedLetter && clickedLetter.value) {
      this.handleCorrectLetter(clickedLetter);
    }
  }

  handleCorrectLetter(targetLetter) {
    // Play sound if not muted
    if (!this.isMuted && this.sounds[targetLetter.value]) {
      this.sounds[targetLetter.value].play();
    }

    // Increment combo
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);

    // Calculate bonus points
    const comboBonus = Math.floor(this.combo / 2) * 2;
    const points = 2 + comboBonus;

    // Show floating score
    this.showFloatingScore(targetLetter.x, targetLetter.y, points);

    // Update combo display
    this.comboText.setText(`Combo: x${this.combo}`);
    this.comboText.setAlpha(1);

    // Shoot cat projectile at the letter
    this.shootCatProjectile(targetLetter);

    // Update score and stats
    this.score += points;
    this.correctLetters++;

    // Update difficulty
    if (this.correctLetters % 5 === 0) {
      this.difficultyLevel++;
      this.speed = Math.min(
        this.maxSpeed,
        this.baseSpeed * (1 + Math.log1p(this.difficultyLevel * 0.3)),
      );
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

  shootCatProjectile(targetLetter) {
    // Create cat projectile
    const projectile = this.add.image(
      this.catSprite.x,
      this.catSprite.y,
      "cat",
    );
    projectile.setScale(0.15);
    projectile.active = true;

    // Calculate angle to target
    const angle = Phaser.Math.Angle.Between(
      projectile.x,
      projectile.y,
      targetLetter.x,
      targetLetter.y,
    );

    // Rotate projectile
    projectile.setRotation(angle + Math.PI / 2);

    // Add to projectiles array
    this.catProjectiles.push(projectile);

    // Create shooting animation
    const distance = Phaser.Math.Distance.Between(
      projectile.x,
      projectile.y,
      targetLetter.x,
      targetLetter.y,
    );

    // Add trail effect
    const trail = this.add.particles(0, 0, {
      speed: 20,
      scale: { start: 0.2, end: 0 },
      blendMode: "ADD",
      lifespan: 200,
      follow: projectile,
    });

    // Shoot animation
    this.tweens.add({
      targets: projectile,
      x: targetLetter.x,
      y: targetLetter.y,
      duration: distance * 2,
      ease: "Linear",
      onComplete: () => {
        this.handleProjectileHit(projectile, targetLetter);
        trail.destroy();
      },
    });

    // Add recoil animation to cannon cat
    this.tweens.add({
      targets: this.catSprite,
      y: this.catSprite.y + 10,
      duration: 50,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  handleProjectileHit(projectile, letter) {
    // Create impact effect
    this.addImpactEffect(letter.x, letter.y);

    // Remove letter with animation
    this.tweens.add({
      targets: letter,
      alpha: 0,
      scale: 1.5,
      duration: 200,
      ease: "Back.easeIn",
      onComplete: () => {
        this.letters = this.letters.filter((l) => l !== letter);
        letter.destroy();
      },
    });

    // Remove projectile
    projectile.active = false;
    projectile.destroy();
    this.catProjectiles = this.catProjectiles.filter((p) => p.active);
  }

  addImpactEffect(x, y) {
    // Create star burst effect
    const particles = this.add.particles(x, y, {
      speed: { min: 50, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.4, end: 0 },
      blendMode: "ADD",
      tint: [0x3b82f6, 0x60a5fa, 0x93c5fd],
      lifespan: 500,
      quantity: 20,
    });

    // Auto-destroy particle emitter
    this.time.delayedCall(500, () => particles.destroy());
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

  getLowestLetter() {
    return this.letters.reduce(
      (lowest, current) => (!lowest || current.y > lowest.y ? current : lowest),
      null,
    );
  }

  startGame() {
    // Clear existing letters and projectiles
    this.letters.forEach((letter) => letter.destroy());
    this.letters = [];
    this.catProjectiles.forEach((projectile) => projectile.destroy());
    this.catProjectiles = [];

    // Reset spawn position tracking
    this.lastUsedColumns = [];

    // Initialize game parameters
    this.baseSpeed = 100;
    this.maxSpeed = 400;
    this.baseSpawnDelay = 1200; // Adjusted for tighter letter spacing
    this.minSpawnDelay = 400; // Adjusted for tighter letter spacing
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

    // Reset cat cannon position and animation
    this.catSprite.setPosition(200, 530);
    this.catSprite.setRotation(0);

    // Start spawning letters
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

    // Add start game animation
    this.cameras.main.flash(500, 0, 0, 0, true);
    this.addGameStartEffect();
  }

  addGameStartEffect() {
    // Create circular wave effect
    const circle = this.add.graphics();
    const startX = 200;
    const startY = 530;

    this.tweens.add({
      targets: { radius: 0, alpha: 1 },
      radius: 300,
      alpha: 0,
      duration: 1000,
      ease: "Quad.easeOut",
      onUpdate: (tween, target) => {
        circle.clear();
        circle.lineStyle(3, 0x3b82f6, target.alpha);
        circle.strokeCircle(startX, startY, target.radius);
      },
      onComplete: () => {
        circle.destroy();
      },
    });

    // Add particles burst from cannon
    const particles = this.add.particles(startX, startY, {
      speed: { min: 100, max: 200 },
      angle: { min: -30, max: 30 },
      scale: { start: 0.4, end: 0 },
      blendMode: "ADD",
      tint: [0x3b82f6, 0x60a5fa],
      lifespan: 1000,
      quantity: 30,
    });

    this.time.delayedCall(1000, () => particles.destroy());
  }

  setMuted(muted) {
    this.isMuted = muted;
    // Update volume for all sound effects
    Object.values(this.sounds).forEach((sound) => {
      sound.setVolume(muted ? 0 : 0.5);
    });
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
  gameOver(success = false) {
    if (!this.gameStarted) return;

    this.gameStarted = false;
    const endTime = this.time.now;
    const duration = (endTime - this.startTime) / 1000;
    const lettersPerSecond = (this.correctLetters / duration).toFixed(2);

    // Clear active projectiles with effects
    this.catProjectiles.forEach((projectile) => {
      this.addImpactEffect(projectile.x, projectile.y);
      projectile.destroy();
    });
    this.catProjectiles = [];

    // Clear letters with effects
    this.letters.forEach((letter) => {
      this.addImpactEffect(letter.x, letter.y);
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

    // Add cat decoration at the top
    const gameCat = this.add.image(0, -80, "cat");
    gameCat.setScale(0.2);
    gameCat.setAngle(180)
    if (!success) {
      gameCat.setTint(0xff6666);  // Red tint for failure
      // gameCat.setAngle(0);        // Flip it back around for failure state
    }

    // Configure text style
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
        .text(0, -30, "Purrfect Run!", messageConfig)
        .setOrigin(0.5);
      const scoreText = this.add
        .text(0, 20, `Score: ${this.score}`, messageConfig)
        .setOrigin(0.5);
      const speedText = this.add
        .text(0, 60, `${lettersPerSecond} letters/sec`, {
          ...messageConfig,
          fontSize: "20px",
        })
        .setOrigin(0.5);

      messageContainer.add([bg, gameCat, messageText, scoreText, speedText]);
      this.addCelebrationParticles();
    } else {
      const messageText = this.add
        .text(0, -30, "Game Over!", {
          ...messageConfig,
          fontSize: "32px",
        })
        .setOrigin(0.5);

      const scoreText = this.add
        .text(0, 20, `Score: ${this.score}`, {
          ...messageConfig,
          fontSize: "24px",
        })
        .setOrigin(0.5);

      const comboText = this.add
        .text(0, 60, `Max Combo: x${this.maxCombo}`, {
          ...messageConfig,
          fontSize: "20px",
          fill: "#60A5FA",
        })
        .setOrigin(0.5);

      // Create retry button
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(0x2563eb, 0.8);
      buttonBg.fillRoundedRect(-80, 90, 160, 40, 8);
      buttonBg.lineStyle(2, 0x60a5fa);
      buttonBg.strokeRoundedRect(-80, 90, 160, 40, 8);

      const buttonText = this.add
        .text(0, 110, "Try Again", {
          ...messageConfig,
          fontSize: "20px",
        })
        .setOrigin(0.5);

      // Make button interactive
      buttonBg
        .setInteractive(
          new Phaser.Geom.Rectangle(-80, 90, 160, 40),
          Phaser.Geom.Rectangle.Contains,
        )
        .on("pointerover", () => {
          buttonBg.clear();
          buttonBg.fillStyle(0x3b82f6, 0.8);
          buttonBg.fillRoundedRect(-80, 90, 160, 40, 8);
          buttonBg.lineStyle(2, 0x93c5fd);
          buttonBg.strokeRoundedRect(-80, 90, 160, 40, 8);
          buttonText.setScale(1.1);
        })
        .on("pointerout", () => {
          buttonBg.clear();
          buttonBg.fillStyle(0x2563eb, 0.8);
          buttonBg.fillRoundedRect(-80, 90, 160, 40, 8);
          buttonBg.lineStyle(2, 0x60a5fa);
          buttonBg.strokeRoundedRect(-80, 90, 160, 40, 8);
          buttonText.setScale(1);
        })
        .on("pointerdown", () => {
          messageContainer.destroy();
          this.startGame();
        });

      messageContainer.add([
        bg,
        gameCat,
        messageText,
        scoreText,
        comboText,
        buttonBg,
        buttonText,
      ]);
    }

    // Add container animation
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.8);
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: "Back.easeOut",
    });

    // Add cat spinning animation
    this.tweens.add({
      targets: gameCat,
      angle: success ? 360 : 540, // Spin once for success, 1.5 times for failure
      duration: 1000,
      ease: "Cubic.easeOut",
    });

    // Shake camera on failure
    if (!success) {
      this.cameras.main.shake(500, 0.01);
    }

    // Call game over callback with stats
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
              OIIAI Cat Challenge
            </h2>
            <Button
              onClick={handleStartGame}
              className="kawaii-button accent text-lg px-8 py-4 transform hover:scale-105 transition-all duration-200 animate-pulse"
            >
              Start Game
            </Button>
            <p className="text-blue-400 mt-4 font-['Orbitron'] text-sm">
              Help the cat shoot down the letters!
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-blue-700 px-4 py-3 mt-4 font-['Orbitron']">
        <p className="text-sm mb-1">
          Type <span className="font-bold text-blue-500">O</span>,{" "}
          <span className="font-bold text-amber-500">I</span>, or{" "}
          <span className="font-bold text-indigo-500">A</span> to shoot the cat
        </p>
        <p className="text-xs text-blue-600">or tap letters to target them</p>
      </div>
    </div>
  );
};

export default OiiaiGame;
