import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Plus,
  AlertCircle,
  X,
  Link as LinkIcon,
} from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Button } from "../components/ui/Button";
import { Alert, AlertDescription } from "../components/ui/Alert";

const SUPPORTED_PLATFORMS = {
  INSTAGRAM: {
    pattern: /instagram.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/,
    embedUrl: "https://www.instagram.com/embed.js",
  },
  TIKTOK: {
    pattern: /tiktok.com\/@[\w.-]+\/video\/(\d+)/,
    embedUrl: "https://www.tiktok.com/embed.js",
  },
  YOUTUBE: {
    pattern: /(?:youtube.com\/shorts\/|youtu.be\/)([A-Za-z0-9_-]+)/,
    embedUrl: "",
  },
};

const MemeGallery = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemeUrl, setNewMemeUrl] = useState("");
  const [page, setPage] = useState(1);
  const observerTarget = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // Load initial memes
  useEffect(() => {
    fetchMemes(1);
  }, []);

  // Fetch memes from the backend
  const fetchMemes = async (pageNum) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/memes?page=${pageNum}`);
      const data = await response.json();

      if (pageNum === 1) {
        setMemes(data);
      } else {
        setMemes((prev) => [...prev, ...data]);
      }
    } catch (err) {
      setError("Failed to load memes");
      console.error("Error fetching memes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll handler using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prev) => prev + 1);
          fetchMemes(page + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loading, page]);

  // Detect platform and extract video ID
  const detectPlatform = (url) => {
    for (const [platform, { pattern }] of Object.entries(SUPPORTED_PLATFORMS)) {
      const match = url.match(pattern);
      if (match) {
        return { platform, videoId: match[1] };
      }
    }
    return null;
  };

  // Handle new meme submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const platformInfo = detectPlatform(newMemeUrl);

      if (!platformInfo) {
        setError("Unsupported platform or invalid URL");
        return;
      }

      // Check for duplicates
      const isDuplicate = memes.some(
        (meme) =>
          meme.videoId === platformInfo.videoId &&
          meme.platform === platformInfo.platform,
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
          platform: platformInfo.platform,
          videoId: platformInfo.videoId,
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

      // Update local state
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
                    placeholder="Paste Instagram Reel, TikTok, or YouTube Shorts URL"
                    className="flex-1 p-2 border rounded"
                    required
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Adding..." : "Add"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Supports Instagram Reels, TikTok videos, and YouTube Shorts
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
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Video Embed Container */}
            <div className="relative pt-[177.77%]">
              {meme.platform === "YOUTUBE" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${meme.videoId}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                />
              ) : (
                <div
                  className="absolute inset-0"
                  dangerouslySetInnerHTML={{
                    __html: `<blockquote
                      class="instagram-media"
                      data-instgrm-permalink="https://www.instagram.com/p/${meme.videoId}/"
                    ></blockquote>`,
                  }}
                />
              )}
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
          <p className="mt-4 text-blue-600">Loading more memes...</p>
        </div>
      )}

      {/* Infinite Scroll Observer */}
      <div ref={observerTarget} className="h-4" />
    </div>
  );
};

export default MemeGallery;
