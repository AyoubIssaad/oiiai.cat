import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  AlertCircle,
  X,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import SocialMediaEmbed from "./SocialMediaEmbed";

// Helper function to extract video ID from URL
const extractVideoId = (url, platform) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (platform.toUpperCase() === "INSTAGRAM") {
      // Look for ID after /p/ or /reel/
      const idIndex = pathParts.findIndex(
        (part) => part === "p" || part === "reel",
      );
      return idIndex !== -1 ? pathParts[idIndex + 1] : null;
    }

    if (platform.toUpperCase() === "TIKTOK") {
      // Get last part of the path for TikTok
      const videoIndex = pathParts.findIndex((part) => part === "video");
      return videoIndex !== -1
        ? pathParts[videoIndex + 1]
        : pathParts[pathParts.length - 1];
    }

    return null;
  } catch (error) {
    console.error("Error extracting video ID:", error, { url, platform });
    return null;
  }
};

const MemeGallery = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemeUrl, setNewMemeUrl] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch memes from the backend
  const fetchMemes = async (pageNum) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/memes?page=${pageNum}`);

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            "Rate limit reached. Please wait a moment before loading more.",
          );
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched memes:", data); // Debug log

      // Check if we got any new data
      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // Process the memes to include extracted video IDs
      const processedMemes = data.map((meme) => ({
        ...meme,
        extractedVideoId: extractVideoId(meme.url, meme.platform),
      }));

      if (pageNum === 1) {
        setMemes(processedMemes);
      } else {
        setMemes((prev) => [...prev, ...processedMemes]);
      }
    } catch (err) {
      console.error("Error fetching memes:", err);
      setError("Failed to load memes");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMemes(1);
  }, []);

  // Detect platform and extract video ID
  const detectPlatform = (url) => {
    const instagramPattern = /instagram\.com/;
    const tiktokPattern = /tiktok\.com/;

    if (instagramPattern.test(url)) return "INSTAGRAM";
    if (tiktokPattern.test(url)) return "TIKTOK";

    return null;
  };

  // Handle new meme submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const platform = detectPlatform(newMemeUrl);
      if (!platform) {
        setError("Unsupported platform or invalid URL");
        return;
      }

      const videoId = extractVideoId(newMemeUrl, platform);
      if (!videoId) {
        setError("Could not extract video ID from URL");
        return;
      }

      // Check for duplicates
      const isDuplicate = memes.some(
        (meme) =>
          meme.extractedVideoId === videoId && meme.platform === platform,
      );

      if (isDuplicate) {
        setError("This meme has already been added");
        return;
      }

      const response = await fetch("/api/memes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: newMemeUrl,
          platform,
          videoId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add meme");

      // Refresh memes list
      fetchMemes(1);
      setNewMemeUrl("");
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle voting
  const handleVote = async (memeId, voteType) => {
    try {
      const response = await fetch(`/api/memes/${memeId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: voteType }),
      });

      if (!response.ok) throw new Error("Failed to vote");

      setMemes((prev) =>
        prev.map((meme) => {
          if (meme.id === memeId) {
            return {
              ...meme,
              votes: voteType === "up" ? meme.votes + 1 : meme.votes - 1,
            };
          }
          return meme;
        }),
      );
    } catch (err) {
      setError("Failed to register vote");
    }
  };

  // Improved infinite scroll handler with debounce
  useEffect(() => {
    let timeoutId;
    let isLoadingMore = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !error &&
          hasMore &&
          !isLoadingMore
        ) {
          isLoadingMore = true;
          timeoutId = setTimeout(() => {
            setPage((prev) => prev + 1);
            fetchMemes(page + 1).finally(() => {
              isLoadingMore = false;
            });
          }, 1500); // Increased delay to prevent rapid firing
        }
      },
      {
        threshold: 0,
        rootMargin: "200px",
      },
    );

    if (observerTarget.current && hasMore) {
      observer.observe(observerTarget.current);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, page, error, hasMore]);

  return (
    <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-blue-700">Community Memes</h2>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={20} />
          Add Meme
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Meme Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Add New Meme</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newMemeUrl}
                    onChange={(e) => setNewMemeUrl(e.target.value)}
                    placeholder="Paste Instagram Reel or TikTok URL"
                    className="flex-1 p-2 border rounded"
                    required
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Supports Instagram Reels and TikTok videos
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memes.map((meme) => (
          <div
            key={meme.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden max-w-xl mx-auto w-full"
          >
            <div className="relative">
              <SocialMediaEmbed
                platform={meme.platform}
                videoId={meme.extractedVideoId || meme.video_id}
              />
            </div>

            {/* Debug info - remove in production */}
            <div className="p-2 text-xs text-gray-500">
              <p>Platform: {meme.platform}</p>
              <p>Video ID: {meme.extractedVideoId || meme.video_id}</p>
              <p>URL: {meme.url}</p>
            </div>

            {/* Interaction Bar */}
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(meme.id, "up")}
                  className="p-2 hover:bg-blue-50 rounded-full"
                >
                  <ThumbsUp size={20} className="text-blue-600" />
                </button>
                <span className="font-bold">{meme.votes}</span>
                <button
                  onClick={() => handleVote(meme.id, "down")}
                  className="p-2 hover:bg-blue-50 rounded-full"
                >
                  <ThumbsDown size={20} className="text-blue-600" />
                </button>
              </div>

              <a
                href={meme.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                <LinkIcon size={16} />
                <span className="text-sm">Original</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-blue-600">Loading memes...</p>
        </div>
      )}

      {/* Infinite Scroll Observer */}
      <div ref={observerTarget} className="h-4" />
    </div>
  );
};

export default MemeGallery;
