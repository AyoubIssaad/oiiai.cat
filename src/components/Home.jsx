import React, { useState, useRef, useEffect } from "react";
import SEO from "./SEO";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Slider } from "./ui/Slider";
import OiiaiGame from "./OiiaiGame";
import { Link } from "react-router-dom";

export default function Home() {
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

  // Add structured data
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Oiiai Cat",
      applicationCategory: "Game",
      browserRequirements: "Requires JavaScript",
      description:
        "Interactive web application featuring a spinning cat animation synchronized with music and a typing game.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Controllable spinning cat animation",
        "Synchronized music playback",
        "Speed control",
        "Interactive typing game",
        "Sound effects",
      ],
      url: "https://oiiai.cat",
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

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
          text: "Check out this fun spinning cat animation and game!",
          url: "https://oiiai.cat",
        });
        trackEvent("content_shared", { method: "native_share" });
      } else {
        await navigator.clipboard.writeText("https://oiiai.cat");
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
        title="Oiiai Cat - Interactive Spinning Cat Animation & Typing Game"
        description="Experience the viral sensation! Control the famous spinning cat, sync it with the iconic Oiia Oiia music, and test your typing skills. The perfect dose of daily joy!"
        path="/"
      />
      <div className="min-h-screen kawaii-theme">
        {/* Hero Section with Rich Content */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-12 mb-8">
          <div className="container mx-auto px-4">
            <header className="text-center max-w-4xl mx-auto">
              <h1 className="flex items-center justify-center gap-4 mb-6">
                <span className="kawaii-heading text-5xl">Oiiai Cat</span>
                <span className="animate-bounce inline-block delay-100">
                  ⭐
                </span>
              </h1>

              <p className="text-lg text-blue-700 mb-6">
                Experience the viral sensation! Control the famous spinning cat,
                sync it with the iconic "Oiia Oiia" music, and test your typing
                skills. Perfect for meme lovers and anyone who needs a dose of
                joy!
              </p>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleShare}
                  className="kawaii-button p-2"
                  aria-label="Share with friends"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Joy
                </Button>
              </div>
            </header>
          </div>
        </section>

        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Interactive Cat Section */}
            <section className="kawaii-card p-8">
              <h2 className="kawaii-title text-2xl font-bold text-center mb-4">
                Interactive Spinning Cat
              </h2>
              <p className="text-blue-600 text-center mb-8">
                Control the speed, toggle the music, and watch the magic happen!
              </p>

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
                      <span>Paused</span>
                      <span>Fast (10x)</span>
                    </div>
                  </div>
                </div>

                {/* How to Play Guide */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h3 className="kawaii-subtitle text-lg mb-3">How to Play:</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>🎮 Use the slider to control spinning speed</li>
                    <li>🎵 Toggle music with the sound button</li>
                    <li>⚡ Try preset speeds for perfect sync</li>
                    <li>📱 Share with friends for more fun</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Game Section */}
            <section className="kawaii-card p-8">
              <h2 className="kawaii-title text-2xl font-bold text-center mb-4">
                Oiiai Typing Challenge
              </h2>
              <p className="text-blue-600 text-center mb-8">
                Master the rhythm of "Oiiai" in this engaging typing game!
              </p>
              <OiiaiGame />
            </section>
          </div>

          {/* About Section */}
          <section className="max-w-4xl mx-auto mb-12 p-8 kawaii-card">
            <h2 className="kawaii-title text-2xl font-bold text-center mb-6">
              About Oiiai Cat
            </h2>
            <div className="space-y-4 text-blue-700">
              <p>
                The Oiiai Cat phenomenon started as a simple video of a spinning
                cat synchronized with a catchy tune. It quickly captured hearts
                worldwide, becoming one of the most beloved wholesome memes of
                recent times.
              </p>
              <p>
                Our interactive version lets you control the iconic spinning
                animation while staying true to the original's charm. Whether
                you're here to perfect the spin speed, master the typing
                challenge, or just need a moment of pure joy, Oiiai Cat is here
                for you!
              </p>
              <div className="mt-6 pt-6 border-t border-blue-100">
                <h3 className="kawaii-subtitle text-lg mb-3">Fun Facts:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    The original meme gained millions of views across social
                    platforms
                  </li>
                  <li>
                    Our interactive version adds new ways to enjoy the beloved
                    cat
                  </li>
                  <li>The typing game helps improve your keyboard skills</li>
                  <li>Perfect for short breaks and instant mood boosts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* User Testimonials/Stats Section */}
          <section className="max-w-4xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="kawaii-card p-6 text-center">
              <h3 className="kawaii-subtitle text-lg mb-2">Happy Users</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">10K+</p>
              <p className="text-blue-700">Spreading joy daily</p>
            </div>
            <div className="kawaii-card p-6 text-center">
              <h3 className="kawaii-subtitle text-lg mb-2">Spins Generated</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">1M+</p>
              <p className="text-blue-700">And counting!</p>
            </div>
            <div className="kawaii-card p-6 text-center">
              <h3 className="kawaii-subtitle text-lg mb-2">Words Typed</h3>
              <p className="text-3xl font-bold text-blue-600 mb-2">500K+</p>
              <p className="text-blue-700">In the typing game</p>
            </div>
          </section>
        </main>

        {/* Enhanced Footer */}
        <footer className="bg-blue-50 py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="kawaii-subtitle text-lg mb-4">About</h3>
                <p className="text-blue-700 text-sm">
                  Oiiai Cat brings joy through interactive meme experiences.
                  Created with love by cat enthusiasts for cat enthusiasts.
                </p>
              </div>
              <div>
                <h3 className="kawaii-subtitle text-lg mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Terms of Use
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@oiiai.cat"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Contact Us
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="kawaii-subtitle text-lg mb-4">Follow Us</h3>
                <p className="text-blue-700 text-sm">
                  Share your Oiiai Cat moments with #OiiaiCat
                </p>
              </div>
            </div>

            <div className="text-center pt-8 border-t border-blue-200">
              <p className="kawaii-text mb-4">
                Made with <span className="animate-pulse inline-block">🩶</span>{" "}
                by{" "}
                <a
                  className="text-blue-500 hover:text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://aubiss.com"
                >
                  aubiss
                </a>
              </p>
              <p className="text-xs text-blue-600">
                © {new Date().getFullYear()} Oiiai Cat. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
