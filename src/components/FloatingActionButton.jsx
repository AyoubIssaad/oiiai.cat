import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useLocation } from "react-router-dom";

export const FloatingActionButton = () => {
  const location = useLocation();

  // Don't show FAB on the secret messages page
  if (location.pathname === "/secret-messages") {
    return null;
  }

  return (
    <Link
      to="/secret-messages"
      className="fixed bottom-6 right-6 z-50
        flex items-center gap-2
        kawaii-button accent
        group
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        hover:scale-105
        sm:px-6 sm:py-4
        px-4 py-3
        rounded-full sm:rounded-xl"
      aria-label="Encode secret cat messages"
    >
      <MessageSquare className="w-6 h-6 sm:w-5 sm:h-5" />

      {/* Text only shows on hover for mobile, always visible on desktop */}
      <span className="hidden sm:inline font-['Orbitron'] font-bold text-sm whitespace-nowrap">
        Meow in Code!
      </span>

      {/* Mobile tooltip */}
      <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2
        bg-black text-white text-xs px-2 py-1 rounded
        opacity-0 group-hover:opacity-100
        pointer-events-none
        transition-opacity duration-200
        whitespace-nowrap
        sm:hidden"
      >
        Meow in Code!
      </span>

      {/* Decorative elements */}
      <span className="absolute -top-1 -right-1 text-lg animate-bounce">✨</span>
    </Link>
  );
};
