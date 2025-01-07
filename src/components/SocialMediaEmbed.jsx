import React, { useEffect, useState, useRef, useContext } from "react";

// Create a context for managing video playback
const VideoPlaybackContext = React.createContext();

export const VideoPlaybackProvider = ({ children }) => {
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  return (
    <VideoPlaybackContext.Provider
      value={{ currentlyPlaying, setCurrentlyPlaying }}
    >
      {children}
    </VideoPlaybackContext.Provider>
  );
};

const SocialMediaEmbed = ({ platform, videoId }) => {
  const [loading, setLoading] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(0);
  const instagramEmbedContainerRef = useRef(null);
  const { currentlyPlaying, setCurrentlyPlaying } =
    useContext(VideoPlaybackContext);
  const uniqueId = `${platform}-${videoId}`;

  useEffect(() => {
    // If another video starts playing, stop or mute this one
    if (currentlyPlaying && currentlyPlaying !== uniqueId) {
      // For Instagram
      if (platform === "INSTAGRAM") {
        const iframe =
          instagramEmbedContainerRef.current?.querySelector("iframe");
        if (iframe) {
          // Instagram doesn't provide direct control,
          // but we can reload the iframe to stop playback
          iframe.src = iframe.src;
        }
      }
      // For TikTok
      else if (platform === "TIKTOK") {
        const iframe = document.querySelector(
          `iframe[data-video-id="${videoId}"]`,
        );
        if (iframe) {
          // TikTok videos can be reloaded to stop playback
          iframe.src = iframe.src;
        }
      }
    }
  }, [currentlyPlaying, platform, videoId, uniqueId]);

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

    const timeoutId = setTimeout(loadScript, 100);

    const setEmbedHeight = () => {
      if (
        instagramEmbedContainerRef.current &&
        window.innerWidth >= 768 &&
        platform === "INSTAGRAM"
      ) {
        const height =
          instagramEmbedContainerRef.current.offsetHeight ||
          instagramEmbedContainerRef.current.scrollHeight ||
          500;
        setIframeHeight(height);
      } else {
        setIframeHeight(0);
      }
    };

    const timeoutId2 = setTimeout(setEmbedHeight, 500);

    // Listen for video play events
    const handleMessage = (event) => {
      // Handle Instagram messages
      if (event.data?.type === "video" && event.data?.action === "play") {
        setCurrentlyPlaying(uniqueId);
      }
      // Handle TikTok messages
      else if (event.data?.event === "play") {
        setCurrentlyPlaying(uniqueId);
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("resize", setEmbedHeight);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("resize", setEmbedHeight);
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [platform, videoId, uniqueId, setCurrentlyPlaying]);

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
        className="instagram-embed-container relative w-full"
        style={{
          minHeight: iframeHeight > 0 ? iframeHeight + "px" : undefined,
        }}
        ref={instagramEmbedContainerRef}
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
