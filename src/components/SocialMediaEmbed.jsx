import React, { useEffect } from "react";

const SocialMediaEmbed = ({ platform, videoId }) => {
  useEffect(() => {
    // Load Instagram embed script
    // Helper function to extract video ID from URL
    const extractVideoId = (url, platform) => {
      if (!url) return null;

      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);

        if (platform === "INSTAGRAM") {
          // Look for ID after /p/ or /reel/
          const idIndex = pathParts.findIndex(
            (part) => part === "p" || part === "reel",
          );
          return idIndex !== -1 ? pathParts[idIndex + 1] : null;
        }

        if (platform === "TIKTOK") {
          // Get last part of the path for TikTok
          const videoIndex = pathParts.findIndex((part) => part === "video");
          return videoIndex !== -1
            ? pathParts[videoIndex + 1]
            : pathParts[pathParts.length - 1];
        }

        return null;
      } catch (error) {
        console.error("Error extracting video ID:", error);
        return null;
      }
    };

    // Update videoId using the URL if necessary
    const effectiveVideoId =
      videoId || extractVideoId(window.location.href, platform);

    if (platform === "INSTAGRAM") {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        // Clean up existing embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
    }

    // Load TikTok embed script
    if (platform === "TIKTOK") {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [platform, videoId]);

  // Debug log to help identify issues
  console.log("Embedding media:", { platform, videoId });

  if (!videoId) {
    console.warn("No videoId provided for platform:", platform);
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
        style={{ paddingBottom: "120%" }}
      >
        <blockquote
          className="instagram-media absolute inset-0 w-full"
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
        className="tiktok-embed-container relative w-full"
        style={{ paddingBottom: "177.77%" }}
      >
        <blockquote
          className="tiktok-embed absolute inset-0"
          cite={`https://www.tiktok.com/@user/video/${videoId}`}
          data-video-id={videoId}
          style={{
            maxWidth: "605px",
            minWidth: "325px",
            width: "100%",
            height: "100%",
            margin: "0",
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
