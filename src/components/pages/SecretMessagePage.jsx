import React, { useState, useRef, useEffect } from "react";
import { Share2, Play, Pause, Copy, VolumeX, Volume2 } from "lucide-react";
import { Button } from "../ui/Button";
import SEO from "../SEO";

// Encoding map stays the same
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
  const [inputText, setInputText] = useState("");
  const [encodedMessage, setEncodedMessage] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);

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
      gainNodeRef.current.gain.value = isMuted ? 0 : 0.5; // Reduced volume to 0.5
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
        await new Promise((resolve) => setTimeout(resolve, 150)); // Reduced from 300ms to 150ms
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

  // Rest of the component functions stay the same
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

  return (
    <>
      <SEO
        title="Secret Oiiai Messages - Encode and Decode"
        description="Transform your messages into secret Oiiai patterns! Create and decode mysterious messages using the power of O, I, and A."
        path="/secret"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="kawaii-heading text-4xl mb-4">
            Secret Oiiai Messages
            <span className="animate-bounce inline-block ml-4 delay-100">
              🔮
            </span>
          </h1>
          <p className="text-lg text-blue-700 mb-6">
            Transform your messages into mysterious Oiiai patterns!
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Encoder Section */}
          <div className="kawaii-card p-6">
            <h2 className="kawaii-subtitle text-xl mb-4">
              Create Secret Message
            </h2>
            <div className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter your message..."
                className="w-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none"
                rows="3"
              />
              <div className="flex justify-end gap-2">
                <Button onClick={handleEncode} className="kawaii-button">
                  Transform to Oiiai
                </Button>
              </div>
            </div>
          </div>

          {/* Encoded Message Section */}
          {encodedMessage && (
            <div className="kawaii-card p-6">
              <h2 className="kawaii-subtitle text-xl mb-4">Oiiai Pattern</h2>
              <div className="relative">
                <div className="font-mono bg-blue-50 p-4 rounded-lg mb-4 overflow-x-auto whitespace-pre-wrap">
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
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsMuted(!isMuted)}
                      className="kawaii-button"
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
                      className="kawaii-button"
                      disabled={isLoading}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(encodedMessage)}
                    className="kawaii-button"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Decoder Section */}
          <div className="kawaii-card p-6">
            <h2 className="kawaii-subtitle text-xl mb-4">
              Decode Secret Message
            </h2>
            <div className="space-y-4">
              <textarea
                value={encodedMessage}
                onChange={(e) => setEncodedMessage(e.target.value)}
                placeholder="Paste an Oiiai pattern here..."
                className="w-full p-4 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none font-mono"
                rows="3"
              />
              <div className="flex justify-end">
                <Button onClick={handleDecode} className="kawaii-button">
                  Reveal Message
                </Button>
              </div>
            </div>
          </div>

          {/* Decoded Message Section */}
          {decodedMessage && (
            <div className="kawaii-card p-6">
              <h2 className="kawaii-subtitle text-xl mb-4">Revealed Message</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                {decodedMessage}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => copyToClipboard(decodedMessage)}
                  className="kawaii-button"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="kawaii-card p-6 bg-blue-50 border-blue-200">
            <h2 className="kawaii-subtitle text-xl mb-4">How It Works</h2>
            <ul className="space-y-2 text-blue-700">
              <li>✨ Type your message in the first box</li>
              <li>🎵 Transform it into an Oiiai pattern</li>
              <li>🔊 Play the pattern to hear its melody</li>
              <li>📋 Copy and share the pattern with friends</li>
              <li>🎯 Paste received patterns to decode them</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default SecretMessagePage;
