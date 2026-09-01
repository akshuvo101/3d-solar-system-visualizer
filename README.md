# Solar System with Graphics

An interactive 3D solar system simulation built with Next.js, React, TypeScript, and Three.js. This project combines real-time orbital animation, custom shader effects, planet data panels, camera tracking, zoom controls, and ambient audio for an immersive astronomy experience.

## 🚀 Key Features

- 3D solar system simulation rendered with `@react-three/fiber` and `three`
- Custom planet plasma shader effects for vivid visuals
- Interactive planet selection via sidebar and click-to-view detail cards
- Smooth camera follow, orbit controls, and zoom buttons
- Adjustable orbital animation speed with a slider
- Background audio toggle for immersive ambience
- Realistic planet metadata including radius, mass, gravity, temperature, and moon count

## 🧭 Project Structure

- `app/page.tsx` – main entry point that renders the simulation page
- `app/simulation/page.tsx` – client-side simulation screen with controls and UI
- `components/solar/` – 3D scene components:
  - `SolarSystem3D.tsx`
  - `Planet.tsx`
  - `Sun.tsx`
  - `StarField.tsx`
  - `OrbitPath.tsx`
  - `CameraController.tsx`
- `components/layout/Sidebar.tsx` – planet selection sidebar
- `components/common/PlanetInfo.tsx` – detail panel for selected planets
- `components/common/AudioPlayer.tsx` – audio playback toggle
- `components/ui/Button.tsx` – zoom control buttons
- `lib/planetData.ts` – planet configuration, textures, and scientific data
- `shaders/` – custom shader material definitions for planet and sun effects
- `public/textures/` – planet textures used in the 3D scene

## 💻 Technology Stack

- Next.js 16
- React 19
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Tailwind CSS (via PostCSS)

## 📦 Installation

Install dependencies and run the app locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## ▶️ How to Use

- Use the left sidebar to choose a planet
- Click any planet in the scene to open the info card
- Drag with the mouse to orbit the camera around the system
- Scroll to zoom the camera in and out
- Use the bottom slider to change animation speed
- Toggle background music with the button in the top-right corner
- Use the zoom buttons on screen for quick close/far views

## 🔧 Scripts

- `npm run dev` – start development server
- `npm run build` – build production bundle
- `npm run start` – start Next.js production server
- `npm run lint` – run ESLint

## 🌌 Notes

This project is designed as a demonstration of integrating Three.js into a modern Next.js app with interactive UI, custom shaders, and planet detail metadata. The scene uses a combination of orbiting planet groups, shader-driven materials, and responsive camera movement for a polished presentation.
