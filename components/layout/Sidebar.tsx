"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const planets = [
  "Sun",
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
];

type SidebarProps = {
  onSelect: (planetName: string) => void;
  selectedPlanet: string;
};

export default function Sidebar({
  onSelect,
  selectedPlanet,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (planet: string) => {
    onSelect(planet);

    // Mobile menu automatically close
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/70 text-pink-400 backdrop-blur-md transition-all hover:text-pink-300 md:hidden"
        aria-label="Toggle planet navigation"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Desktop Sidebar */}
      <nav
        aria-label="Planet navigation"
        className="fixed left-0 top-0 z-20 hidden h-full w-28 flex-col items-center gap-3 py-4 md:flex"
      >
        {planets.map((p) => {
          const isActive = selectedPlanet === p;

          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              aria-current={isActive ? "page" : undefined}
              className={`min-h-10 min-w-10 rounded-md px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-pink-500/25 text-white ring-1 ring-pink-400/60"
                  : "text-pink-400 hover:text-pink-300"
              }`}
            >
              {p}
            </button>
          );
        })}
      </nav>

      {/* Mobile Sidebar */}
      <nav
        aria-label="Mobile planet navigation"
        className={`fixed left-0 top-0 z-[55] h-full w-64 border-r border-white/10 bg-transparent px-6 pt-5 backdrop-blur-xl transition-transform duration-300 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-5 flex items-center justify-between pt-14">
          <span className="text-sm font-semibold uppercase tracking-[0.24em] text-pink-300">
            Planets
          </span>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-pink-300 transition hover:bg-pink-500/20 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {planets.map((p) => {
            const isActive = selectedPlanet === p;

            return (
              <button
                key={p}
                onClick={() => handleSelect(p)}
                className={`w-full rounded-lg px-4 py-3 text-left transition ${
                  isActive
                    ? "bg-pink-500/20 text-white ring-1 ring-pink-400/60"
                    : "text-pink-400 hover:bg-pink-500/20 hover:text-white"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          aria-label="Close navigation"
          className="fixed inset-0 z-[45] bg-black/50 md:hidden"
        />
      )}
    </>
  );
}