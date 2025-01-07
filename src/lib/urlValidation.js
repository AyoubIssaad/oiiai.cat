// src/lib/urlValidation.js

/**
 * Extracts Instagram ID from any Instagram URL format
 * @param {string} url
 * @returns {string|null}
 */
function extractInstagramId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Handle different Instagram URL formats
    if (pathParts.includes("share")) {
      // For share URLs, get the ID from the last part
      return pathParts[pathParts.length - 1].split("?")[0];
    }

    // Handle regular reel or post URLs
    const idIndex = pathParts.findIndex(
      (part) => part === "p" || part === "reel",
    );
    if (idIndex !== -1 && pathParts[idIndex + 1]) {
      return pathParts[idIndex + 1].split("?")[0];
    }

    return null;
  } catch (error) {
    console.error("Error extracting Instagram ID:", error);
    return null;
  }
}

/**
 * Extracts TikTok video ID from URL
 * @param {string} url
 * @returns {string|null}
 */
function extractTikTokId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    const videoIndex = pathParts.findIndex((part) => part === "video");
    return videoIndex !== -1
      ? pathParts[videoIndex + 1].split("?")[0]
      : pathParts[pathParts.length - 1].split("?")[0];
  } catch (error) {
    console.error("Error extracting TikTok ID:", error);
    return null;
  }
}

/**
 * Detects platform from URL
 * @param {string} url
 * @returns {string|null}
 */
function detectPlatform(url) {
  if (!url) return null;

  if (/instagram\.com/.test(url)) return "INSTAGRAM";
  if (/tiktok\.com/.test(url)) return "TIKTOK";

  return null;
}

/**
 * Validates social media URL and extracts platform and ID
 * @param {string} url
 * @returns {{ platform: string|null, videoId: string|null, error: string|null }}
 */
export function validateSocialUrl(url) {
  try {
    if (!url) {
      return { platform: null, videoId: null, error: "URL is required" };
    }

    try {
      new URL(url);
    } catch {
      return { platform: null, videoId: null, error: "Invalid URL format" };
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return {
        platform: null,
        videoId: null,
        error: "URL must be from Instagram or TikTok",
      };
    }

    let videoId;
    if (platform === "INSTAGRAM") {
      videoId = extractInstagramId(url);
    } else if (platform === "TIKTOK") {
      videoId = extractTikTokId(url);
    }

    if (!videoId) {
      return {
        platform,
        videoId: null,
        error: `Could not extract valid ${platform.toLowerCase()} video ID`,
      };
    }

    return { platform, videoId, error: null };
  } catch (error) {
    console.error("URL validation error:", error);
    return {
      platform: null,
      videoId: null,
      error: "Failed to process URL",
    };
  }
}
