import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Cat, Gamepad2, Lock, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

const NavLink = ({ to, children, icon: Icon, label, onClick }) => {
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
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="w-5 h-5" />
      <span className="inline">{children}</span>
    </Link>
  );
};

export function KawaiiNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 md:gap-4">
            <NavLink to="/" icon={Home} label="Home">
              Home
            </NavLink>
            <NavLink to="/cat" icon={Cat} label="Interactive Cat">
              Spinning Cat
            </NavLink>
            <NavLink to="/games" icon={Gamepad2} label="Games">
              Games
            </NavLink>
            <NavLink to="/secret" icon={Lock} label="Secret">
              Secret
            </NavLink>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b-2 border-blue-200 py-4 px-4">
            <div className="flex flex-col gap-2">
              <NavLink to="/" icon={Home} label="Home" onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink
                to="/cat"
                icon={Cat}
                label="Interactive Cat"
                onClick={closeMenu}
              >
                Spinning Cat
              </NavLink>
              <NavLink
                to="/games"
                icon={Gamepad2}
                label="Games"
                onClick={closeMenu}
              >
                Games
              </NavLink>
              <NavLink
                to="/morse"
                icon={Lock}
                label="Secret"
                onClick={closeMenu}
              >
                Secret
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default KawaiiNav;
