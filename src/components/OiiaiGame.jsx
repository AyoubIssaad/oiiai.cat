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
    this.targetedLetters = new Set();
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

    // Create the danger zone at bottom with adjusted height
    const dangerGradient = this.add.graphics();
    dangerGradient.fillGradientStyle(0xff6b6b, 0xff8787, 0xffa5a5, 0xffbebe, 1);
    dangerGradient.fillRect(0, 500, 400, 100); // Keep starting at 500, but ensure it's visible

    // Create the cat cannon first (so it appears under the buttons)
    this.createCatCannon();

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

    // Make the dome smaller and more subtle
    this.cannon.lineStyle(2, 0x4287f5, 0.5); // Thinner line, more transparent
    this.cannon.fillStyle(0x2563eb, 0.3); // More transparent fill
    this.cannon.beginPath();
    this.cannon.arc(200, 545, 30, Math.PI, 0, false); // Smaller radius (30 instead of 40)
    this.cannon.closePath();
    this.cannon.fillPath();
    this.cannon.strokePath();

    // Move the cat sprite up slightly to sit on top of the dome
    this.catSprite = this.add.image(200, 520, "cat"); // Moved up to better position
    this.catSprite.setScale(0.18); // Slightly smaller
    this.catSprite.setOrigin(0.5, 0.5);
    this.catSprite.setAngle(180);

    // Adjust bobbing animation to be more subtle
    this.tweens.add({
      targets: this.catSprite,
      y: 523, // Smaller range of motion
      duration: 1500, // Slower bobbing
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
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
      A: 0xfc5130,
    };

    const newX = this.getAvailableSpawnPosition();
    const container = this.add.container(newX, -50);

    // Create hexagonal background with smaller size
    const hexSize = 25; // Reduced from 35
    const hexagon = this.createHexagon(0, 0, hexSize, colors[randomLetter]);

    // Add letter text with smaller font size
    const text = this.add
      .text(0, 0, randomLetter, {
        fontFamily: "Orbitron",
        fontSize: "28px", // Reduced from 40px
        fill: "#FFFFFF",
        stroke: "#000000",
        strokeThickness: 3, // Slightly reduced from 4
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
      A: 0xfc5130,
    };
    const buttonWidth = 80;
    const spacing = 50; // Increased spacing between buttons
    const startX = (400 - (buttonWidth * 3 + spacing * 2)) / 2;
    const buttonY = 555; // Moved buttons slightly lower

    letters.forEach((letter, index) => {
      // Create button background
      const button = this.add.graphics();
      const x = startX + (buttonWidth + spacing) * index;

      // Create hexagonal button
      button.lineStyle(2, 0xffffff, 1);
      button.fillStyle(colors[letter], 0.8);

      const hexPoints = [];
      const hexSize = 22; // Slightly smaller hexagons
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
          fontSize: "22px", // Slightly smaller text
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

        // Find matching letter that isn't already targeted
        const matchingLetters = this.letters
          .filter((l) => l.value === letter && !this.targetedLetters.has(l))
          .sort((a, b) => b.y - a.y);

        if (matchingLetters.length > 0) {
          const targetLetter = matchingLetters[0];
          this.targetedLetters.add(targetLetter); // Mark as targeted
          this.handleCorrectLetter(targetLetter);
        } else {
          this.handleIncorrectInput();
        }
      });
    });
  }
  handleIncorrectInput() {
    // Create a red flash effect
    this.cameras.main.flash(300, 255, 0, 0, true);

    // Add screen shake
    this.cameras.main.shake(200, 0.01);

    // Reset combo
    this.combo = 0;
    this.comboText.setText("Combo: x0").setAlpha(0);

    // Game over
    this.gameOver(false);
  }

  update() {
    if (!this.gameStarted) return;

    // Update letters position and check for out of bounds
    this.letters.forEach((letter) => {
      letter.y += this.speed * (this.game.loop.delta / 1000);

      if (letter.y >= 500) {
        // Remove from targeted set before destroying
        this.targetedLetters.delete(letter);
        this.letters = this.letters.filter((l) => l !== letter);
        letter.destroy();
        this.gameOver(false);
      }
    });

    // Clean up any targeted letters that no longer exist
    for (const targetedLetter of this.targetedLetters) {
      if (!this.letters.includes(targetedLetter)) {
        this.targetedLetters.delete(targetedLetter);
      }
    }
  }

  handleKeyPress(event) {
    if (!this.gameStarted || this.letters.length === 0) return;

    const pressedKey = event.key.toUpperCase();
    if (!["O", "I", "A"].includes(pressedKey)) return;

    // Find any letter matching the pressed key that isn't already being targeted
    const matchingLetters = this.letters
      .filter(
        (letter) =>
          letter.value === pressedKey && !this.targetedLetters.has(letter),
      )
      .sort((a, b) => b.y - a.y); // Sort by y position, lowest first

    if (matchingLetters.length > 0) {
      const targetLetter = matchingLetters[0];
      this.targetedLetters.add(targetLetter);
      this.handleCorrectLetter(targetLetter);
    } else {
      // No matching letters found - this is a mistake
      this.handleIncorrectInput();
    }
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

    // Calculate distance for speed calculation
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
      lifespan: 100, // Shorter trail for faster projectile
      follow: projectile,
    });

    // Shoot animation - much faster now
    this.tweens.add({
      targets: projectile,
      x: targetLetter.x,
      y: targetLetter.y,
      duration: distance * 0.8, // Reduced from 2 to 0.8 for faster movement
      ease: "Linear",
      onComplete: () => {
        this.handleProjectileHit(projectile, targetLetter);
        trail.destroy();
      },
    });

    // Add quicker recoil animation to cannon cat
    this.tweens.add({
      targets: this.catSprite,
      y: this.catSprite.y + 10,
      duration: 30, // Faster recoil
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  handleProjectileHit(projectile, letter) {
    // Remove letter from targeted set when hit
    this.targetedLetters.delete(letter);

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
    this.letters.forEach((letter) => {
      this.targetedLetters.delete(letter);
      letter.destroy();
    });
    this.letters = [];
    this.catProjectiles.forEach((projectile) => projectile.destroy());
    this.catProjectiles = [];
    this.targetedLetters.clear();

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

    // Clear all letters and targets
    this.letters.forEach((letter) => {
      this.targetedLetters.delete(letter);
      this.addImpactEffect(letter.x, letter.y);
      letter.destroy();
    });
    this.letters = [];
    this.targetedLetters.clear();

    // Clear active projectiles with effects
    this.catProjectiles.forEach((projectile) => {
      this.addImpactEffect(projectile.x, projectile.y);
      projectile.destroy();
    });
    this.catProjectiles = [];

    // Stop any ongoing game systems
    if (this.spawnTimer) {
      this.spawnTimer.remove();
    }

    // Create game over UI
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const messageContainer = this.add.container(centerX, centerY);

    // Create background with blue border
    const bg = this.add.graphics();
    bg.lineStyle(3, 0x3b82f6, 1);
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-155, -125, 310, 250, 16);
    bg.strokeRoundedRect(-155, -125, 310, 250, 16);

    // Add cat decoration
    const gameCat = this.add.image(0, -85, "cat");
    gameCat.setScale(0.18);
    gameCat.setRotation(Math.PI);
    if (!success) {
      gameCat.setTint(0xff6666);
    }

    // Game Over text
    const messageText = this.add
      .text(0, -30, "Game Over!", {
        fontFamily: "Orbitron",
        fontSize: "32px",
        fill: "#FFFFFF",
        align: "center",
      })
      .setOrigin(0.5);

    // Score text
    const scoreText = this.add
      .text(0, 10, `Score: ${this.score}`, {
        fontFamily: "Orbitron",
        fontSize: "24px",
        fill: "#60A5FA",
        align: "center",
      })
      .setOrigin(0.5);

    // Max combo text
    const comboText = this.add
      .text(0, 45, `Max Combo: x${this.maxCombo}`, {
        fontFamily: "Orbitron",
        fontSize: "20px",
        fill: "#60A5FA",
        align: "center",
      })
      .setOrigin(0.5);

    // Create Try Again button
    const tryAgainBg = this.add.graphics();
    tryAgainBg.fillStyle(0x3b82f6, 1);
    tryAgainBg.fillRoundedRect(-80, 70, 160, 40, 8);

    const tryAgainText = this.add
      .text(0, 90, "Try Again", {
        fontFamily: "Orbitron",
        fontSize: "20px",
        fill: "#FFFFFF",
        align: "center",
      })
      .setOrigin(0.5);

    // Create Cancel button
    const cancelText = this.add
      .text(0, 135, "Cancel", {
        fontFamily: "Orbitron",
        fontSize: "16px",
        fill: "#9CA3AF",
        align: "center",
      })
      .setOrigin(0.5);

    // Make Try Again button interactive
    tryAgainBg.setInteractive(
      new Phaser.Geom.Rectangle(-80, 70, 160, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    // Add hover effects
    tryAgainBg.on("pointerover", () => {
      tryAgainBg.clear();
      tryAgainBg.fillStyle(0x2563eb, 1);
      tryAgainBg.fillRoundedRect(-80, 70, 160, 40, 8);
      tryAgainText.setScale(1.05);
    });

    tryAgainBg.on("pointerout", () => {
      tryAgainBg.clear();
      tryAgainBg.fillStyle(0x3b82f6, 1);
      tryAgainBg.fillRoundedRect(-80, 70, 160, 40, 8);
      tryAgainText.setScale(1);
    });

    // Make Cancel text interactive
    cancelText.setInteractive();
    cancelText.on("pointerover", () => cancelText.setScale(1.05));
    cancelText.on("pointerout", () => cancelText.setScale(1));

    // Add button functionality
    tryAgainBg.on("pointerdown", () => {
      messageContainer.destroy();
      this.startGame();
    });

    cancelText.on("pointerdown", () => {
      messageContainer.destroy();
    });

    // Add all elements to container
    messageContainer.add([
      bg,
      gameCat,
      messageText,
      scoreText,
      comboText,
      tryAgainBg,
      tryAgainText,
      cancelText,
    ]);

    // Add container animation
    messageContainer.setAlpha(0);
    messageContainer.setScale(0.8);
    this.tweens.add({
      targets: messageContainer,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Add cat spinning animation
    this.tweens.add({
      targets: gameCat,
      angle: 360,
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

  showGameOverScreen(stats) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Create container for game over screen
    const container = this.add.container(centerX, centerY);

    // Create modern glass-like background with gradient
    const bg = this.add.graphics();

    // Add outer glow effect
    bg.lineStyle(4, 0x3b82f6, 0.3);
    bg.strokeRoundedRect(-190, -140, 380, 280, 20);

    // Main background with gradient and blue border
    bg.lineStyle(2, 0x3b82f6, 1);
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2a2a3e, 0x2a2a3e, 0.95);
    bg.fillRoundedRect(-180, -130, 360, 260, 16);
    bg.strokeRoundedRect(-180, -130, 360, 260, 16);

    // Title text
    const titleText = this.add
      .text(0, -100, "Submit Your Score", {
        fontFamily: "Orbitron",
        fontSize: "28px",
        fill: "#3B82F6",
        align: "center",
      })
      .setOrigin(0.5);

    // Game Over text
    const gameOverText = this.add
      .text(0, -50, "Game Over!", {
        fontFamily: "Orbitron",
        fontSize: "32px",
        fill: "#FFFFFF",
        align: "center",
      })
      .setOrigin(0.5);

    // Score text
    const scoreText = this.add
      .text(0, 0, `Score: ${stats.score}`, {
        fontFamily: "Orbitron",
        fontSize: "24px",
        fill: "#60A5FA",
        align: "center",
      })
      .setOrigin(0.5);

    // Max combo text
    const comboText = this.add
      .text(0, 40, `Max Combo: x${stats.maxCombo}`, {
        fontFamily: "Orbitron",
        fontSize: "20px",
        fill: "#60A5FA",
        align: "center",
      })
      .setOrigin(0.5);

    // Add game cat decoration
    const gameCat = this.add.image(0, -160, "cat");
    gameCat.setScale(0.2);
    gameCat.setAngle(180);
    if (!stats.success) {
      gameCat.setTint(0xff6666);
    }

    // Try Again button with blue gradient
    const tryAgainButton = this.add.graphics();
    tryAgainButton.fillGradientStyle(0x3b82f6, 0x3b82f6, 0x2563eb, 0x2563eb, 1);
    tryAgainButton.fillRoundedRect(-100, 80, 200, 40, 8);
    tryAgainButton.lineStyle(2, 0x60a5fa);
    tryAgainButton.strokeRoundedRect(-100, 80, 200, 40, 8);

    const tryAgainText = this.add
      .text(0, 100, "Try Again", {
        fontFamily: "Orbitron",
        fontSize: "20px",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    // Cancel button with darker style
    const cancelButton = this.add.graphics();
    cancelButton.fillStyle(0x4b5563, 0.8);
    cancelButton.fillRoundedRect(-60, 130, 120, 30, 6);

    const cancelText = this.add
      .text(0, 145, "Cancel", {
        fontFamily: "Orbitron",
        fontSize: "16px",
        fill: "#9CA3AF",
      })
      .setOrigin(0.5);

    // Make buttons interactive
    tryAgainButton.setInteractive(
      new Phaser.Geom.Rectangle(-100, 80, 200, 40),
      Phaser.Geom.Rectangle.Contains,
    );

    cancelButton.setInteractive(
      new Phaser.Geom.Rectangle(-60, 130, 120, 30),
      Phaser.Geom.Rectangle.Contains,
    );

    // Add hover effects
    tryAgainButton.on("pointerover", () => {
      tryAgainButton.clear();
      tryAgainButton.fillGradientStyle(
        0x2563eb,
        0x2563eb,
        0x1d4ed8,
        0x1d4ed8,
        1,
      );
      tryAgainButton.fillRoundedRect(-100, 80, 200, 40, 8);
      tryAgainButton.lineStyle(2, 0x93c5fd);
      tryAgainButton.strokeRoundedRect(-100, 80, 200, 40, 8);
      tryAgainText.setScale(1.1);
    });

    tryAgainButton.on("pointerout", () => {
      tryAgainButton.clear();
      tryAgainButton.fillGradientStyle(
        0x3b82f6,
        0x3b82f6,
        0x2563eb,
        0x2563eb,
        1,
      );
      tryAgainButton.fillRoundedRect(-100, 80, 200, 40, 8);
      tryAgainButton.lineStyle(2, 0x60a5fa);
      tryAgainButton.strokeRoundedRect(-100, 80, 200, 40, 8);
      tryAgainText.setScale(1);
    });

    // Add button handlers
    tryAgainButton.on("pointerdown", () => {
      container.destroy();
      this.startGame();
    });

    cancelButton.on("pointerdown", () => {
      container.destroy();
    });

    // Add all elements to container
    container.add([
      bg,
      gameCat,
      titleText,
      gameOverText,
      scoreText,
      comboText,
      tryAgainButton,
      tryAgainText,
      cancelButton,
      cancelText,
    ]);

    // Get stored user data
    const storedData = localStorage.getItem("gameUserData");
    if (storedData) {
      // If user exists, show username
      const userData = JSON.parse(storedData);
      const userText = this.add
        .text(0, -160, userData.username, {
          fontFamily: "Orbitron",
          fontSize: "16px",
          fill: "#60A5FA",
        })
        .setOrigin(0.5);
      container.add(userText);
    }

    // Add entry animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
    });

    // Add cat spinning animation
    this.tweens.add({
      targets: gameCat,
      angle: stats.success ? 360 : 540,
      duration: 1000,
      ease: "Cubic.easeOut",
    });

    // Shake camera on failure
    if (!stats.success) {
      this.cameras.main.shake(500, 0.01);
    }
  }

  // async showScoreSubmission(stats) {
  //   const centerX = this.cameras.main.centerX;
  //   const centerY = this.cameras.main.centerY;
  //
  //   // Create submission container
  //   const container = this.add.container(centerX, centerY);
  //
  //   // Background
  //   const bg = this.add.graphics();
  //   bg.fillStyle(0x1a1a2e, 0.95);
  //   bg.fillRoundedRect(-200, -150, 400, 300, 16);
  //   bg.lineStyle(2, 0x3b82f6);
  //   bg.strokeRoundedRect(-200, -150, 400, 300, 16);
  //
  //   // Title
  //   const title = this.add
  //     .text(0, -120, "Submit Your Score", {
  //       fontFamily: "Orbitron",
  //       fontSize: "24px",
  //       fill: "#FFFFFF",
  //       align: "center",
  //     })
  //     .setOrigin(0.5);
  //
  //   // Get stored user data
  //   const storedData = localStorage.getItem("gameUserData");
  //   let userData = null;
  //   if (storedData) {
  //     userData = JSON.parse(storedData);
  //   }
  //
  //   // Score display
  //   const scoreText = this.add
  //     .text(0, -80, `Score: ${stats.score}`, {
  //       fontFamily: "Orbitron",
  //       fontSize: "20px",
  //       fill: "#60A5FA",
  //     })
  //     .setOrigin(0.5);
  //
  //   // Input fields
  //   let usernameInput, emailInput;
  //
  //   if (!userData) {
  //     // Username input
  //     const usernameField = this.add.graphics();
  //     usernameField.fillStyle(0x2a2a3e);
  //     usernameField.fillRoundedRect(-150, -40, 300, 40, 8);
  //
  //     usernameInput = this.add.text(-140, -30, "", {
  //       fontFamily: "Arial",
  //       fontSize: "16px",
  //       fill: "#FFFFFF",
  //     });
  //
  //     const usernamePlaceholder = this.add.text(-140, -30, "Username", {
  //       fontFamily: "Arial",
  //       fontSize: "16px",
  //       fill: "#6B7280",
  //     });
  //
  //     // Email input
  //     const emailField = this.add.graphics();
  //     emailField.fillStyle(0x2a2a3e);
  //     emailField.fillRoundedRect(-150, 10, 300, 40, 8);
  //
  //     emailInput = this.add.text(-140, 20, "", {
  //       fontFamily: "Arial",
  //       fontSize: "16px",
  //       fill: "#FFFFFF",
  //     });
  //
  //     const emailPlaceholder = this.add.text(-140, 20, "Email", {
  //       fontFamily: "Arial",
  //       fontSize: "16px",
  //       fill: "#6B7280",
  //     });
  //
  //     // Make fields interactive
  //     usernameField.setInteractive();
  //     emailField.setInteractive();
  //
  //     let activeInput = null;
  //     const keyboard = this.input.keyboard.addKey(
  //       Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
  //     );
  //
  //     usernameField.on("pointerdown", () => {
  //       activeInput = usernameInput;
  //       usernamePlaceholder.setVisible(false);
  //     });
  //
  //     emailField.on("pointerdown", () => {
  //       activeInput = emailInput;
  //       emailPlaceholder.setVisible(false);
  //     });
  //
  //     this.input.keyboard.on("keydown", (event) => {
  //       if (!activeInput) return;
  //
  //       if (event.key === "Backspace") {
  //         activeInput.text = activeInput.text.slice(0, -1);
  //       } else if (event.key.length === 1) {
  //         activeInput.text += event.key;
  //       }
  //     });
  //
  //     container.add([
  //       bg,
  //       title,
  //       scoreText,
  //       usernameField,
  //       usernamePlaceholder,
  //       usernameInput,
  //       emailField,
  //       emailPlaceholder,
  //       emailInput,
  //     ]);
  //   } else {
  //     const userText = this.add
  //       .text(0, -30, `Submit as: ${userData.username}`, {
  //         fontFamily: "Orbitron",
  //         fontSize: "18px",
  //         fill: "#FFFFFF",
  //       })
  //       .setOrigin(0.5);
  //
  //     container.add([bg, title, scoreText, userText]);
  //   }
  //
  //   // Submit button
  //   const submitButton = this.add.graphics();
  //   submitButton.fillStyle(0x3b82f6);
  //   submitButton.fillRoundedRect(-100, 70, 200, 40, 8);
  //
  //   const submitText = this.add
  //     .text(0, 90, "Submit Score", {
  //       fontFamily: "Orbitron",
  //       fontSize: "16px",
  //       fill: "#FFFFFF",
  //     })
  //     .setOrigin(0.5);
  //
  //   submitButton.setInteractive();
  //
  //   // Cancel button
  //   const cancelButton = this.add.graphics();
  //   cancelButton.fillStyle(0x4b5563);
  //   cancelButton.fillRoundedRect(-100, 120, 200, 40, 8);
  //
  //   const cancelText = this.add
  //     .text(0, 140, "Cancel", {
  //       fontFamily: "Orbitron",
  //       fontSize: "16px",
  //       fill: "#FFFFFF",
  //     })
  //     .setOrigin(0.5);
  //
  //   cancelButton.setInteractive();
  //
  //   container.add([submitButton, submitText, cancelButton, cancelText]);
  //
  //   // Button handlers
  //   submitButton.on("pointerdown", async () => {
  //     if (!userData) {
  //       const username = usernameInput.text.trim();
  //       const email = emailInput.text.trim();
  //
  //       if (!username || !email) {
  //         this.showError("Please fill in all fields");
  //         return;
  //       }
  //
  //       if (!email.includes("@")) {
  //         this.showError("Please enter a valid email");
  //         return;
  //       }
  //
  //       try {
  //         // Check if email exists
  //         const emailCheck = await fetch(
  //           `/api/game/user/${encodeURIComponent(email)}`,
  //         ).then((r) => r.json());
  //
  //         if (emailCheck.exists) {
  //           this.showError(
  //             "Email already registered. Please use a different email.",
  //           );
  //           return;
  //         }
  //
  //         // Check if username is available
  //         const usernameCheck = await fetch(
  //           `/api/game/check-username/${encodeURIComponent(username)}`,
  //         ).then((r) => r.json());
  //
  //         if (usernameCheck.exists) {
  //           this.showError("Username already taken. Please choose another.");
  //           return;
  //         }
  //
  //         // Create new user
  //         const user = await fetch("/api/game/users", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ username, email }),
  //         }).then((r) => r.json());
  //
  //         userData = user;
  //         localStorage.setItem("gameUserData", JSON.stringify(user));
  //       } catch (error) {
  //         this.showError("Error creating user. Please try again.");
  //         return;
  //       }
  //     }
  //
  //     try {
  //       // Submit score
  //       const scoreResult = await fetch("/api/game/scores", {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({
  //           userId: userData.id,
  //           ...stats,
  //         }),
  //       }).then((r) => r.json());
  //
  //       // Show success message with rank
  //       this.showSuccess(scoreResult.rank, scoreResult.isNewBest);
  //     } catch (error) {
  //       this.showError("Error submitting score. Please try again.");
  //     }
  //
  //     container.destroy();
  //   });
  //
  //   cancelButton.on("pointerdown", () => {
  //     container.destroy();
  //   });
  //
  //   // Add entry animation
  //   container.setAlpha(0);
  //   container.setScale(0.8);
  //   this.tweens.add({
  //     targets: container,
  //     alpha: 1,
  //     scale: 1,
  //     duration: 300,
  //     ease: "Back.easeOut",
  //   });
  // }

  showError(message) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY - 200;

    const errorText = this.add
      .text(centerX, centerY, message, {
        fontFamily: "Orbitron",
        fontSize: "16px",
        fill: "#EF4444",
        backgroundColor: "#991B1B",
        padding: { x: 15, y: 8 },
        borderRadius: 4,
      })
      .setOrigin(0.5);

    // Add fade out animation
    this.tweens.add({
      targets: errorText,
      alpha: 0,
      y: centerY - 50,
      duration: 2000,
      ease: "Power2",
      onComplete: () => errorText.destroy(),
    });
  }

  showSuccess(rank, isNewBest) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Create container for success message
    const container = this.add.container(centerX, centerY);

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-200, -150, 400, 300, 16);
    bg.lineStyle(2, 0x4ade80);
    bg.strokeRoundedRect(-200, -150, 400, 300, 16);

    // Success message
    const title = this.add
      .text(0, -100, isNewBest ? "New High Score!" : "Score Submitted!", {
        fontFamily: "Orbitron",
        fontSize: "28px",
        fill: "#4ADE80",
      })
      .setOrigin(0.5);

    // Rank display
    const rankText = this.add
      .text(0, -20, `Current Rank: #${rank}`, {
        fontFamily: "Orbitron",
        fontSize: "24px",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    // Add celebration particles if new best
    if (isNewBest) {
      this.addCelebrationParticles();
    }

    // Close button
    const closeButton = this.add.graphics();
    closeButton.fillStyle(0x4ade80);
    closeButton.fillRoundedRect(-100, 70, 200, 40, 8);

    const closeText = this.add
      .text(0, 90, "Continue", {
        fontFamily: "Orbitron",
        fontSize: "16px",
        fill: "#FFFFFF",
      })
      .setOrigin(0.5);

    closeButton.setInteractive();
    closeButton.on("pointerdown", () => {
      container.destroy();
      this.startGame(); // Restart the game
    });

    container.add([bg, title, rankText, closeButton, closeText]);

    // Add entry animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
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
  }, []);

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
