import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const RandomPromotion = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosedBefore, setHasClosedBefore] = useState(false);
  const [promoType, setPromoType] = useState("app"); // "app" or "shirt"

  useEffect(() => {
    const hasClosedPopup = localStorage.getItem("promoClosed");
    setHasClosedBefore(!!hasClosedPopup);

    if (!hasClosedPopup) {
      // Randomly choose between app and shirt promotion
      setPromoType(Math.random() < 0.5 ? "app" : "shirt");

      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("promoClosed", "true");
  };

  if (!isVisible || hasClosedBefore) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[600px] bg-white rounded-2xl shadow-xl overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-2 text-white hover:text-white/80 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {promoType === "app" ? (
          // App Promotion Content
          <>
            <div className="bg-gradient-to-br from-[#279AF1] to-[#2388d6] p-6 text-white text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-[#0bf70a] rounded-2xl shadow-lg p-2">
                <img
                  src="/logo192.png"
                  alt="App Icon"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <h2 className="font-['Orbitron'] text-xl font-bold mb-2">
                Oiiai Cat Mobile App
              </h2>
              <p className="text-blue-100">
                Take the spinning cat magic with you everywhere!
              </p>
            </div>
            <div className="p-6">
              <div className="mt-6 space-y-3">
                <a
                  href="https://play.google.com/store/apps/details?id=com.binarypax.oiiaicat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-[#279AF1] text-white text-center rounded-lg font-medium hover:bg-[#2388d6] transition-colors"
                >
                  Download on Google Play
                </a>
                <button
                  onClick={handleClose}
                  className="block w-full py-3 px-4 text-[#279AF1] text-center rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </>
        ) : (
          // T-shirt Promotion Content
          <>
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 text-white text-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-4">
                <img
                  src="/shirt.png"
                  alt="T-shirt Design"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="font-['Orbitron'] text-xl font-bold mb-2">
                Limited Edition Merch
              </h2>
              <p className="text-purple-100">
                Show your love for Oiiai Cat with our exclusive t-shirt!
              </p>
            </div>
            <div className="p-6">
              <div className="mt-6 space-y-3">
                <a
                  href="https://store.oiiai.cat/products/the-oiiai-spinning-cat-tee-where-memes-meet-street-style?variant=50855494648097"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 px-4 bg-purple-600 text-white text-center rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Shop Now
                </a>
                <button
                  onClick={handleClose}
                  className="block w-full py-3 px-4 text-purple-600 text-center rounded-lg font-medium hover:bg-purple-50 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RandomPromotion;
