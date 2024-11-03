import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Cat, Gamepad2 } from "lucide-react";
import { cn } from "../lib/utils";

const NavLink = ({ to, children, icon: Icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300",
        "hover:bg-blue-100 hover:transform hover:scale-105",
        "font-['Orbitron'] font-bold text-sm md:text-base",
        isActive
          ? "bg-blue-100 text-blue-700 shadow-md"
          : "text-blue-600 hover:text-blue-700",
      )}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden md:inline">{children}</span>
    </Link>
  );
};

export function KawaiiNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b-2 border-blue-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/logo192.png"
              alt="Oiiai Cat Logo"
              className="w-8 h-8 transition-transform duration-300 group-hover:scale-110 animate-[bounce_2s_ease-in-out_infinite]"
            />
            <span className="font-['Orbitron'] font-black text-lg text-blue-500">
              Oiiai Cat
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2 md:gap-4">
            <NavLink to="/" icon={Home} label="Home">
              Home
            </NavLink>
            <NavLink to="/cat" icon={Cat} label="Interactive Cat">
              Spinning Cat
            </NavLink>
            <NavLink to="/games" icon={Gamepad2} label="Games">
              Games
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default KawaiiNav;
