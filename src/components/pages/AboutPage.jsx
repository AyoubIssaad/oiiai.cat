import React from "react";
import { Link } from "react-router-dom";
import {
  Cat,
  Gamepad2,
  MessageSquare,
  Sparkles,
  Send,
  Keyboard,
  Users,
  Rocket,
  Share2,
} from "lucide-react";
import { Button } from "../ui/Button";
import SEO from "../SEO";

export function AboutPage() {
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
        title="🐱 Oiiai and Banana Cat Goes Spin! - The Official Oiiai Cat Playground"
        description="Witness the legendary Oiiai Cat (aka Banana Cat) in action! Make the cat go spinny spin, send secret cat messages, and spread joy across the internet. The most purrfect cat meme experience! 🌟"
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
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 mb-16">
        <div className="max-w-4xl mx-auto">
          <div className="kawaii-card p-8 bg-gradient-to-br from-blue-50 to-white">
            <h2 className="kawaii-title text-2xl text-center mb-8 flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              Awesome Features
              <Sparkles className="w-6 h-6 text-blue-500" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Cat className="w-8 h-8 text-blue-500 animate-[bounce_2s_ease-in-out_infinite]" />
                  <p className="text-blue-700 font-medium">
                    Make Banana Cat go spinny spin!
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Send secret messages in cat language
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Keyboard className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Play typing games with Oiiai patterns
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Send className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Share the joy with other cat fans
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Join the spinning cat community
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Rocket className="w-8 h-8 text-blue-500" />
                  <p className="text-blue-700 font-medium">
                    Discover new ways to play with Banana Cat
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button onClick={handleShare} className="kawaii-button accent">
                <Share2 className="w-4 h-4 mr-2" />
                Share the Fun!
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Interactive Cat Card */}
          <Link
            to="/cat"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Cat className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Interactive Cat</h2>
            <p className="text-blue-700 mb-4">
              Make Banana Cat go spinny spin! Control the iconic animation with
              perfect music sync.
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Try it now →
            </span>
          </Link>

          {/* Secret Messages Card */}
          <Link
            to="/secret"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Secret Messages</h2>
            <p className="text-blue-700 mb-4">
              Send mysterious cat-coded messages using the ancient Oiiai
              language!
            </p>
            <span className="kawaii-text text-sm text-blue-500">
              Send now →
            </span>
          </Link>

          {/* Games Card */}
          <Link
            to="/games"
            className="kawaii-card p-8 text-center hover:scale-105 transition-transform"
          >
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="kawaii-title text-2xl mb-4">Fun Games</h2>
            <p className="text-blue-700 mb-4">
              Test your skills with our collection of Banana Cat games and
              challenges!
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
          <h2 className="kawaii-title text-2xl text-center mb-8">
            About Banana Cat
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">🐱</span>
                <div>
                  <h3 className="kawaii-subtitle text-xl mb-2">
                    What's a Oiiai Cat ?
                  </h3>
                  <p className="text-blue-700">
                    The tale of the spinning sensation that broke the internet!
                    Also known as Banana Cat, this adorable feline has been
                    spinning its way into hearts worldwide with its mesmerizing
                    rotations and catchy tune.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="text-2xl">🔮</span>
                <div>
                  <h3 className="kawaii-subtitle text-xl mb-2">
                    Secret Cat Language
                  </h3>
                  <p className="text-blue-700">
                    Send covert messages in the ancient tongue of the spinning
                    cat! Our special Oiiai translator turns your words into
                    mysterious cat patterns. Perfect for secret communications
                    with fellow Banana Cat enthusiasts!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-blue-700 mt-6">
            <h3 className="kawaii-subtitle text-xl mb-4">Fun Facts:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                The original meme gained millions of views across social
                platforms
              </li>
              <li>
                Our interactive version adds new ways to enjoy the beloved cat
              </li>
              <li>
                The secret message feature uses actual cat sounds for
                authenticity
              </li>
              <li>Perfect for short breaks and instant mood boosts</li>
            </ul>
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

export default AboutPage;
