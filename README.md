# 🌌 3D Solar System Simulation

An interactive and immersive **3D Solar System Simulation** built with **Next.js, React, TypeScript, Three.js, and React Three Fiber**.

Explore the Solar System through real-time planetary motion, interactive camera controls, custom shader effects, detailed planet information, deep-space environments, asteroid and Kuiper belts, and ambient audio.

## 🚀 Live Demo

🌐 **[Launch the 3D Solar System Simulation](https://3-d-solar-system-simulation-gilt.vercel.app/)**

💻 **[View Source Code on GitHub](https://github.com/akshuvo101/3D-Solar-System-Simulation)**

## 🖼️ Preview

![3D Solar System Simulation](./public/images/3d-solar.png)

---

## ✨ Features

### 🌍 Interactive 3D Solar System

* Explore the Sun and all eight planets in a real-time 3D environment.
* Freely navigate around the Solar System.
* Select planets from the sidebar or directly from the 3D scene.
* View detailed information about individual planets.

### 🪐 Planetary Motion

* Real-time orbital animation.
* Simulated planetary axial rotation.
* Counterclockwise orbital movement.
* Smooth continuous animation.
* Planet positions are preserved across page refreshes using browser storage.

### ⏱️ Simulation Modes

Choose how quickly the Solar System evolves through different time scales:

* **1 Day**
* **1 Month**
* **1 Year**

The simulation also includes adjustable playback speeds:

* `0.5×`
* `1×`
* `2×`
* `5×`
* `10×`

### 🎯 Planet Selection

Select:

* ☀️ Sun
* ☿ Mercury
* ♀ Venus
* 🌍 Earth
* ♂ Mars
* ♃ Jupiter
* ♄ Saturn
* ♅ Uranus
* ♆ Neptune

Clicking a planet opens its corresponding information panel.

### 📊 Planet Information

The application provides scientific information such as:

* Radius
* Mass
* Gravity
* Temperature
* Orbital period
* Rotation period
* Moon count
* Other astronomical data

### 🎥 Camera & Navigation

* Interactive `OrbitControls`
* Smooth camera tracking
* Free camera rotation
* Mouse-wheel zoom
* On-screen zoom controls
* Selected-planet camera focus
* Cinematic camera movement

### 🌌 Deep Space Environment

The scene includes several environmental elements to create a more immersive astronomical experience:

* Deep-space background
* Dynamic star field
* Asteroid Belt
* Kuiper Belt
* Planetary orbit paths
* Featured asteroid objects
* Space lighting and atmospheric effects

### 🎨 Custom Shader Effects

Custom shader-based materials are used to enhance the visual appearance of celestial objects.

The project includes shader-driven effects for creating more vivid and dynamic planetary visuals.

### 🎵 Ambient Audio

* Background space ambience
* Audio toggle
* Planet-related audio support
* Immersive sound experience while exploring the simulation

### 📱 Responsive UI

The interface is designed with a modern, futuristic astronomy-inspired visual style and includes:

* Planet sidebar
* Information panels
* Simulation controls
* Speed controls
* Zoom controls
* Audio controls
* Responsive layout

---

## 🛠️ Technology Stack

### Frontend

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS**

### 3D & Graphics

* **Three.js**
* **React Three Fiber**
* **@react-three/drei**
* Custom GLSL shaders

### UI & Development

* **Lucide React**
* **ESLint**

---

## 🧭 Controls

| Action                    | Control                |
| ------------------------- | ---------------------- |
| Select planet             | Sidebar                |
| Select planet directly    | Click a planet         |
| Rotate camera             | Mouse drag             |
| Zoom                      | Mouse wheel            |
| Quick zoom                | On-screen zoom buttons |
| Change simulation time    | Day / Month / Year     |
| Adjust simulation speed   | Speed controls         |
| Toggle background audio   | Music button           |
| Toggle planet description | Description button     |

---

## 📁 Project Structure

```text
3D-Solar-System-Simulation/
│
├── app/
│   ├── page.tsx
│   └── simulation/
│       └── page.tsx
│
├── components/
│   ├── common/
│   │   ├── AudioPlayer.tsx
│   │   └── PlanetInfo.tsx
│   │
│   ├── layout/
│   │   └── Sidebar.tsx
│   │
│   ├── solar/
│   │   ├── SolarSystem3D.tsx
│   │   ├── Planet.tsx
│   │   ├── Sun.tsx
│   │   ├── Moon.tsx
│   │   ├── StarField.tsx
│   │   ├── DeepSpace.tsx
│   │   ├── AsteroidBelt.tsx
│   │   ├── KuiperBelt.tsx
│   │   ├── OrbitPath.tsx
│   │   ├── CameraController.tsx
│   │   ├── CinematicController.tsx
│   │   └── ZoomControls.tsx
│   │
│   └── ui/
│       └── Button.tsx
│
├── hooks/
│   └── ...
│
├── lib/
│   ├── planetData.ts
│   ├── constants.ts
│   └── simulationTime.ts
│
├── shaders/
│   └── ...
│
├── types/
│   └── ...
│
├── public/
│   ├── images/
│   │   └── 3d-solar.png
│   └── textures/
│       └── ...
│
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/akshuvo101/3D-Solar-System-Simulation.git
```

Navigate to the project directory:

```bash
cd 3D-Solar-System-Simulation
```

Install dependencies:

```bash
npm install
```

---

## ▶️ Run Locally

Start the development server:

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## 🔧 Available Scripts

### Development

```bash
npm run dev
```

Starts the Next.js development server.

### Production Build

```bash
npm run build
```

Creates an optimized production build.

### Production Server

```bash
npm run start
```

Starts the application in production mode.

### Lint

```bash
npm run lint
```

Runs ESLint to check the codebase.

---

## 🌠 About the Project

This project was created to explore the combination of **modern web development and real-time 3D graphics**.

It demonstrates how a Next.js application can be combined with Three.js and React Three Fiber to build an interactive astronomical environment directly in the browser.

The simulation focuses on:

* Real-time 3D rendering
* Planetary animation
* Orbital mechanics visualization
* Interactive camera systems
* Custom shader effects
* Procedural space environments
* Scientific data presentation
* Responsive UI design
* Immersive audio

The goal is to provide an engaging way to explore the Solar System while demonstrating modern frontend and 3D development techniques.

---

## 🧠 What I Learned

Through this project, I explored and implemented:

* React Three Fiber scene architecture
* Three.js object and camera management
* Real-time animation with `useFrame`
* Planet orbital calculations
* Planetary axial rotation
* Interactive object selection
* Camera tracking and controls
* Custom shader materials
* Instanced 3D objects
* Procedural star and asteroid environments
* Responsive UI integration with a 3D canvas
* Browser-based state persistence
* Audio integration in interactive web applications

---

## 🔮 Future Improvements

Possible future enhancements include:

* 🌙 More detailed Moon systems
* 🛰️ Satellite and spacecraft simulation
* 🔭 Telescope exploration mode
* 🚀 Spacecraft navigation
* 📍 Planet-to-planet navigation
* 🌌 More astronomical objects
* 📈 Advanced scientific data visualization
* 🪐 More detailed planetary atmospheres
* 🎮 Additional exploration and interaction features

---

## 👨‍💻 Developer

**AK Shuvo**

Full-Stack Web Developer

**Specializing in:**
Next.js • React • TypeScript • Three.js • Supabase

---

## ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ **Star** on GitHub.

---

## 📄 License

This project is licensed under the **MIT License**.
