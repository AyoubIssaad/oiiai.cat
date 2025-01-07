import React, { useEffect, useState, useRef } from "react";

const SocialMediaEmbed = ({ platform, videoId }) => {
  const [loading, setLoading] = useState(true);
  const [iframeHeight, setIframeHeight] = useState(0);
  const instagramEmbedContainerRef = useRef(null);

  useEffect(() => {
    let scriptElement = null;
    const loadScript = async () => {
      // Check if script is already loaded
      const existingScript = document.querySelector(
        `script[src*="${platform.toLowerCase()}"]`,
      );

      if (existingScript) {
        if (platform === "INSTAGRAM" && window.instgrm) {
          window.instgrm.Embeds.process();
        }
        return;
      }

      // Create and load script if not already present
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

    // Delay script loading slightly to prevent flickering
    const timeoutId = setTimeout(loadScript, 100);

    // Function to calculate and set the height
    const setEmbedHeight = () => {
      if (
        instagramEmbedContainerRef.current &&
        window.innerWidth >= 768 && // For medium screens and above (md breakpoint)
        platform === "INSTAGRAM"
      ) {
        // Find the actual height of the content, fallback to default if needed
        const height =
          instagramEmbedContainerRef.current.offsetHeight ||
          instagramEmbedContainerRef.current.scrollHeight ||
          500; // Default height
        setIframeHeight(height);
      } else {
        // Reset to 0 for smaller screens or TikTok
        setIframeHeight(0);
      }
    };

    // Initial height calculation
    const timeoutId2 = setTimeout(setEmbedHeight, 500); // Delay after initial render

    // Recalculate on window resize
    window.addEventListener("resize", setEmbedHeight);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      window.removeEventListener("resize", setEmbedHeight);
      // Only remove the script if we created it
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [platform, videoId]);

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
