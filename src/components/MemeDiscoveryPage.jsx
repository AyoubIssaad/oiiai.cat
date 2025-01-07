import React, { useState, useEffect } from "react";
import {
  Flame,
  Search,
  TrendingUp,
  Calendar,
  Star,
  Plus,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Link as LinkIcon,
  X,
  Filter,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import SocialMediaEmbed from "./SocialMediaEmbed";
import SEO from "./SEO";

const CATEGORIES = [
  { id: "popular", label: "Most Popular", icon: Flame },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "newest", label: "Latest", icon: Calendar },
  { id: "all", label: "All Memes", icon: Star },
];

const PLATFORMS = [
  { id: "all", label: "All Platforms" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
];

// Helper function to extract video ID from URL
const extractVideoId = (url, platform) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (platform.toUpperCase() === "INSTAGRAM") {
      const idIndex = pathParts.findIndex(
        (part) => part === "p" || part === "reel",
      );
      return idIndex !== -1 ? pathParts[idIndex + 1] : null;
    }

    if (platform.toUpperCase() === "TIKTOK") {
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
};

const MemeDiscoveryPage = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [trendingTags, setTrendingTags] = useState([]);
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
        platform: selectedPlatform,
        dateRange,
        search: searchQuery,
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

      const processedMemes = data.map((meme) => ({
        ...meme,
        extractedVideoId: extractVideoId(meme.url, meme.platform),
      }));

      setMemes((prev) =>
        resetExisting ? processedMemes : [...prev, ...processedMemes],
      );
      setHasMore(data.length === 12);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingTags = async () => {
    try {
      const response = await fetch("/api/memes/trending-tags");
      const data = await response.json();
      setTrendingTags(data);
    } catch (err) {
      console.error("Error fetching trending tags:", err);
    }
  };

  useEffect(() => {
    fetchMemes(1, true);
    fetchTrendingTags();
  }, [selectedCategory, selectedPlatform, dateRange, searchQuery]);

  const handleSubmitNewMeme = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage("");

    try {
      const platform = detectPlatform(newMemeUrl);
      if (!platform) {
        throw new Error("Unsupported platform or invalid URL");
      }

      const videoId = extractVideoId(newMemeUrl, platform);
      if (!videoId) {
        throw new Error("Could not extract video ID from URL");
      }

      const isDuplicate = memes.some(
        (meme) =>
          meme.extractedVideoId === videoId && meme.platform === platform,
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
          url: newMemeUrl,
          platform,
          videoId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add meme");

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

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setHasMore(true);
    fetchMemes(1, true);
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

  const detectPlatform = (url) => {
    if (/instagram\.com/.test(url)) return "INSTAGRAM";
    if (/tiktok\.com/.test(url)) return "TIKTOK";
    return null;
  };

  return (
    <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 min-h-screen bg-white">
      <SEO
        title="🎮 Discover Oiiai Cat / Banana Cat Memes - Watch the Best Spins!"
        description="Explore the finest collection of spinning cat memes! Watch, vote, and share your favorite Oiiai Cat and Banana Cat moments. New memes added daily! 🐱"
        path="/discover"
      />

      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-blue-700 mb-4">
            Discover Memes
          </h1>
          <p className="text-blue-600 max-w-2xl">
            Explore the best oiiai cat memes from across the internet. Vote for
            your favorites!
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

      {/* Search and Filter Section */}
      <div className="mb-8">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memes..."
              className="w-full pl-10 pr-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Search</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>
        </form>

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

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-blue-700">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {PLATFORMS.map(({ id, label }) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Trending Tags */}
        {trendingTags.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-500">Trending:</span>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
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
                  videoId={meme.extractedVideoId || meme.video_id}
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
          <p className="text-gray-500 mb-4">No memes found</p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("popular");
              setSelectedPlatform("all");
              setDateRange("all");
              fetchMemes(1, true);
            }}
          >
            Clear Filters
          </Button>
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
  );
};

export default MemeDiscoveryPage;
