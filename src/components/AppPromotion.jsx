import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const AppPromotion = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosedBefore, setHasClosedBefore] = useState(false);

  useEffect(() => {
    const hasClosedPopup = localStorage.getItem("appPromoClosed");
    setHasClosedBefore(!!hasClosedPopup);

    if (!hasClosedPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("appPromoClosed", "true");
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
      </div>
    </div>
  );
};

export default AppPromotion;
