import React, { useEffect, useState, useRef, useCallback } from "react";

// Create a global state to track playing videos
const globalPlaybackState = {
  currentlyPlaying: null,
  observers: new Set(),
  setCurrentlyPlaying(id) {
    this.currentlyPlaying = id;
    this.notifyObservers();
  },
  addObserver(callback) {
    this.observers.add(callback);
  },
  removeObserver(callback) {
    this.observers.delete(callback);
  },
  notifyObservers() {
    this.observers.forEach((callback) => callback(this.currentlyPlaying));
  },
};

const SocialMediaEmbed = ({ platform, videoId, onPlaybackChange }) => {
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const uniqueId = `${platform}-${videoId}`;
  const [isPlaying, setIsPlaying] = useState(false);

  // Function to stop video playback
  const stopPlayback = useCallback(() => {
    if (!containerRef.current) return;

    try {
      // First attempt: Reload the iframe
      const iframe = containerRef.current.querySelector("iframe");
      if (iframe) {
        const src = iframe.src;
        iframe.src = "";
        setTimeout(() => {
          iframe.src = src;
        }, 10);
      }

      // Second attempt: Remove and recreate the embed
      if (platform === "INSTAGRAM") {
        const blockquote = containerRef.current.querySelector("blockquote");
        if (blockquote && window.instgrm) {
          window.instgrm.Embeds.process();
        }
      } else if (platform === "TIKTOK") {
        const blockquote = containerRef.current.querySelector("blockquote");
        if (blockquote) {
          const parent = blockquote.parentElement;
          const clone = blockquote.cloneNode(true);
          parent.removeChild(blockquote);
          parent.appendChild(clone);
        }
      }

      setIsPlaying(false);
    } catch (error) {
      console.error("Error stopping playback:", error);
    }
  }, [platform]);

  // Handle playback state changes
  useEffect(() => {
    const handlePlaybackChange = (currentlyPlayingId) => {
      if (currentlyPlayingId && currentlyPlayingId !== uniqueId && isPlaying) {
        stopPlayback();
      }
    };

    globalPlaybackState.addObserver(handlePlaybackChange);

    return () => {
      globalPlaybackState.removeObserver(handlePlaybackChange);
    };
  }, [uniqueId, stopPlayback, isPlaying]);

  // Monitor iframe events
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        // Instagram video events
        if (platform === "INSTAGRAM") {
          if (
            event.data?.type === "video" &&
            event.data?.action === "play" &&
            containerRef.current?.contains(event.source?.frameElement)
          ) {
            setIsPlaying(true);
            globalPlaybackState.setCurrentlyPlaying(uniqueId);
          }
        }
        // TikTok video events
        else if (platform === "TIKTOK") {
          if (
            event.data?.event === "play" &&
            containerRef.current?.contains(event.source?.frameElement)
          ) {
            setIsPlaying(true);
            globalPlaybackState.setCurrentlyPlaying(uniqueId);
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    // Set up mutation observer to watch for iframe creation
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === "IFRAME") {
            iframeRef.current = node;
            setLoading(false);
          }
        });
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      observer.disconnect();
    };
  }, [platform, uniqueId]);

  // Load platform-specific scripts
  useEffect(() => {
    let scriptElement = null;

    const loadScript = async () => {
      const existingScript = document.querySelector(
        `script[src*="${platform.toLowerCase()}"]`,
      );

      if (existingScript) {
        if (platform === "INSTAGRAM" && window.instgrm) {
          window.instgrm.Embeds.process();
        }
        return;
      }

      scriptElement = document.createElement("script");
      scriptElement.async = true;

      if (platform === "INSTAGRAM") {
        scriptElement.src = "//www.instagram.com/embed.js";
        scriptElement.onload = () => {
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
      } else if (platform === "TIKTOK") {
        scriptElement.src = "https://www.tiktok.com/embed.js";
      }

      document.body.appendChild(scriptElement);
    };

    loadScript();

    return () => {
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [platform]);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Media not available</p>
      </div>
    );
  }

  if (platform === "INSTAGRAM") {
    return (
      <div
        ref={containerRef}
        className="instagram-embed-container relative w-full"
        style={{ minHeight: "500px" }}
      >
        <blockquote
          className="instagram-media absolute top-0 left-0 h-full"
          data-instgrm-permalink={`https://www.instagram.com/reel/${videoId}/`}
          data-instgrm-version="14"
          style={{
            background: "#FFF",
            border: "0",
            margin: "0",
            maxWidth: "540px",
            width: "100%",
            minWidth: "326px",
            padding: "0",
          }}
        />
      </div>
    );
  }

  if (platform === "TIKTOK") {
    return (
      <div
        ref={containerRef}
        className="tiktok-embed-container relative flex justify-center overflow-hidden"
        style={{ minHeight: "500px" }}
      >
        <blockquote
          className="tiktok-embed"
          cite={`https://www.tiktok.com/@user/video/${videoId}`}
          data-video-id={videoId}
          style={{
            maxWidth: "325px",
            width: "100%",
          }}
        >
          <section>
            <a
              target="_blank"
              href={`https://www.tiktok.com/video/${videoId}`}
              rel="noopener noreferrer"
            >
              Loading TikTok video...
            </a>
          </section>
        </blockquote>
      </div>
    );
  }

  return null;
};

export default SocialMediaEmbed;
