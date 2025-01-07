// src/lib/urlValidation.js

/**
 * Extracts video ID from an Instagram URL
 * @param {string} url
 * @returns {string|null}
 */
export async function extractInstagramId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    // Handle different Instagram URL formats
    if (pathParts.includes("share")) {
      // For share URLs, we need to follow the redirect
      try {
        const response = await fetch(url);
        if (response.ok) {
          // Get the final URL after redirects
          const finalUrl = response.url;
          // Recursively extract ID from the final URL
          return await extractInstagramId(finalUrl);
        }
      } catch (error) {
        console.error("Error following share URL:", error);
        // If we can't follow the redirect, try to extract from original URL
      }
    }

    // Handle regular reel or post URLs
    const idIndex = pathParts.findIndex(
      (part) => part === "p" || part === "reel",
    );
    if (idIndex !== -1 && pathParts[idIndex + 1]) {
      // Return clean ID without any query params
      return pathParts[idIndex + 1].split("?")[0];
    }

    return null;
  } catch (error) {
    console.error("Error extracting Instagram ID:", error);
    return null;
  }
}

/**
 * Validates and extracts information from social media URLs
 * @param {string} url - The URL to validate
 * @returns {Promise<{ platform: string|null, videoId: string|null, error: string|null }>}
 */
export async function validateSocialUrl(url) {
  try {
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

    // Extract video ID based on platform
    let videoId = null;
    if (platform === "INSTAGRAM") {
      videoId = await extractInstagramId(url);
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
 * Extracts video ID from a TikTok URL
 * @param {string} url
 * @returns {string|null}
 */
function extractTikTokId(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    const videoIndex = pathParts.findIndex((part) => part === "video");
    return videoIndex !== -1
      ? pathParts[videoIndex + 1]
      : pathParts[pathParts.length - 1];
  } catch (error) {
    console.error("Error extracting TikTok ID:", error);
    return null;
  }
}
