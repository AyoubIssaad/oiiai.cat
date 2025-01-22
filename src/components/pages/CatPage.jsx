import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Slider } from "../ui/Slider";
import { Link } from "react-router-dom";
import { ShareButton } from "../ShareButton";
import SEO from "../SEO";
import FeaturedProducts from "../FeaturedProducts";

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
        title="Make Oiiai Cat Go Spinny! - Control the Spinning Cat Animation"
        description="Control the legendary spinning Banana Cat! Adjust spinny speeds, add magical tunes, and create the perfect loop. Make the internet's favorite cat go round and round! ⭐"
        path="/"
      />

      <div className="container mx-auto px-4 pt-20 sm:pt24">
        {/* Fun Header Section */}
        {/* Streamlined Header Section */}
        <div className="text-center mb-2">
          <h1 className="relative flex items-center justify-center gap-2">
            <span className="kawaii-heading text-2xl sm:text-3xl">
              Make Cat Go Spin
            </span>
            <span className="animate-bounce text-2xl sm:text-3xl">🌪️</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-700 mt-2 max-w-lg mx-auto">
            Control the legendary Oiiai Cat's rotations and create spinning
            magic!
          </p>
        </div>
        <div className="flex justify-center mb-8"></div>

        {/* Main Controller Section */}
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl border-4 border-blue-500"
            style={{ backgroundColor: "#0bf70a" }}
          >
            <div className="flex flex-col items-center p-4">
              {/* Cat Animation Container */}
              <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                {isPlaying ? (
                  <video
                    ref={videoRef}
                    src="/cat.webm"
                    className="w-[170px] h-auto object-cover"
                    playsInline
                    loop
                    muted
                  />
                ) : (
                  <img
                    src="/cat.png"
                    alt="Static Banana Cat"
                    className="w-[170px] h-auto"
                  />
                )}
              </div>

              {/* Controls Section */}
              <div className="w-full space-y-8">
                {/* Play/Pause and Mute Controls */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={togglePlay}
                    className="kawaii-button accent w-24 h-12"
                    aria-label={isPlaying ? "Pause rotation" : "Start rotation"}
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
                    aria-label={isMuted ? "Unmute music" : "Mute music"}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Speed Controls with Fun Labels */}
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
                      onValueChange={([newSpeed]) =>
                        handleSpeedChange(newSpeed)
                      }
                      min={0}
                      max={10}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="kawaii-text flex justify-between text-xs text-blue-600">
                    <span>Pause</span>
                    <span>Max Speed (10x)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products Section */}
        <FeaturedProducts />

        {/* Fun Info Section */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="kawaii-card p-6">
            <h2 className="kawaii-subtitle text-xl mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Spinning Secrets
            </h2>
            <ul className="space-y-3 text-blue-700">
              <li className="flex items-center gap-2">
                <span className="text-xl">🎮</span> Use the magical slider to
                control Banana Cat's spin velocity
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">🎵</span> Toggle the mystical Oiiai
                tunes for maximum effect
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">⚡</span> Try the preset speeds for
                perfect spinning harmony
              </li>
              <li className="flex items-center gap-2">
                <span className="text-xl">🌟</span> Share your favorite spin
                settings with fellow cat enthusiasts
              </li>
            </ul>

            {/* Fun Facts */}
            <div className="mt-6 pt-6 border-t border-blue-100">
              <h3 className="kawaii-subtitle text-lg mb-3">Spinning Wisdom:</h3>
              <ul className="space-y-2 text-blue-700">
                <li>💫 Legend says the more spins, the more luck you get!</li>
                <li>
                  🎪 The original Banana Cat has spun over a million times
                </li>
                <li>🌈 Each spin creates a tiny bit of internet magic</li>
                <li>⭐ Join thousands of daily spinny cat enthusiasts</li>
              </ul>
            </div>

            {/* Pro Tips Section */}
            <div className="mt-6 pt-6 border-t border-blue-100">
              <h3 className="kawaii-subtitle text-lg mb-3">
                Pro Spinner Tips:
              </h3>
              <ul className="space-y-2 text-blue-700">
                <li>🎯 3x speed: Perfect for casual spinning</li>
                <li>🚀 5x speed: The legendary original spin rate</li>
                <li>⚡ 8x speed: For experienced spin masters</li>
                <li>✨ 10x speed: Maximum spinny power (use with caution!)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CatPage;
