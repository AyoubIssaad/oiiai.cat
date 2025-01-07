// src/lib/urlValidation.js

/**
 * Resolves an Instagram share URL to its final URL
 * @param {string} url
 * @returns {Promise<string>}
 */
async function resolveInstagramUrl(url) {
  try {
    const response = await fetch(
      `/api/resolve-url?${new URLSearchParams({ url })}`,
    );
    if (!response.ok) {
      throw new Error("Failed to resolve URL");
    }
    const data = await response.json();
    return data.resolvedUrl;
  } catch (error) {
    console.error("Error resolving URL:", error);
    return url; // Fall back to original URL if resolution fails
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

    // First try to find ID after "video/"
    const videoIndex = pathParts.findIndex((part) => part === "video");
    if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
      return pathParts[videoIndex + 1].split("?")[0];
    }

    // If no "video/" in path, try the last part
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && /^\d+$/.test(lastPart.split("?")[0])) {
      return lastPart.split("?")[0];
    }

    return null;
  } catch (error) {
    console.error("Error extracting TikTok ID:", error);
    return null;
  }
}

/**
 * Detects platform from URL
 * @param {URL} urlObj
 * @returns {string|null}
 */
function detectPlatform(urlObj) {
  if (urlObj.hostname.includes("instagram.com")) return "INSTAGRAM";
  if (urlObj.hostname.includes("tiktok.com")) return "TIKTOK";
  return null;
}

/**
 * Validates and processes a social media URL
 * @param {string} url
 * @returns {Promise<{ platform: string|null, videoId: string|null, normalizedUrl: string|null, error: string|null }>}
 */
export async function validateSocialUrl(url) {
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
      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      // For share URLs, resolve to final URL
      let finalUrl = url;
      if (pathParts.includes("share")) {
        finalUrl = await resolveInstagramUrl(url);
      }

      const videoId = extractInstagramId(finalUrl);
      if (!videoId) {
        return {
          platform,
          videoId: null,
          normalizedUrl: null,
          error: "Could not extract Instagram video ID",
        };
      }

      return {
        platform,
        videoId,
        normalizedUrl: finalUrl,
        error: null,
      };
    }

    // Handle TikTok
    if (platform === "TIKTOK") {
      const videoId = extractTikTokId(url);
      if (!videoId) {
        return {
          platform,
          videoId: null,
          normalizedUrl: null,
          error: "Could not extract TikTok video ID",
        };
      }

      const normalizedUrl = `https://www.tiktok.com/video/${videoId}`;
      return {
        platform,
        videoId,
        normalizedUrl,
        error: null,
      };
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
