import React, { useState, useEffect } from "react";
import {
  Flame,
  Search,
  TrendingUp,
  Calendar,
  Star,
  Filter,
  X,
  SlidersHorizontal,
  Share2,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import SocialMediaEmbed from "./SocialMediaEmbed";

const CATEGORIES = [
  { id: "all", label: "All Memes", icon: Star },
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "newest", label: "Latest", icon: Calendar },
  { id: "popular", label: "Most Popular", icon: Flame },
];

const PLATFORMS = [
  { id: "all", label: "All Platforms" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube Shorts" },
];

const MemeDiscoveryPage = () => {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState("all");
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    fetchMemes();
    fetchTrendingTags();
  }, [selectedCategory, selectedPlatform, dateRange]);

  const fetchMemes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        category: selectedCategory,
        platform: selectedPlatform,
        dateRange,
        search: searchQuery,
      });

      const response = await fetch(`/api/memes/discover?${queryParams}`);
      const data = await response.json();
      setMemes(data);
    } catch (err) {
      setError("Failed to load memes");
      console.error("Error fetching memes:", err);
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMemes();
  };

  const handleShare = async (meme) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Check out this cat meme!",
          text: meme.description || "Found this awesome cat meme on Oiiai Cat!",
          url: meme.url,
        });
      } else {
        await navigator.clipboard.writeText(meme.url);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8">
      {/* Header Section */}
      <div className="">
        <h1 className="text-4xl font-bold text-blue-700 mb-4 font-['']">
          Discover Cat Memes
        </h1>
        <p className="text-blue-600 max-w-2xl mx-auto">
          Explore the best spinning cat memes from across the internet. Vote for
          your favorites and share the joy!
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
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
          <Button type="submit" className="flex items-center gap-2">
            <Search size={20} />
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal size={20} />
            Filters
          </Button>
        </form>

        {/* Category Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
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
              <Icon size={20} />
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
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Platform Filter */}
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

              {/* Date Range Filter */}
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
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Meme Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-blue-600">Loading amazing cat memes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memes.map((meme) => (
            <div
              key={meme.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {/* Video Container */}
              <div className="relative pt-[177.77%]">
                <div className="absolute inset-0">
                  {/* Embed video based on platform */}
                  {/* Implementation depends on platform */}
                </div>
              </div>

              {/* Meme Info */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">
                    {new Date(meme.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      meme.platform === "instagram"
                        ? "bg-pink-100 text-pink-700"
                        : meme.platform === "tiktok"
                          ? "bg-black text-white"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {meme.platform}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-blue-50 rounded-full">
                      <Star
                        size={20}
                        className={
                          meme.liked
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-400"
                        }
                      />
                    </button>
                    <span className="text-gray-600">{meme.votes}</span>
                  </div>
                  <button
                    onClick={() => handleShare(meme)}
                    className="p-2 hover:bg-blue-50 rounded-full"
                  >
                    <Share2 size={20} className="text-blue-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && memes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No memes found</p>
          <Button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedPlatform("all");
              setDateRange("all");
              fetchMemes();
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default MemeDiscoveryPage;
