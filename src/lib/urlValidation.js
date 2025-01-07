// src/lib/urlValidation.js

/**
 * Normalizes an Instagram URL to its canonical form
 * @param {string} url
 * @returns {string}
 */
function normalizeInstagramUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Extract ID and type (reel or post)
    let type = "p"; // default to post
    let id = null;

    if (pathParts.includes("share")) {
      // For share URLs, get the ID from the last part
      id = pathParts[pathParts.length - 1];
    } else {
      // Handle regular reel or post URLs
      const typeIndex = pathParts.findIndex(
        (part) => part === "p" || part === "reel",
      );
      if (typeIndex !== -1 && pathParts[typeIndex + 1]) {
        type = pathParts[typeIndex];
        id = pathParts[typeIndex + 1];
      }
    }

    if (!id) return url; // if we can't parse it, return original

    // Remove any query params from ID
    id = id.split("?")[0];

    // Construct canonical URL
    return `https://www.instagram.com/${type}/${id}/`;
  } catch (error) {
    console.error("Error normalizing Instagram URL:", error);
    return url;
  }
}

/**
 * Normalizes a TikTok URL to its canonical form
 * @param {string} url
 * @returns {string}
 */
function normalizeTikTokUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Find video ID
    const videoIndex = pathParts.findIndex((part) => part === "video");
    let videoId;

    if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
      videoId = pathParts[videoIndex + 1].split("?")[0];
    } else {
      // Some TikTok URLs don't have "video" in the path
      videoId = pathParts[pathParts.length - 1].split("?")[0];
    }

    if (!videoId) return url;

    // Construct canonical URL
    return `https://www.tiktok.com/video/${videoId}`;
  } catch (error) {
    console.error("Error normalizing TikTok URL:", error);
    return url;
  }
}

/**
 * Extracts Instagram video ID from any Instagram URL format
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
 * Extracts TikTok video ID
 * @param {string} url
 * @returns {string|null}
 */
function extractTikTokId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    const videoIndex = pathParts.findIndex((part) => part === "video");
    if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
      return pathParts[videoIndex + 1].split("?")[0];
    }

    // Handle URLs without "video" in the path
    const lastPart = pathParts[pathParts.length - 1];
    return lastPart.split("?")[0];
  } catch (error) {
    console.error("Error extracting TikTok ID:", error);
    return null;
  }
}

/**
 * Detects the platform from URL hostname
 * @param {URL} urlObj
 * @returns {string|null}
 */
function detectPlatform(urlObj) {
  if (urlObj.hostname.includes("instagram.com")) return "INSTAGRAM";
  if (urlObj.hostname.includes("tiktok.com")) return "TIKTOK";
  return null;
}

/**
 * Validates social media URL and extracts platform and ID
 * @param {string} url
 * @returns {{ platform: string|null, videoId: string|null, normalizedUrl: string|null, error: string|null }}
 */
export function validateSocialUrl(url) {
  try {
    if (!url) {
      return {
        platform: null,
        videoId: null,
        normalizedUrl: null,
        error: "URL is required",
      };
    }

    // Basic URL validation
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch {
      return {
        platform: null,
        videoId: null,
        normalizedUrl: null,
        error: "Invalid URL format",
      };
    }

    // Platform detection
    const platform = detectPlatform(urlObj);
    if (!platform) {
      return {
        platform: null,
        videoId: null,
        normalizedUrl: null,
        error: "URL must be from Instagram or TikTok",
      };
    }

    // Handle Instagram
    if (platform === "INSTAGRAM") {
      const normalizedUrl = normalizeInstagramUrl(url);
      const videoId = extractInstagramId(url);

      if (!videoId) {
        return {
          platform,
          videoId: null,
          normalizedUrl: null,
          error: "Could not extract Instagram video ID",
        };
      }

      return { platform, videoId, normalizedUrl, error: null };
    }

    // Handle TikTok
    if (platform === "TIKTOK") {
      const normalizedUrl = normalizeTikTokUrl(url);
      const videoId = extractTikTokId(url);

      if (!videoId) {
        return {
          platform,
          videoId: null,
          normalizedUrl: null,
          error: "Could not extract TikTok video ID",
        };
      }

      return { platform, videoId, normalizedUrl, error: null };
    }

    return {
      platform: null,
      videoId: null,
      normalizedUrl: null,
      error: "Unsupported platform",
    };
  } catch (error) {
    console.error("URL validation error:", error);
    return {
      platform: null,
      videoId: null,
      normalizedUrl: null,
      error: "Failed to process URL",
    };
  }
}
