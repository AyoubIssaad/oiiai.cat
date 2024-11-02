import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, RotateCw, Volume2, VolumeX, Keyboard } from "lucide-react";
import { Button } from "./ui/Button";

const BASE_SEQUENCE = "oiiaioooiiai".split("");
const REPEAT_COUNT = 4;
const SEQUENCE = Array(REPEAT_COUNT).fill(BASE_SEQUENCE).flat();
const LETTER_COLORS = {
  o: "bg-blue-500",
  i: "bg-green-500",
  a: "bg-red-500",
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
  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-4 bg-gray-100 px-4 py-2 rounded-lg">
    <div className="flex items-center gap-2">
      <Keyboard className="w-4 h-4" />
      <span>Use keyboard keys:</span>
      {Object.entries(LETTER_NAMES).map(([letter, name], index) => (
        <span key={letter} className="font-mono">
          {index > 0 && "/"}
          {name}
        </span>
      ))}
    </div>
    <div className="text-xs">Complete the sequence 4 times to win!</div>
  </div>
);

const GameOverMessage = ({ success, time, speed }) => {
  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg shadow-lg text-center">
        <h3 className="text-xl font-bold mb-4 text-green-700">Perfect Run!</h3>
        <div className="space-y-2 text-green-600">
          <p>Time: {time}s</p>
          <p>Speed: {speed} letters/second</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-xl font-bold text-red-700">Try Again!</h3>
      <p className="text-red-600 mt-2">
        Keep practicing to master the sequence
      </p>
    </div>
  );
};

export default function OiiaiGame() {
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

  const audioContextRef = useRef(null);
  const audioBuffersRef = useRef({});
  const gainNodeRef = useRef(null);
  const correctSoundRef = useRef(null);
  const incorrectSoundRef = useRef(null);

  const getCurrentRepetition = useCallback(() => {
    return Math.floor(currentIndex / BASE_SEQUENCE.length) + 1;
  }, [currentIndex]);

  // Initialize audio context and load all sounds
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
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-gray-800">
          {gameState === "idle" && "Ready to Play?"}
          {gameState === "playing" && (
            <div className="flex flex-col items-center">
              <div>Match the Sequence!</div>
              <div className="text-sm text-gray-600">
                Round {getCurrentRepetition()} of {REPEAT_COUNT}
              </div>
            </div>
          )}
          {gameState === "gameOver" &&
            (score.success ? "Congratulations!" : "Game Over")}
        </div>
        <Button
          onClick={() => setIsMuted(!isMuted)}
          variant="outline"
          size="sm"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Sequence display with repetition indicators */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2 flex-wrap justify-center max-w-2xl">
          {BASE_SEQUENCE.map((letter, index) => (
            <div
              key={index}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold
                ${LETTER_COLORS[letter]}
                ${currentIndex % BASE_SEQUENCE.length === index && gameState === "playing" ? "ring-4 ring-yellow-400 animate-pulse" : ""}
                ${currentIndex % BASE_SEQUENCE.length > index ? "opacity-50" : "opacity-100"}
                transition-all duration-200`}
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
                  className={`w-3 h-3 rounded-full ${index < getCurrentRepetition() - 1 ? "bg-green-500" : "bg-gray-200"}
                  ${index === getCurrentRepetition() - 1 && "animate-pulse bg-yellow-400"}`}
                />
              ))}
          </div>
        )}
      </div>

      {/* Game controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4 flex-wrap justify-center">
          {Object.entries(LETTER_NAMES).map(([letter, name]) => (
            <Button
              key={letter}
              variant="outline"
              size="lg"
              className={`w-20 h-20 ${LETTER_COLORS[letter]} text-white border-none
                ${lastPressedKey === letter ? "scale-95 opacity-80" : ""}
                hover:opacity-90 active:scale-95 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handleLetterClick(letter)}
              disabled={gameState !== "playing"}
            >
              {name}
            </Button>
          ))}
        </div>
        <KeyboardHint />
        <div className="text-sm text-gray-500 mt-2">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> to{" "}
          {gameState === "playing" ? "restart" : "start"}
        </div>
      </div>

      {/* Game Over Message */}
      {gameState === "gameOver" && (
        <GameOverMessage
          success={score.success}
          time={score.time}
          speed={score.speed}
        />
      )}

      {/* Start/Restart button */}
      <Button onClick={startGame} size="lg" className="mt-4" variant="default">
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
