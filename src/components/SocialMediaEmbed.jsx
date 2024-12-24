import React, { useEffect } from "react";

const SocialMediaEmbed = ({ platform, videoId }) => {
  useEffect(() => {
    // Load Instagram embed script if needed
    if (platform === "INSTAGRAM") {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        // Clean up any existing embeds
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
    }

    // Load TikTok embed script if needed
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

  if (platform === "INSTAGRAM") {
    return (
      <div className="instagram-embed-container relative w-full pt-[125%]">
        <blockquote
          className="instagram-media absolute inset-0 w-full h-full"
          data-instgrm-permalink={`https://www.instagram.com/p/${videoId}/`}
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
          cite={`https://www.tiktok.com/video/${videoId}`}
          data-video-id={videoId}
          style={{ maxWidth: "605px", minWidth: "325px" }}
        >
          <section>
            <a
              target="_blank"
              href={`https://www.tiktok.com/video/${videoId}`}
              rel="noopener noreferrer"
            >
              Loading TikTok embed...
            </a>
          </section>
        </blockquote>
      </div>
    );
  }

  return null;
};

export default SocialMediaEmbed;
