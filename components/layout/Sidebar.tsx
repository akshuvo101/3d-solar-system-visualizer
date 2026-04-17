"use client";

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
};

export default function Sidebar({ onSelect }: SidebarProps) {
  return (
    <div className="fixed left-0 top-0 h-full w-24 bg-black/60 backdrop-blur z-20 flex flex-col items-center py-4 gap-4">
      {planets.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className="text-xs text-pink-400 hover:text-pink-300 transition"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
