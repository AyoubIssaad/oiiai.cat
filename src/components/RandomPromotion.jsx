import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

// Product catalog - easy to add new products
const PRODUCTS = [
  {
    id: "shirt",
    name: "Original Oiiai Cat Tee",
    description: "Show your love for Oiiai Cat with our exclusive t-shirt!",
    image: "/shirt.png",
    url: "https://store.oiiai.cat/products/the-oiiai-spinning-cat-tee-where-memes-meet-street-style?variant=50855494648097",
    theme: "purple", // Simplified theme naming
  },
  {
    id: "hat",
    name: "Original Oiiai Cat Hat",
    description: "Show your love for Oiiai Cat with our exclusive hat!",
    image: "/hat.png",
    url: "https://store.oiiai.cat/products/oiiai-cat-hat-the-crown-of-internet-royalty",
    theme: "green", // Simplified theme naming
  },
];

// App promotion configuration
const APP_PROMO = {
  enabled: false,
  name: "Oiiai Cat Mobile App",
  description: "Take the spinning cat magic with you everywhere!",
  image: "/logo192.png",
  url: "https://play.google.com/store/apps/details?id=com.binarypax.oiiaicat",
  theme: "blue",
};

const getThemeClasses = (theme, element) => {
  const themes = {
    purple: {
      background: "bg-gradient-to-br from-purple-600 to-purple-800",
      button: "bg-purple-600 text-white hover:bg-purple-700",
      text: "text-purple-100",
      secondaryButton: "text-purple-600 hover:bg-purple-50",
    },
    green: {
      background: "bg-gradient-to-br from-emerald-500 to-emerald-700",
      button: "bg-emerald-600 text-white hover:bg-emerald-700",
      text: "text-white",
      secondaryButton: "text-emerald-600 hover:bg-emerald-50",
    },
    blue: {
      background: "bg-gradient-to-br from-blue-600 to-blue-800",
      button: "bg-blue-600 text-white hover:bg-blue-700",
      text: "text-white",
      secondaryButton: "text-blue-600 hover:bg-blue-50",
    },
  };

  return themes[theme]?.[element] || themes.purple[element];
};

const RandomPromotion = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosedBefore, setHasClosedBefore] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);

  useEffect(() => {
    const hasClosedPopup = localStorage.getItem("promoClosed");
    setHasClosedBefore(!!hasClosedPopup);

    if (!hasClosedPopup) {
      const availablePromos = [...PRODUCTS];
      if (APP_PROMO.enabled) {
        availablePromos.push({ ...APP_PROMO, id: "app" });
      }

      const randomPromo =
        availablePromos[Math.floor(Math.random() * availablePromos.length)];
      setSelectedPromo(randomPromo);

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

  if (!isVisible || hasClosedBefore || !selectedPromo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative w-full max-w-md max-h-[90vh] sm:max-h-[600px] bg-white rounded-2xl shadow-xl overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-2 text-white hover:text-white/80 rounded-full hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`${getThemeClasses(selectedPromo.theme, "background")} p-6 text-white text-center`}
        >
          <div
            className={`${
              selectedPromo.id === "app"
                ? "w-20 h-20 bg-[#0bf70a]"
                : "w-48 h-48 sm:w-64 sm:h-64"
            } mx-auto mb-4 ${
              selectedPromo.id === "app" ? "rounded-2xl shadow-lg p-2" : ""
            }`}
          >
            <img
              src={selectedPromo.image}
              alt={selectedPromo.name}
              className={`w-full h-full object-contain ${selectedPromo.id === "app" ? "rounded-xl" : ""}`}
            />
          </div>
          <h2 className="font-['Orbitron'] text-xl font-bold mb-2">
            {selectedPromo.name}
          </h2>
          <p className={getThemeClasses(selectedPromo.theme, "text")}>
            {selectedPromo.description}
          </p>
        </div>
        <div className="p-6">
          <div className="mt-6 space-y-3">
            <a
              href={selectedPromo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block w-full py-3 px-4 ${getThemeClasses(selectedPromo.theme, "button")} text-center rounded-lg font-medium transition-colors`}
            >
              {selectedPromo.id === "app"
                ? "Download on Google Play"
                : "Shop Now"}
            </a>
            <button
              onClick={handleClose}
              className={`block w-full py-3 px-4 ${getThemeClasses(selectedPromo.theme, "secondaryButton")} text-center rounded-lg font-medium transition-colors`}
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RandomPromotion;
