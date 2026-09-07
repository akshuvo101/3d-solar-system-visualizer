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
        className="fixed top-4 left-4 z-50 md:hidden w-11 h-11 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-pink-400 hover:text-pink-300 transition-all"
        aria-label="Toggle planet navigation"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-24 z-20 flex-col items-center py-4 gap-4">
        {planets.map((p) => {
          const isActive = selectedPlanet === p;

          return (
            <button
              key={p}
              onClick={() => onSelect(p)}
              className={`rounded-md px-2 py-1 text-xs transition ${
                isActive
                  ? "bg-pink-500/25 text-white ring-1 ring-pink-400/60"
                  : "text-pink-400 hover:text-pink-300"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 z-[55] bg-transparent backdrop-blur-xl border-r border-white/10 pt-5 px-6 transition-transform duration-300 md:hidden ${
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
      </div>

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