// src/lib/urlValidation.js

/**
 * Validates and extracts information from social media URLs
 * @param {string} url - The URL to validate
 * @returns {{ platform: string|null, videoId: string|null, error: string|null }}
 */
export function validateSocialUrl(url) {
  try {
    // Basic URL validation
    if (!url) {
      return { platform: null, videoId: null, error: "URL is required" };
    }

    try {
      new URL(url);
    } catch {
      return { platform: null, videoId: null, error: "Invalid URL format" };
    }

    // Detect platform
    const platform = detectPlatform(url);
    if (!platform) {
      return {
        platform: null,
        videoId: null,
        error: "URL must be from Instagram or TikTok",
      };
    }

    // Extract video ID
    const videoId = extractVideoId(url, platform);
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

/**
 * Detects the social media platform from a URL
 * @param {string} url
 * @returns {string|null} "INSTAGRAM", "TIKTOK", or null
 */
export function detectPlatform(url) {
  if (!url) return null;

  if (/instagram\.com/.test(url)) return "INSTAGRAM";
  if (/tiktok\.com/.test(url)) return "TIKTOK";

  return null;
}

/**
 * Extracts video ID from a social media URL
 * @param {string} url
 * @param {string} platform
 * @returns {string|null}
 */
export function extractVideoId(url, platform) {
  if (!url || !platform) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (platform === "INSTAGRAM") {
      const idIndex = pathParts.findIndex(
        (part) => part === "p" || part === "reel",
      );
      return idIndex !== -1 ? pathParts[idIndex + 1] : null;
    }

    if (platform === "TIKTOK") {
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
}
