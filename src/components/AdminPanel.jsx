import React, { useState, useEffect } from "react";
import { Check, X, AlertCircle, Plus } from "lucide-react";
import { Button } from "./ui/Button";
import { Alert, AlertDescription } from "./ui/Alert";
import SocialMediaEmbed from "./SocialMediaEmbed";

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

const detectPlatform = (url) => {
  if (/instagram\.com/.test(url)) return "INSTAGRAM";
  if (/tiktok\.com/.test(url)) return "TIKTOK";
  return null;
};

const AdminPanel = () => {
  const [pendingMemes, setPendingMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemeUrl, setNewMemeUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (token) {
      fetchPendingMemes();
    }
  }, [token]);

  const fetchPendingMemes = async () => {
    try {
      const response = await fetch("/api/admin/memes/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setToken(null);
          localStorage.removeItem("adminToken");
          throw new Error("Session expired. Please login again.");
        }
        throw new Error("Failed to fetch pending memes");
      }

      const data = await response.json();
      setPendingMemes(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const { token: newToken } = await response.json();
      localStorage.setItem("adminToken", newToken);
      setToken(newToken);
      setUsername("");
      setPassword("");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddMeme = async (e) => {
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

      const response = await fetch("/api/admin/memes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: newMemeUrl,
          platform,
          videoId,
          status: "approved", // Auto-approve admin submissions
        }),
      });

      if (!response.ok) throw new Error("Failed to add meme");

      setSuccessMessage("Meme added successfully!");
      setNewMemeUrl("");
      setShowAddForm(false);

      // Refresh the pending memes list
      fetchPendingMemes();

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (memeId, status, adminNotes = "") => {
    try {
      const response = await fetch(`/api/admin/memes/${memeId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update meme status");
      }

      // Remove the reviewed meme from the list
      setPendingMemes(pendingMemes.filter((meme) => meme.id !== memeId));
    } catch (error) {
      setError(error.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Meme
          </Button>
          <Button
            onClick={() => {
              setToken(null);
              localStorage.removeItem("adminToken");
            }}
            className="bg-red-500 hover:bg-red-600"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

            <form onSubmit={handleAddMeme}>
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

      {/* Pending Memes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingMemes.map((meme) => (
          <div
            key={meme.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-4">
              <SocialMediaEmbed
                platform={meme.platform}
                videoId={meme.video_id}
              />
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(meme.created_at).toLocaleString()}
                </p>
                <a
                  href={meme.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm"
                >
                  View Original
                </a>
              </div>

              <div className="flex justify-between gap-4">
                <Button
                  onClick={() => handleReview(meme.id, "approved")}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReview(meme.id, "rejected")}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-blue-600">Loading pending memes...</p>
        </div>
      )}

      {!loading && pendingMemes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending memes to review</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
