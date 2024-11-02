import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./components/ui/Button";
import { Slider } from "./components/ui/Slider";

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

  // Add this useEffect for dynamic title
  useEffect(() => {
    document.title = "Oiiai Cat"; // Set your desired title here
  }, []);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    // Load audio file
    fetch("/oiiai.mp3") // Make sure to put your audio file in the public folder
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
      audioSourceRef.current.playbackRate.value = speed / 3; // Normalize to make 3x speed play at normal rate
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
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const getSpeedLabel = (speed) => {
    if (speed < 1) return `${(speed * 100).toFixed(0)}%`;
    return `${speed.toFixed(1)}x`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md mx-auto">
          <div className="relative w-64 h-64 flex items-center justify-center bg-gray-100 rounded-full shadow-lg perspective-1000">
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
                variant="outline"
                size="lg"
                className="w-24"
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
                variant="outline"
                size="lg"
              >
                <RotateCw className="w-6 h-6" />
              </Button>
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant="outline"
                size="lg"
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
                <label className="text-sm font-medium">
                  Speed: {getSpeedLabel(speed)}
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setSpeed(3)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    3x
                  </Button>
                  <Button
                    onClick={() => setSpeed(5)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    5x
                  </Button>
                  <Button
                    onClick={() => setSpeed(10)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    10x
                  </Button>
                </div>
              </div>
              <Slider
                value={[speed]}
                onValueChange={([newSpeed]) => setSpeed(newSpeed)}
                min={0.1}
                max={20}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow (0.1x)</span>
                <span>Fast (20x)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-sm text-gray-600">
        <p>
          Made with ♥ by{" "}
          <a
            className="text-blue-600 hover:text-blue-800 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            href="https://aubiss.com"
          >
            aubiss
          </a>{" "}
          |{" "}
          <a
            href="mailto:contact@oiiai.cat"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            contact@oiiai.cat
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
