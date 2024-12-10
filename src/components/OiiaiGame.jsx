import React, { useState, useRef, useEffect, useCallback } from "react";
import { API_URL } from "../config";
import {
  Play,
  RotateCw,
  Volume2,
  VolumeX,
  Keyboard,
  Trophy,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Leaderboard } from "./Leaderboard";

// const API_URL = process.env.REACT_APP_API_URL || "/api";
const BASE_SEQUENCE = "oiiaiooiiiai".split("");
const REPEAT_COUNT = 4;
const SEQUENCE = Array(REPEAT_COUNT).fill(BASE_SEQUENCE).flat();
const LETTER_COLORS = {
  o: "bg-blue-500 hover:bg-blue-600", // Primary blue
  i: "bg-yellow-400 hover:bg-yellow-500", // Accent yellow
  a: "bg-blue-700 hover:bg-blue-800", // Darker blue for contrast
};

const LETTER_NAMES = {
  o: "O",
  i: "I",
  a: "A",
};

const KEYBOARD_MAPPINGS = {
  o: ["o", "O"],
  i: ["i", "I"],
  a: ["a", "A"],
};

const KeyboardHint = () => (
  <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mt-4 bg-blue-50 px-4 py-2 rounded-lg border-2 border-blue-200">
    <div className="kawaii-text flex items-center gap-2">
      <Keyboard className="w-4 h-4" />
      <span>Use keyboard keys:</span>
      {Object.entries(LETTER_NAMES).map(([letter, name], index) => (
        <span key={letter} className="font-mono">
          {index > 0 && "/"}
          {name}
        </span>
      ))}
    </div>
    <div className="kawaii-text text-xs">
      Complete the sequence 4 times to win!
    </div>
  </div>
);

