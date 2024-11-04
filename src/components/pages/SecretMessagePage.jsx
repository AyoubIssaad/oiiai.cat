import React, { useState, useRef, useEffect } from "react";
import {
  Share2,
  Play,
  Pause,
  Copy,
  VolumeX,
  Volume2,
  MessageSquare,
  Sparkles,
  Lock,
  Music,
  Lightbulb,
  ArrowDown,
} from "lucide-react";
import { Button } from "../ui/Button";
import SEO from "../SEO";

// Encoding map
const ENCODER_MAP = {
  A: "OI",
  B: "IOOO",
  C: "IOIO",
  D: "IOO",
  E: "O",
  F: "OOIO",
  G: "IIO",
  H: "OOOO",
  I: "OO",
  J: "OIII",
  K: "IOI",
  L: "OIOO",
  M: "II",
  N: "IO",
  O: "III",
  P: "OIIO",
  Q: "IIOI",
  R: "OIO",
  S: "OOO",
  T: "I",
  U: "OOI",
  V: "OOOI",
  W: "OII",
  X: "IOOI",
  Y: "IOII",
  Z: "IIOO",
  " ": "AA",
};

const DECODER_MAP = Object.fromEntries(
  Object.entries(ENCODER_MAP).map(([key, value]) => [value, key]),
);

