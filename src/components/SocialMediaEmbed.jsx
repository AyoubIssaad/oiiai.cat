import React, { useEffect } from "react";

const SocialMediaEmbed = ({ platform, videoId }) => {
  useEffect(() => {
    // Load Instagram embed script
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

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Media not available</p>
      </div>
    );
  }

  if (platform === "INSTAGRAM") {
    return (
      <div className="instagram-embed-container relative w-full pt-[125%]">
        <blockquote
          className="instagram-media absolute inset-0 w-full h-full"
          data-instgrm-permalink={`https://www.instagram.com/reel/${videoId}/`}
          data-instgrm-version="14"
          style={{
            background: "#FFF",
            border: "0",
            margin: "1px",
            maxWidth: "540px",
            minWidth: "326px",
            padding: "0",
          }}
        />
      </div>
    );
  }

  if (platform === "TIKTOK") {
    return (
      <div className="tiktok-embed-container relative w-full pt-[177.77%]">
        <blockquote
          className="tiktok-embed absolute inset-0 w-full h-full"
          cite={`https://www.tiktok.com/@user/video/${videoId}`}
          data-video-id={videoId}
          style={{ maxWidth: "605px", minWidth: "325px" }}
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