const GameOverMessage = ({
  success,
  time,
  speed,
  score,
  onSubmitScore,
  submitting,
}) => {
  const [playerName, setPlayerName] = useState("");
  const [hasShared, setHasShared] = useState(false);

  if (success) {
    return (
      <div className="kawaii-card p-6 text-center">
        <h3 className="kawaii-title text-xl mb-4 font-black">
          Perfect Run! ⭐
        </h3>
        <div className="space-y-2 text-blue-700">
          <p>Time: {time}s</p>
          <p>Speed: {speed} letters/second</p>

          {!submitting ? (
            <div className="mt-4">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="kawaii-input mb-2 p-2 border-2 border-blue-300 rounded w-full max-w-xs"
                maxLength={50}
              />
              <Button
                onClick={() => onSubmitScore(playerName)}
                className="kawaii-button mt-2"
                disabled={!playerName.trim()}
              >
                Submit Score
              </Button>
            </div>
          ) : (
            <p className="animate-pulse">Submitting score...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="kawaii-card p-6 text-center border-yellow-500 bg-yellow-50">
      <h3 className="kawaii-title font-black text-xl font-bold text-yellow-700">
        Try Again! 💫
      </h3>
      <p className="text-yellow-600 mt-2 font-['Orbitron']">
        Keep practicing to master the sequence
      </p>
    </div>
  );
};

export default function OiiaiGame({ onShowLeaderboard }) {
  const [gameState, setGameState] = useState("idle");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [score, setScore] = useState({ time: 0, accuracy: 0, speed: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [lastPressedKey, setLastPressedKey] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);

  const audioContextRef = useRef(null);
  const audioBuffersRef = useRef({});
  const gainNodeRef = useRef(null);
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);

  const getCurrentRepetition = useCallback(() => {
    return Math.floor(currentIndex / BASE_SEQUENCE.length) + 1;
  }, [currentIndex]);

  // Initialize audio context and load sounds
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    const loadSound = async (letter) => {
      try {
        const response = await fetch(`/sounds/${letter}.wav`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer =
          await audioContextRef.current.decodeAudioData(arrayBuffer);
        audioBuffersRef.current[letter] = audioBuffer;
        setLoadingProgress(
          (prev) => prev + 100 / (Object.keys(LETTER_NAMES).length + 2),
        );
      } catch (error) {
        console.error(`Error loading ${letter} sound:`, error);
      }
    };

    Promise.all([
      ...Object.keys(LETTER_NAMES).map(loadSound),
      fetch("/sounds/correct.wav")
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) =>
          audioContextRef.current.decodeAudioData(arrayBuffer),
        )
        .then((audioBuffer) => {
          correctSoundRef.current = audioBuffer;
        }),
      fetch("/sounds/incorrect.wav")
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) =>
          audioContextRef.current.decodeAudioData(arrayBuffer),
        )
        .then((audioBuffer) => {
          incorrectSoundRef.current = audioBuffer;
        }),
    ]).then(() => {
      setIsLoading(false);
      setLoadingProgress(100);
    });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const submitScore = async (playerName) => {
    if (!playerName.trim()) return;

    setSubmittingScore(true);
    const scoreData = {
      playerName: playerName.trim(),
      score: Number(score.speed) * 1000, // Convert to points
      time: Number(score.time),
      lettersPerSecond: Number(score.speed),
      mistakes: mistakes,
    };

    console.log("Submitting score data:", scoreData);
    console.log("API URL:", `${API_URL}/scores`);

    try {
      const response = await fetch(`${API_URL}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scoreData),
      });

      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to submit score");
      }

      // Show leaderboard after successful submission
      // setShowLeaderboard(true);
      onShowLeaderboard();
    } catch (error) {
      console.error("Detailed error:", error);
      console.error("Error submitting score:", {
        message: error.message,
        stack: error.stack,
      });
      alert(`Failed to submit score: ${error.message}`);
    } finally {
      setSubmittingScore(false);
    }
  };

  const playFeedbackSound = useCallback(
    (isCorrect) => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      if (audioContextRef.current && !isMuted) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = isCorrect
          ? correctSoundRef.current
          : incorrectSoundRef.current;
        source.connect(gainNodeRef.current);
        source.start(0);
      }
    },
    [isMuted],
  );

  const playSound = useCallback(
    (letter) => {
      if (audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }

      if (
        audioContextRef.current &&
        audioBuffersRef.current[letter] &&
        !isMuted
      ) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffersRef.current[letter];

        const compressor = audioContextRef.current.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        source.connect(compressor);
        compressor.connect(gainNodeRef.current);

        source.start(0);
      }
    },
    [isMuted],
  );

  const handleLetterClick = useCallback(
    (letter) => {
      if (gameState !== "playing") return;

      playSound(letter);

      if (letter === SEQUENCE[currentIndex]) {
        if (currentIndex === SEQUENCE.length - 1) {
          // Successfully completed all repetitions
          const endTimeStamp = Date.now();
          setEndTime(endTimeStamp);
          setGameState("gameOver");

          const timeElapsed = (endTimeStamp - startTime) / 1000;
          const speed = SEQUENCE.length / timeElapsed;

          setScore({
            time: timeElapsed.toFixed(2),
            speed: speed.toFixed(2),
            success: true,
          });

          // Play success sound for perfect completion
          playFeedbackSound(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      } else {
        // Play error sound and end game immediately
        playFeedbackSound(false);
        setMistakes((prev) => prev + 1);
        setGameState("gameOver");
        setScore({ success: false });
      }
    },
    [gameState, currentIndex, startTime, playSound, playFeedbackSound],
  );

  const startGame = useCallback(() => {
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setGameState("playing");
    setCurrentIndex(0);
    setMistakes(0);
    setStartTime(Date.now());
    setEndTime(null);
  }, []);

  // Handle muting
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  // Keyboard event handler with spacebar support
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Spacebar to start/restart
      if (event.code === "Space") {
        event.preventDefault(); // Prevent page scroll
        if (gameState !== "playing") {
          startGame();
          return;
        }
      }

      // Letter keys during gameplay
      if (gameState === "playing") {
        for (const [letter, keys] of Object.entries(KEYBOARD_MAPPINGS)) {
          if (keys.includes(event.key)) {
            handleLetterClick(letter);
            setLastPressedKey(letter);
            setTimeout(() => setLastPressedKey(null), 100);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, handleLetterClick, startGame]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${loadingProgress}%` }}
          ></div>
        </div>
        <p className="text-gray-600">
          Loading sounds... {Math.round(loadingProgress)}%
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-4">
        <div className="kawaii-title text-xl text-blue-700">
          {gameState === "idle" && "Ready to Play?"}
          {gameState === "playing" && (
            <div className="flex flex-col items-center">
              <div>Match the Sequence!</div>
              <div className="text-sm text-blue-600">
                Round {getCurrentRepetition()} of {REPEAT_COUNT}
              </div>
            </div>
          )}
          {gameState === "gameOver" &&
            (score.success ? "Congratulations! 🎉" : "Game Over 💫")}
        </div>
        <Button onClick={() => setIsMuted(!isMuted)} className="kawaii-button">
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>
      {/* Sequence display */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 flex-wrap justify-center max-w-2xl">
          {BASE_SEQUENCE.map((letter, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold
                ${LETTER_COLORS[letter]}
                ${
                  currentIndex % BASE_SEQUENCE.length === index &&
                  gameState === "playing"
                    ? "ring-4 ring-yellow-300 animate-pulse"
                    : ""
                }
                ${
                  currentIndex % BASE_SEQUENCE.length > index
                    ? "opacity-50"
                    : "opacity-100"
                }
                transition-all duration-200 transform hover:scale-105`}
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
        {gameState === "playing" && (
          <div className="flex gap-2">
            {Array(REPEAT_COUNT)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full
                    ${
                      index < getCurrentRepetition() - 1
                        ? "bg-blue-500"
                        : "bg-blue-200"
                    }
                    ${
                      index === getCurrentRepetition() - 1 &&
                      "animate-pulse bg-yellow-400"
                    }
                  `}
                />
              ))}
          </div>
        )}
      </div>
      {/* Game controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 flex-wrap justify-center">
          {Object.entries(LETTER_NAMES).map(([letter, name]) => (
            <button
              key={letter}
              className={`w-20 h-20 ${LETTER_COLORS[letter]} text-white text-2xl font-bold
                rounded-lg border-2 border-blue-700 shadow-lg
                transform transition-all duration-200
                ${
                  gameState !== "playing"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }
                ${lastPressedKey === letter ? "scale-95" : ""}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              onClick={() => handleLetterClick(letter)}
              disabled={gameState !== "playing"}
            >
              {name}
            </button>
          ))}
        </div>
        <KeyboardHint />
        <div className="text-sm text-blue-600 mt-2">
          Press{" "}
          <kbd className="px-2 py-1 bg-blue-50 rounded border border-blue-200">
            Space
          </kbd>{" "}
          to {gameState === "playing" ? "restart" : "start"}
        </div>
      </div>
      {/* Game Over Message */}
      {gameState === "gameOver" && (
        <GameOverMessage
          success={score.success}
          time={score.time}
          speed={score.speed}
          onSubmitScore={submitScore}
          submitting={submittingScore}
        />
      )}
      {/* Start/Restart button */}
      <Button
        onClick={startGame}
        className="kawaii-button accent mt-4 text-lg px-8 py-4"
      >
        {gameState === "idle" ? (
          <>
            <Play className="w-6 h-6 mr-2" />
            Start Game
          </>
        ) : (
          <>
            <RotateCw className="w-6 h-6 mr-2" />
            Play Again
          </>
        )}
      </Button>
    </div>
  );
}
