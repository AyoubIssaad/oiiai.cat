import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Slider } from "./components/ui/Slider";
import OiiaiGame from "./components/OiiaiGame";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [rotation, setRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const animationFrameRef = useRef();
  const lastTimeRef = useRef(0);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioBufferRef = useRef(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    fetch("/oiiai.mp3")
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) =>
        audioContextRef.current.decodeAudioData(arrayBuffer),
      )
      .then((audioBuffer) => {
        audioBufferRef.current = audioBuffer;
      })
      .catch((error) => console.error("Error loading audio:", error));

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle audio playback
  useEffect(() => {
    if (isPlaying && audioBufferRef.current) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBufferRef.current;
      audioSourceRef.current.loop = true;
      audioSourceRef.current.playbackRate.value = speed / 3;
      audioSourceRef.current.connect(gainNodeRef.current);
      audioSourceRef.current.start();
    } else if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }

    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
    };
  }, [isPlaying, speed]);

  // Handle muting
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
  }, [isMuted]);

  useEffect(() => {
    if (isPlaying) {
      const animate = (currentTime) => {
        if (!lastTimeRef.current) lastTimeRef.current = currentTime;
        const delta = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        setRotation((prev) => prev + delta * speed * 0.2);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  const togglePlay = () => {
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const StarryBackground = () => {
    const stars = Array(50)
      .fill(null)
      .map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
      }));

    return (
      <div className="fixed inset-0 pointer-events-none">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute"
            style={{
              top: star.top,
              left: star.left,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>
    );
  };

  const getSpeedLabel = (speed) => {
    if (speed < 1) return `${(speed * 100).toFixed(0)}%`;
    return `${speed.toFixed(1)}x`;
  };

  return (
    <div className="min-h-screen kawaii-theme">
      <div className="container mx-auto px-4 py-8">
        {/* Fun emoji header */}
        <h1 className="text-center mb-8 text-4xl">
          {/* <span className="animate-bounce inline-block">🐱</span> */}
          <span className="kawaii-title ml-2">Oiiai Cat</span>
          <span className="animate-bounce inline-block delay-100">⭐</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spinning Cat Section */}
          <div className="kawaii-card p-8">
            <h2 className="kawaii-title text-2xl font-bold text-center mb-8">
              Spinning Cat
            </h2>
            <div className="flex flex-col items-center gap-8">
              <div className="kawaii-cat-container relative w-64 h-64 flex items-center justify-center bg-blue-50 rounded-full perspective-1000">
                <div
                  className="w-48 h-48 relative backface-visible"
                  style={{
                    transform: `rotateY(${rotation}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <img
                    src="/cat.png"
                    alt="Spinning Cat"
                    className="w-full h-full object-cover rounded-full"
                    draggable="false"
                  />
                </div>
              </div>

              <div className="w-full flex flex-col gap-6">
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={togglePlay}
                    className="kawaii-button accent w-24 h-12"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setRotation(0);
                      lastTimeRef.current = 0;
                    }}
                    className="kawaii-button w-12 h-12"
                  >
                    <RotateCw className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={() => setIsMuted(!isMuted)}
                    className="kawaii-button w-12 h-12"
                  >
                    {isMuted ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-blue-700">
                      Speed: {getSpeedLabel(speed)}
                    </label>
                    <div className="flex gap-2">
                      {[3, 5, 10].map((speedValue) => (
                        <Button
                          key={speedValue}
                          onClick={() => setSpeed(speedValue)}
                          className="kawaii-button text-xs h-8 px-3"
                        >
                          {speedValue}x
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="kawaii-slider-track">
                    <Slider
                      value={[speed]}
                      onValueChange={([newSpeed]) => setSpeed(newSpeed)}
                      min={0.1}
                      max={20}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>Slow (0.1x)</span>
                    <span>Fast (20x)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Section */}
          <div className="kawaii-card p-8">
            <h2 className="kawaii-title text-2xl font-bold text-center mb-8">
              OIIAI Game
            </h2>
            <OiiaiGame />
          </div>
        </div>
      </div>

      <footer className="py-4 px-4 text-center text-sm text-blue-700 mt-8">
        <p>
          Made with <span className="animate-pulse inline-block">⭐</span> by{" "}
          <a
            className="text-blue-500 hover:text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://aubiss.com"
          >
            aubiss
          </a>{" "}
          |{" "}
          <a
            href="mailto:contact@oiiai.cat"
            className="text-blue-500 hover:text-blue-600 underline"
          >
            contact@oiiai.cat
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
