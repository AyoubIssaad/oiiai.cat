import React from "react";
import { Link } from "react-router-dom";
import { FloatingActionButton } from "./FloatingActionButton";
import RandomPromotion from "./RandomPromotion";

export function MainLayout({ children }) {
  return (
    <div className="min-h-screen kawaii-theme">
      <RandomPromotion />
      {children}

      <FloatingActionButton />
      {/* Enhanced Footer */}
      <footer className="bg-blue-50 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="kawaii-subtitle text-lg mb-4">About</h3>
              <p className="text-blue-700 text-sm">
                Oiiai Cat brings joy through interactive meme experiences.
                Created with love by cat enthusiasts for cat enthusiasts.
              </p>
            </div>
            <div>
              <h3 className="kawaii-subtitle text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://store.oiiai.cat"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buy Oiiai Merch
                  </a>
                </li>
                <li>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.binarypax.oiiaicat"
                    className="text-blue-600 hover:text-blue-800"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get the App
                  </a>
                </li>
                <li>
                  <Link
                    to="/memes"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Discover Memes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@oiiai.cat"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="kawaii-subtitle text-lg mb-4">Follow Us</h3>
              <p className="text-blue-700 text-sm">
                Share your Oiiai Cat moments with #OiiaiCat
              </p>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-blue-200">
            <p className="kawaii-text mb-4">
              Made with <span className="animate-pulse inline-block">❤️</span>{" "}
              by{" "}
              <a
                className="text-blue-500 hover:text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
                href="https://aubiss.com"
              >
                aubiss
              </a>
            </p>
            <p className="text-s text-blue-600">
              <a href="mailto:contact@oiiai.cat">✉ contact@oiiai.cat</a>
            </p>
            <p className="text-xs text-blue-600">
              © {new Date().getFullYear()} Oiiai Cat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
