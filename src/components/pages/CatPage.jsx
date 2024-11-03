import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Share2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import SEO from "../SEO";

export function CatPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioBufferRef = useRef(null);

  // Constants for playback rates
  const MIN_PLAYBACK_RATE = 0.25;
  const BASE_SPEED = 3;

  // Analytics tracking function
  const trackEvent = (eventName, eventParams = {}) => {
    if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    }
  };

  // Calculate safe playback rate
  const calculatePlaybackRate = (speed) => {
    const rate = speed / BASE_SPEED;
    return speed === 0 ? MIN_PLAYBACK_RATE : Math.max(MIN_PLAYBACK_RATE, rate);
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
        trackEvent("audio_loaded");
      })
      .catch((error) => {
        console.error("Error loading audio:", error);
        trackEvent("audio_load_error", { error: error.message });
      });

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

      trackEvent("playback_started", { speed });
    } else if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
      trackEvent("playback_stopped", { speed });
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
        videoRef.current.play().catch((e) => {
          console.error("Video playback failed:", e);
          trackEvent("video_playback_error", { error: e.message });
        });
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
    trackEvent("sound_toggled", { muted: isMuted });
  }, [isMuted]);

  const togglePlay = () => {
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
    trackEvent("play_toggled", { nowPlaying: !isPlaying });
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    trackEvent("speed_changed", { oldSpeed: speed, newSpeed });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Oiiai Cat - Interactive Spinning Cat Animation",
          text: "Check out this fun spinning cat animation!",
          url: "https://oiiai.cat/cat",
        });
        trackEvent("content_shared", { method: "native_share" });
      } else {
        await navigator.clipboard.writeText("https://oiiai.cat/cat");
        alert("Link copied to clipboard!");
        trackEvent("content_shared", { method: "clipboard_copy" });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      trackEvent("share_error", { error: error.message });
    }
  };

  const getSpeedLabel = (speed) => {
    if (speed === 0) return "Paused";
    if (speed < 1) return `${(speed * 100).toFixed(0)}%`;
    return `${speed.toFixed(1)}x`;
  };

  const speedPresets = [3, 5, 8];

  return (
    <>
      <SEO
        title="Interactive Spinning Cat - Control the Oiiai Cat Animation"
        description="Control the famous spinning cat animation! Adjust speed, sync with music, and create the perfect loop with our interactive controller."
        path="/cat"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="kawaii-heading text-4xl mb-4">
            Interactive Cat Controller
            <span className="animate-bounce inline-block ml-4 delay-100">
              ⭐
            </span>
          </h1>
          <p className="text-lg text-blue-700 mb-6">
            Control the iconic spinning cat animation and sync it with the
            music!
          </p>
          <Button onClick={handleShare} className="kawaii-button">
            <Share2 className="w-4 h-4 mr-2" />
            Share Controller
          </Button>
        </div>

        {/* Main Controller Section */}
        <div className="kawaii-card p-8 max-w-2xl mx-auto">
          {/* Cat Animation Container */}
          <div className="flex flex-col items-center gap-8 mb-8">
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
          </div>

          {/* Controls */}
          <div className="space-y-8">
            {/* Play/Pause and Mute Controls */}
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

            {/* Speed Controls */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="kawaii-text text-sm font-medium text-blue-700">
                  Speed: {getSpeedLabel(speed)}
                </label>
                <div className="flex gap-2">
                  {speedPresets.map((speedValue) => (
                    <Button
                      key={speedValue}
                      onClick={() => handleSpeedChange(speedValue)}
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
                  onValueChange={([newSpeed]) => handleSpeedChange(newSpeed)}
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

        {/* Tips Section */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="kawaii-card p-6">
            <h2 className="kawaii-subtitle text-xl mb-4">Quick Tips:</h2>
            <ul className="space-y-2 text-blue-700">
              <li>🎮 Use the slider to find your perfect spin speed</li>
              <li>🎵 Toggle music to enhance the experience</li>
              <li>⚡ Try the preset speeds for perfect sync</li>
              <li>📱 Share your favorite settings with friends</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default CatPage;
