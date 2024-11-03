import React from "react";
import { Link } from "react-router-dom";
import { Cat, Gamepad2, Share2 } from "lucide-react";
import { Button } from "../ui/Button";
import SEO from "../SEO";

export function HomePage() {
  // Analytics tracking function
  const trackEvent = (eventName, eventParams = {}) => {
    if (window.gtag) {
      window.gtag("event", eventName, eventParams);
    }
  };

  // Share functionality
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Oiiai Cat - Interactive Spinning Cat Animation",
          text: "Check out this fun spinning cat animation and game!",
          url: "https://oiiai.cat",
        });
        trackEvent("content_shared", { method: "native_share" });
      } else {
        await navigator.clipboard.writeText("https://oiiai.cat");
        alert("Link copied to clipboard!");
        trackEvent("content_shared", { method: "clipboard_copy" });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      trackEvent("share_error", { error: error.message });
    }
  };

  return (
    <>
      <SEO
        title="Oiiai Cat - Interactive Spinning Cat Animation & Games"
        description="Welcome to Oiiai Cat! Experience the viral sensation with our interactive spinning cat animation, fun games, and more. The perfect dose of daily joy!"
        path="/"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 mt-20 mb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h1 className="flex items-center justify-center gap-4 mb-6">
              <span className="kawaii-heading text-4xl">
                Welcome to Oiiai Cat
              </span>
            </h1>
            <p className="text-lg text-blue-700 mb-8">
              Experience the viral sensation! Control the famous spinning cat,
              play fun games, and discover more joy every day.
            </p>
            <Button onClick={handleShare} className="kawaii-button">
              <Share2 className="w-4 h-4 mr-2" />
              Share Joy
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            to="/cat"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Cat className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Interactive Cat</h2>
            <p className="text-blue-700 mb-4">
              Control the iconic spinning cat animation with perfect music sync!
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Try it now →
            </span>
          </Link>

          <Link
            to="/games"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Fun Games</h2>
            <p className="text-blue-700 mb-4">
              Test your skills with our collection of entertaining games!
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Play now →
            </span>
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="kawaii-card p-8 max-w-4xl mx-auto">
          <h2 className="kawaii-title text-2xl text-center mb-6">
            About Oiiai Cat
          </h2>
          <div className="space-y-4 text-blue-700">
            <p>
              The Oiiai Cat phenomenon started as a simple video of a spinning
              cat synchronized with a catchy tune. It quickly captured hearts
              worldwide, becoming one of the most beloved wholesome memes.
            </p>
            <p>
              Our interactive version lets you control the iconic spinning
              animation while staying true to the original's charm. Whether
              you're here to perfect the spin speed, master the typing
              challenge, or just need a moment of pure joy, Oiiai Cat is here
              for you!
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Happy Users</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">10K+</p>
            <p className="text-blue-700">Spreading joy daily</p>
          </div>
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Spins Generated</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">1M+</p>
            <p className="text-blue-700">And counting!</p>
          </div>
          <div className="kawaii-card p-6 text-center">
            <h3 className="kawaii-subtitle text-lg mb-2">Games Played</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">500K+</p>
            <p className="text-blue-700">Fun moments created</p>
          </div>
        </div>
      </section>
    </>
  );
}

export default HomePage;
