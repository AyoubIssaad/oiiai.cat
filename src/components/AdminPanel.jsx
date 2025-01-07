import React, { useState, useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/Button";
import SocialMediaEmbed from "./SocialMediaEmbed";

const AdminPanel = () => {
  const [pendingMemes, setPendingMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                {error}
              </div>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Meme Review Panel</h1>
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

      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

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

      {pendingMemes.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending memes to review</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