export function SecretMessagePage() {
  const [activeTab, setActiveTab] = useState("encode");
  const [inputText, setInputText] = useState("");
  const [encodedMessage, setEncodedMessage] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreInfo, setShowMoreInfo] = useState(true);

  const audioContextRef = useRef(null);
  const audioBuffersRef = useRef({});
  const gainNodeRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Initialize audio context and load sounds
  useEffect(() => {
    let mounted = true;

    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);

        const loadSound = async (letter) => {
          const response = await fetch(`/sounds/${letter}.wav`);
          const arrayBuffer = await response.arrayBuffer();
          if (!mounted) return null;
          const audioBuffer =
            await audioContextRef.current.decodeAudioData(arrayBuffer);
          return [letter, audioBuffer];
        };

        // Load all sounds
        const buffers = await Promise.all(["o", "i", "a"].map(loadSound));
        if (!mounted) return;

        buffers.forEach(([letter, buffer]) => {
          if (buffer) {
            audioBuffersRef.current[letter] = buffer;
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error initializing audio:", error);
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      mounted = false;
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle muting
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 0.5; // Reduced volume
    }
  }, [isMuted]);

  const playSound = async (letter) => {
    if (
      !audioContextRef.current ||
      !audioBuffersRef.current[letter.toLowerCase()]
    ) {
      return;
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffersRef.current[letter.toLowerCase()];
      source.connect(gainNodeRef.current);
      source.start(0);

      return new Promise((resolve) => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const playMessage = async () => {
    if (isLoading || !encodedMessage) return;

    setIsPlaying(true);
    isPlayingRef.current = true;

    try {
      const letters = encodedMessage.split("");
      for (let i = 0; i < letters.length; i++) {
        if (!isPlayingRef.current) break;

        setPlaybackIndex(i);
        await playSound(letters[i]);
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    } catch (error) {
      console.error("Playback error:", error);
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
      setPlaybackIndex(-1);
    }
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setPlaybackIndex(-1);
  };

  const encodeMessage = (text) => {
    return text
      .toUpperCase()
      .split("")
      .map((char) => ENCODER_MAP[char] || char)
      .join("A");
  };

  const decodeMessage = (encoded) => {
    let words = encoded.split("AA");
    return words
      .map((word) => {
        let letters = word.split("A");
        return letters
          .map((pattern) => DECODER_MAP[pattern] || pattern)
          .join("");
      })
      .join(" ");
  };

  const handleEncode = () => {
    const encoded = encodeMessage(inputText);
    setEncodedMessage(encoded);
    setDecodedMessage("");
  };

  const handleDecode = () => {
    const decoded = decodeMessage(encodedMessage);
    setDecodedMessage(decoded);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  const TabButton = ({ id, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-['Orbitron'] font-bold text-sm transition-all duration-300 ${
        active
          ? "bg-blue-100 text-blue-700 shadow-md rounded-t-lg border-t-2 border-x-2 border-blue-200"
          : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <SEO
        title="🔮 Super Secret Banana Cat Translator - Make Messages Go Spinny!"
        description="Psst! Transform your boring human words into mysterious Banana Cat speak! Our special cat-powered encoder makes messages that only true spinning cat fans can decode. It's purrfectly secret! 🐱"
        path="/secret-cat-messages"
      />

      <div className="container mx-auto px-4 pt-20 sm:pt24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="relative flex items-center justify-center gap-2">
            <span className="kawaii-heading text-4xl mb-4">
              The Ultimate Cat Translator
            </span>
            <span className="animate-bounce text-4xl bg-transparent">🔮</span>
          </h1>
          <p className="text-lg text-blue-700">
            Transform your messages into mysterious Banana Cat patterns!
          </p>
        </div>

        {/* Main Functionality Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="kawaii-card p-6">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-blue-200 overflow-x-auto">
              <TabButton
                id="encode"
                label="Create Secret Message 🔒"
                active={activeTab === "encode"}
              />
              <TabButton
                id="decode"
                label="Reveal Cat Secrets 🔍"
                active={activeTab === "decode"}
              />
            </div>

            {/* Encode Tab Content */}
            {activeTab === "encode" && (
              <div className="space-y-6">
                {/* Input Area */}
                <div className="space-y-4">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your human words here... They will become cat wisdom! 🐱"
                    className="w-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none"
                    rows="3"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleEncode}
                      className="kawaii-button w-full sm:w-auto"
                    >
                      Transform to Cat Speak!
                    </Button>
                  </div>
                </div>

                {/* Encoded Output */}
                {encodedMessage && (
                  <div className="space-y-4 pt-4 border-t-2 border-blue-100">
                    <h3 className="kawaii-subtitle text-lg">
                      Your Cat Pattern ✨
                    </h3>
                    <div className="font-mono bg-blue-50 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                      {encodedMessage.split("").map((char, index) => (
                        <span
                          key={index}
                          className={`inline-block ${
                            playbackIndex === index ? "bg-yellow-200" : ""
                          }`}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsMuted(!isMuted)}
                          className="kawaii-button w-12"
                          disabled={isLoading}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          onClick={isPlaying ? stopPlayback : playMessage}
                          className="kawaii-button flex-grow sm:flex-grow-0"
                          disabled={isLoading}
                        >
                          {isPlaying ? (
                            <span className="flex items-center">
                              <Pause className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">Shhh!</span>
                              <span className="sm:hidden">Stop</span>
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <Play className="w-4 h-4 mr-2" />
                              <span className="hidden sm:inline">
                                Make it Sing!
                              </span>
                              <span className="sm:hidden">Play</span>
                            </span>
                          )}
                        </Button>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(encodedMessage)}
                        className="kawaii-button w-full sm:w-auto"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Copy Cat Code</span>
                        <span className="sm:hidden">Copy</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Decode Tab Content */}
            {activeTab === "decode" && (
              <div className="space-y-6">
                {/* Input Area */}
                <div className="space-y-4">
                  <textarea
                    value={encodedMessage}
                    onChange={(e) => setEncodedMessage(e.target.value)}
                    placeholder="Paste the mysterious cat patterns here... What secrets do they hold? 🔍"
                    className="w-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none font-mono"
                    rows="3"
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsMuted(!isMuted)}
                        className="kawaii-button w-12"
                        disabled={isLoading}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={isPlaying ? stopPlayback : playMessage}
                        className="kawaii-button flex-grow sm:flex-grow-0"
                        disabled={isLoading}
                      >
                        {isPlaying ? (
                          <span className="flex items-center">
                            <Pause className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">Shhh!</span>
                            <span className="sm:hidden">Stop</span>
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Play className="w-4 h-4 mr-2" />
                            <span className="hidden sm:inline">
                              Play
                            </span>
                            <span className="sm:hidden">Play</span>
                          </span>
                        )}
                      </Button>
                    </div>
                    <Button
                      onClick={handleDecode}
                      className="kawaii-button w-full sm:w-auto"
                    >
                      <span className="hidden sm:inline">
                        Reveal Secrets!
                      </span>
                      <span className="sm:hidden">Decode</span>
                    </Button>
                  </div>
                </div>

                {/* Decoded Output */}
                {decodedMessage && (
                  <div className="space-y-4 pt-4 border-t-2 border-blue-100">
                    <h3 className="kawaii-subtitle text-lg">
                      The Cat Has Spoken! 📜
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      {decodedMessage}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => copyToClipboard(decodedMessage)}
                        className="kawaii-button w-full sm:w-auto"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Copy Message</span>
                        <span className="sm:hidden">Copy</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Show More Information Button */}
        <div className="text-center mb-8">
          <Button
            onClick={() => setShowMoreInfo(!showMoreInfo)}
            className="kawaii-button"
          >
            {showMoreInfo
              ? "Hide Cat Knowledge"
              : "Learn More About Cat Secrets"}
            <ArrowDown
              className={`w-4 h-4 ml-2 transform transition-transform ${
                showMoreInfo ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Additional Information (Collapsible) */}
        {showMoreInfo && (
          <>
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="kawaii-card p-6 text-center bg-gradient-to-br from-blue-50 to-white">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="kawaii-subtitle text-lg mb-2">
                  Ancient Cat Wisdom
                </h3>
                <p className="text-blue-700">
                  Uses the sacred Banana Cat dialect, passed down through
                  generations of spinning cats! Much mysterious, very secret! 🐱
                </p>
              </div>

              <div className="kawaii-card p-6 text-center bg-gradient-to-br from-blue-50 to-white">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Music className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="kawaii-subtitle text-lg mb-2">
                  Musical Meowgic
                </h3>
                <p className="text-blue-700">
                  Every message becomes a unique Banana Cat tune! It's like your
                  words are doing a little spinny dance! 🎵
                </p>
              </div>

              <div className="kawaii-card p-6 text-center bg-gradient-to-br from-blue-50 to-white">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="kawaii-subtitle text-lg mb-2">
                  Top Secret Cat Club
                </h3>
                <p className="text-blue-700">
                  Share encoded messages with fellow cat enthusiasts! Like a
                  secret clubhouse, but with more spinning! 🔒
                </p>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="kawaii-card p-8 max-w-4xl mx-auto mb-12 bg-gradient-to-br from-blue-50 to-white">
              <h2 className="kawaii-subtitle text-2xl mb-6 text-center flex items-center justify-center gap-2">
                <Lightbulb className="w-6 h-6 text-blue-600" />
                How To Be A Cat Whisperer
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="kawaii-text font-bold text-blue-700 mb-2">
                    Making Messages Go Spinny:
                  </h3>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🎭</span> Write your super
                      secret message
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">✨</span> Watch it transform
                      into cat magic
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🎵</span> Listen to your message
                      go "oiiai"
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🚀</span> Share with fellow cat
                      enthusiasts
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="kawaii-text font-bold text-blue-700 mb-2">
                    Reading Cat Secrets:
                  </h3>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-center gap-2">
                      <span className="text-xl">📝</span> Pop in the mysterious
                      cat code
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">👂</span> Listen to the secret
                      cat tune
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🔮</span> Click the magic decode
                      button
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-xl">🎉</span> Reveal the hidden
                      message!
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Fun Facts Card */}
            <div className="kawaii-card p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-white">
              <h3 className="kawaii-subtitle text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Super Secret Cat Facts
              </h3>
              <ul className="space-y-2 text-blue-700">
                <li>🎵 Created by studying hours of Banana Cat spins!</li>
                <li>🔮 Uses real cat sounds for maximum authenticity</li>
                <li>💫 Each message creates a unique spinning melody</li>
                <li>⭐ Trusted by thousands of cat message enthusiasts</li>
                <li>✨ Powered by pure cat magic (and some code)</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SecretMessagePage;
