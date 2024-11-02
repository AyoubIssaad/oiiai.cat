import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Slider } from "./components/ui/Slider";
import OiiaiGame from "./components/OiiaiGame";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioBufferRef = useRef(null);

  // Constants for playback rates
  const MIN_PLAYBACK_RATE = 0.25; // Safe minimum playback rate
  const BASE_SPEED = 3; // Speed at which playbackRate should be 1.0

  // Calculate safe playback rate
  const calculatePlaybackRate = (speed) => {
    const rate = speed / BASE_SPEED;
    // If speed is 0, pause the video instead of trying to set playbackRate to 0
    if (speed === 0) return MIN_PLAYBACK_RATE;
    // Ensure rate doesn't go below minimum
    return Math.max(MIN_PLAYBACK_RATE, rate);
  };

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
    if (isPlaying && speed > 0 && audioBufferRef.current) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }

      audioSourceRef.current = audioContextRef.current.createBufferSource();
      audioSourceRef.current.buffer = audioBufferRef.current;
      audioSourceRef.current.loop = true;
      audioSourceRef.current.playbackRate.value = speed / BASE_SPEED;
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

  // Handle video playback
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying && speed > 0) {
        videoRef.current.playbackRate = calculatePlaybackRate(speed);
        videoRef.current
          .play()
          .catch((e) => console.error("Video playback failed:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, speed]);

  // Handle muting
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 1;
    }
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const getSpeedLabel = (speed) => {
    if (speed === 0) return "Paused";
    if (speed < 1) return `${(speed * 100).toFixed(0)}%`;
    return `${speed.toFixed(1)}x`;
  };

  const speedPresets = [3, 5, 8];

  return (
    <div className="min-h-screen kawaii-theme">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-center mb-8">
          <span className="kawaii-heading ml-2 text-5xl inline-block">
            Oiiai Cat
          </span>
          <span className="animate-bounce inline-block delay-100">⭐</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="kawaii-card p-8">
            <h2 className="kawaii-title text-2xl font-bold text-center mb-8">
              Spinning Cat
            </h2>
            <div className="flex flex-col items-center gap-8">
              <div className="kawaii-cat-container relative w-64 h-64 flex items-center justify-center bg-blue-50 rounded-full overflow-hidden">
                {isPlaying ? (
                  <video
                    ref={videoRef}
                    src="/cat.webm"
                    className="w-48 h-48 rounded-full object-cover"
                    playsInline
                    loop
                    muted
                  />
                ) : (
                  <img
                    src="/cat.png"
                    alt="Static Cat"
                    className="w-48 h-48 rounded-full"
                  />
                )}
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
                    <label className="kawaii-text text-sm font-medium text-blue-700">
                      Speed: {getSpeedLabel(speed)}
                    </label>
                    <div className="flex gap-2">
                      {speedPresets.map((speedValue) => (
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
                      min={0}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="kawaii-text flex justify-between text-xs text-blue-600">
                    <span>Paused</span>
                    <span>Fast (10x)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Section */}
          <div className="kawaii-card p-8">
            <h2 className="kawaii-title text-2xl font-bold text-center mb-8">
              Speed Typing Game
            </h2>
            <OiiaiGame />
          </div>
        </div>
      </div>

      <footer className="py-4 px-4 text-center text-sm text-blue-700 mt-8">
        <p className="kawaii-text">
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
