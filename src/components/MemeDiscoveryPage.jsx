import React, { useState, useEffect } from "react";
import {
  Flame,
  TrendingUp,
  Calendar,
  Star,
  Plus,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import SocialMediaEmbed, { VideoPlaybackProvider } from "./SocialMediaEmbed";
import SEO from "./SEO";
import { validateSocialUrl } from "../lib/urlValidation";

const CATEGORIES = [
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "latest", label: "Latest", icon: Calendar },
  { id: "all", label: "All Memes", icon: Star },
];

const MemeDiscoveryPage = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemeUrl, setNewMemeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMemes = async (pageNum, resetExisting = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category: selectedCategory,
        page: pageNum,
        limit: 12,
      });

      const response = await fetch(`/api/memes/discover?${queryParams}`);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Rate limit reached. Please wait a moment before loading more.",
          );
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        setHasMore(false);
        if (pageNum === 1) {
          setMemes([]);
        }
        return;
      }

      setMemes((prev) => (resetExisting ? data : [...prev, ...data]));
      setHasMore(data.length === 12);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemes(1, true);
  }, [selectedCategory]);

  const handleSubmitNewMeme = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage("");

    try {
      const {
        platform,
        videoId,
        normalizedUrl,
        error: validationError,
      } = await validateSocialUrl(newMemeUrl);
      if (validationError) {
        throw new Error(validationError);
      }

      const isDuplicate = memes.some(
        (meme) => meme.video_id === videoId && meme.platform === platform,
      );

      if (isDuplicate) {
        throw new Error("This meme has already been added");
      }

      const response = await fetch("/api/memes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: normalizedUrl || newMemeUrl,
          platform,
          videoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add meme");
      }

      setSuccessMessage(
        "Meme submitted successfully! It will appear after review.",
      );
      setNewMemeUrl("");
      setShowAddForm(false);
      fetchMemes(1, true);

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMemes(nextPage, false);
    }
  };

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

  return (
    <VideoPlaybackProvider>
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 min-h-screen bg-white">
        <SEO
          title="Viral Oiiai Cat & Banana Cat Memes | Best Spinning Cat Collection"
          description="Discover and share the best Oiiai Cat memes! Vote for your favorites, submit new spins, and join our growing collection of viral spinning cat content. Updated daily with fresh memes! 🐱"
          path="/memes"
        />

        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-blue-700 mb-4">
              Discover Memes
            </h1>
            <p className="text-blue-600 max-w-2xl">
              Explore the best oiiai cat memes from across the internet. Vote
              for your favorites!
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 py-3 px-6 h-12 text-base"
          >
            <Plus className="w-5 h-5" />
            Add Meme
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-4 mb-6 px-1 scrollbar-none">
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors
              ${
                selectedCategory === id
                  ? "bg-blue-500 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert className="mb-4 bg-green-50 border-green-500 text-green-700">
            <AlertDescription>{successMessage}</AlertDescription>
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
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitNewMeme}>
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
              className="bg-white rounded-lg shadow-lg overflow-hidden max-w-xl mx-auto w-full flex flex-col"
            >
              <div className="relative grow">
                <div
                  className={
                    meme.platform === "INSTAGRAM"
                      ? "instagram-embed-container"
                      : ""
                  }
                >
                  <SocialMediaEmbed
                    platform={meme.platform}
                    videoId={meme.video_id}
                    autoplay={false}
                  />
                </div>
                {/* Interaction Bar */}
                <div
                  className="p-4 flex justify-between items-center bg-white bg-opacity-90 backdrop-blur-sm"
                  style={{ zIndex: 10 }}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(meme.id, "up")}
                      className="p-2 hover:bg-blue-50 rounded-full bg-white shadow-sm"
                    >
                      <ThumbsUp className="w-5 h-5 text-blue-600" />
                    </button>
                    <span className="font-bold bg-white px-2 py-1 rounded">
                      {meme.votes}
                    </span>
                    <button
                      onClick={() => handleVote(meme.id, "down")}
                      className="p-2 hover:bg-blue-50 rounded-full bg-white shadow-sm"
                    >
                      <ThumbsDown className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>

                  <a
                    href={meme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-white px-3 py-1 rounded shadow-sm"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-sm">Original</span>
                  </a>
                </div>
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

        {/* No Results */}
        {!loading && memes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No memes found</p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && memes.length > 0 && hasMore && (
          <div className="text-center mt-8">
            <Button onClick={handleLoadMore} className="kawaii-button">
              Load More Memes
            </Button>
          </div>
        )}
      </div>
    </VideoPlaybackProvider>
  );
};

export default MemeDiscoveryPage;
