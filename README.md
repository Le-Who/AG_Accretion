# 💖 STAR SLIME SANCTUARY
### *Cosmic Jelly Accretion & Radial Fusion Engine*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Matter.js](https://img.shields.io/badge/Matter.js-0.20-red.svg?style=flat-square)](https://brm.io/matter-js/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-brightgreen.svg?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

A juicy, high-polish casual radial drop-and-merge game with **2.5D mathematical jelly physics**, **360° orbital launching**, **pairwise magnetic dipoles**, and an **11-tier Slime Queen evolution hierarchy**.

---

## 📖 Table of Contents

- [Overview & Lore](#-overview--lore)
- [Core Gameplay Mechanics](#-core-gameplay-mechanics)
  - [1. 360° Radial Perimeter Launcher](#1-360-radial-perimeter-launcher)
  - [2. The Slime Queen & Evolution Loop](#2-the-slime-queen--evolution-loop)
  - [3. Sun & Moon Polarity Magnetism](#3-sun--moon-polarity-magnetism)
  - [4. Rainbow Super Burst (Flux Pulse)](#4-rainbow-super-burst-flux-pulse)
  - [5. Sanctuary Harmony & Perimeter Hazard](#5-sanctuary-harmony--perimeter-hazard)
- [Complete Slime Hierarchy (Tiers 1–11)](#-complete-slime-hierarchy-tiers-111)
- [Mathematical & Engineering Architecture](#-mathematical--engineering-architecture)
  - [2.5D Jelly Physics Engine (`JellyMesh`)](#25d-jelly-physics-engine-jellymesh)
  - [Squish-and-Stretch Animation Engine (`SquishSystem`)](#squish-and-stretch-animation-engine-squishsystem)
  - [Procedural 3D Jelly Renderer & Facial Rig](#procedural-3d-jelly-renderer--facial-rig)
  - [Procedural Harmonic Web Audio Synthesizer](#procedural-harmonic-web-audio-synthesizer)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Controls & Shortcuts](#-controls--shortcuts)
- [Getting Started & Development](#-getting-started--development)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Running Unit Tests](#running-unit-tests)
  - [Production Build](#production-build)
- [License](#-license)

---

## 🌸 Overview & Lore

In the heart of the cosmic night sky resides the **Slime Queen**, beginning her journey as a tiny **Princess Drop (Tier 1)** crowned with miniature golden regalia. 

Players pilot a perimeter launch orbit circling 360° around the celestial sanctuary. By aiming and launching bouncy jelly slimes inward under the pull of central gravity:
1. Matching slimes merge into higher tiers.
2. When a matching-tier slime touches the Slime Queen, she absorbs it, joyfully leveling up into a grander form (from Level 1 all the way to **Tier 11: Primordial Galaxy Mother**).
3. Players balance pairwise magnetic forces, combo windows, and starlight boundaries to build massive score streaks and preserve Sanctuary Harmony.

---

## 🎮 Core Gameplay Mechanics

```
                             [ Launch Orbit (r = 292px) ]
                         . - ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ - .
                     . '                               ' .
                  .             [ Containment Ring ]       .
                .            . - ~ ~ ~ ~ ~ ~ ~ - .           .
              .            .                       .           .
             .           .     ✨ Sun      🌙 Moon   .          .
            .           .        Slime       Slime    .          .
           .           .            \       /          .          .
          .           .              👑 QUEEN           .          .
          .           .              (Center)           .          .
           .           .            /       \          .          .
            .           .      🌙 Moon     ✨ Sun     .          .
             .           .                       .           .
              .            . - ~ ~ ~ ~ ~ ~ ~ - .            .
                .                 (r = 255px)              .
                  .                                       .
                     . '                               ' .
                         ' - ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ - '
```

### 1. 360° Radial Perimeter Launcher
- Unlike traditional vertical drop games (such as *Suika Game*), slimes can be deployed from any angle along a circular orbit ($R = 292\text{px}$).
- Inward central gravity draws all dynamic bodies toward the center ($g_c = 0.0018$) with gentle orbital damping ($0.985$) to create an intuitive, satisfying accretion disk.

### 2. The Slime Queen & Evolution Loop
- The central nucleus is the **Slime Queen**, an anchored static body with dynamic emotional states (`IDLE`, `ANTICIPATING`, `FEEDING / LEVEL UP`).
- **Matching-Tier Absorption**: Dynamic slimes of equal tier merge with each other into Tier $N+1$. However, when a slime matching the Queen's **current tier** makes contact with her:
  - The Queen consumes the slime.
  - She levels up ($N \rightarrow N+1$), expanding her radius and mass.
  - An elastic radial jelly shockwave gently pushes surrounding slimes outward.
  - Floating hearts, confetti, and celebratory chimes burst across the chamber.

### 3. Sun & Moon Polarity Magnetism
Every incoming slime is attuned to either **Sun Sparkle (+1)** or **Moon Frost (-1)**:
- **Pairwise Dipole Forces**: Slimes of identical polarity gently repel each other, while opposite polarities attract across space via an inverse-distance magnetic field.
- **Harmonic Fusion (Sun + Moon)**:
  - Occurs when two matching-tier slimes with **opposite polarities** merge.
  - Grants a **2.5× score bonus**, an inward gravitational implosion pulse that compacts the garden, and generates high **Flux Charge** (+28%).
- **Sweet Fusion (Same Polarity)**:
  - Standard merge between identical polarities (+10% Flux Charge).

### 4. Rainbow Super Burst (Flux Pulse)
- Merging slimes charges the **Super Burst** capacitor.
- At 100% charge, pressing <kbd>Space</kbd> or tapping the **BURST** button inverts the polarities of every dynamic slime on screen.
- Repulsions flip to attractions, triggering thrilling chain-reaction cascades toward the Queen.

### 5. Sanctuary Harmony & Perimeter Hazard
- A starlight floral ring marks the **Containment Boundary** ($R = 255\text{px}$).
- If crowded slimes cross outside this threshold, **Sanctuary Harmony** drains with a 3-second grace countdown.
- Merging slimes relieves pressure and restores harmony at $1.8\times$ recovery speed. If harmony hits 0%, a **Sanctuary Overflow** game-over event occurs.

---

## 👑 Complete Slime Hierarchy (Tiers 1–11)

| Tier | Name | Queen Title | Radius | Mass | Sun Palette (Alpha) | Moon Palette (Beta) | Base Score | Musical Pitch |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **Cherry Berry** | Princess Cherry | 18px | 1.0 | `#ff3366` | `#ff6699` | 20 | C4 (261.6 Hz) |
| **2** | **Sunny Tangerine** | Tangerine Queen | 24px | 1.7 | `#ff8c00` | `#ffa500` | 50 | D4 (293.7 Hz) |
| **3** | **Star Lemon** | Lemon Monarch | 32px | 2.8 | `#ffcc00` | `#ffe066` | 120 | E4 (329.6 Hz) |
| **4** | **Minty Leaf** | Emerald Duchess | 40px | 4.5 | `#10b981` | `#34d399` | 260 | G4 (392.0 Hz) |
| **5** | **Aqua Bubble** | Crystal Empress | 48px | 7.0 | `#06b6d4` | `#38bdf8` | 550 | A4 (440.0 Hz) |
| **6** | **Sweet Lavender** | Lavender Sovereign | 58px | 10.5 | `#8b5cf6` | `#a78bfa` | 1,100 | C5 (523.3 Hz) |
| **7** | **Bubblegum Berry** | Royal Bubblegem | 68px | 15.0 | `#ec4899` | `#f472b6` | 2,200 | D5 (587.3 Hz) |
| **8** | **Royal Sapphire** | Sapphire Goddess | 80px | 21.0 | `#2563eb` | `#60a5fa` | 4,500 | E5 (659.3 Hz) |
| **9** | **Golden Honey** | Solar Majesty | 94px | 30.0 | `#f59e0b` | `#fbbf24` | 9,000 | G5 (784.0 Hz) |
| **10** | **Astral Galaxy** | Cosmic Aurora Queen | 112px | 42.0 | `#7c3aed` | `#c084fc` | 18,000 | A5 (880.0 Hz) |
| **11** | **Star Titan** | Galaxy Mother | 136px | 60.0 | `#f43f5e` | `#fb7185` | 40,000 | C6 (1046.5 Hz) |

---

## 🔬 Mathematical & Engineering Architecture

The architecture decouples the deterministic physics simulation from a continuous procedural 2.5D visual deformation pipeline to maintain a locked **60 FPS** with 35+ dynamic bodies on canvas.

```
┌───────────────────────────────────────────────────────────┐
│                      Game Loop (60 FPS)                   │
└─────────────┬───────────────────────────────┬─────────────┘
              ▼                               ▼
  ┌───────────────────────┐       ┌───────────────────────┐
  │  Matter.js Simulation │       │  Procedural Graphics  │
  ├───────────────────────┤       ├───────────────────────┤
  │ • Sub-stepped physics │       │ • JellyMesh (12-vert) │
  │ • Radial gravity      │       │ • Squish-spring osc.  │
  │ • Dipole magnetism    │──────▶│ • Dynamic keylighting │
  │ • Collision impacts   │       │ • Decoupled face rig  │
  │ • Merge event logic   │       │ • Particle confetti   │
  └───────────────────────┘       └───────────────────────┘
```

### 2.5D Jelly Physics Engine (`JellyMesh`)
Instead of costly multi-body soft-body meshes in Matter.js, each entity owns an analytical 12-vertex radial contour $P_i(\theta_i, r_i)$:
- Vertices are indexed at equal angles $\theta_i = \frac{2\pi i}{12}$.
- Rest state radius: $R_0$.
- **Harmonic Oscillator & Surface Tension**:
  $$a_i = -\omega^2 d_i - 2\zeta\omega v_i + k_{\text{tension}}(d_{i-1} + d_{i+1} - 2d_i)$$
  where natural frequency $\omega = 18.0\text{ rad/s}$, damping ratio $\zeta = 0.30$, and tension coupling $k_{\text{tension}} = 14.0$.
- **Conservation of Jelly Volume**:
  When an impact occurs at contact angle $\theta_{\text{impact}}$ with intensity $I$:
  - Vertices in the contact hemisphere indent:
    $$\Delta_{\text{indent}} = -I \cdot \cos^2(\theta_i - \theta_{\text{impact}}) \quad (\text{for } \cos > 0)$$
  - Transverse perpendicular vertices bulge outward to conserve volume:
    $$\Delta_{\text{bulge}} = 0.52 \cdot I \cdot \sin^2(\theta_i - \theta_{\text{impact}})$$
  - The smoothed perimeter is rendered via continuous cubic Bezier curves (`ctx.bezierCurveTo`).

### Squish-and-Stretch Animation Engine (`SquishSystem`)
- **Velocity Stretch**: During high-speed inward flight, slimes dynamically stretch along their velocity vector:
  $$s_x = 1 + \min(0.25, v \cdot 0.02), \quad s_y = \frac{1}{s_x}$$
- **Idle Breathing**: Soft organic pulsation $1 \pm 0.03 \sin(3t + \phi)$ with randomized phase offsets.

### Procedural 3D Jelly Renderer & Facial Rig
- **Fixed Global Keylight**: Offset at top-left $(-0.35, -0.42)$ creating true 3D spherical depth independent of body rotation.
- **Subsurface Scattering & Ambient Occlusion**: Multi-stop radial gradients layered over soft ambient base shadows.
- **Dual Specular Highlights**: Soft diffused secondary glow combined with a crisp, bright pinpoint highlight.
- **Decoupled Animated Facial Rig**:
  - Anime-style glossy eyes with dual reflections.
  - Secondary spring inertia: eyes lag slightly behind fast accelerations.
  - Pupil tracking: eyes look curiously toward nearby colliders and the central Queen.
  - Anticipation state: the Slime Queen opens her mouth wide in joyful excitement when an absorbable matching-tier slime drifts within $100\text{px}$.

### Procedural Harmonic Web Audio Synthesizer
Built natively on the **Web Audio API** with zero external audio assets:
- Tuned to an ascending **Lydian / Pentatonic scale** across C4 to C6.
- **Collisions**: High-frequency soft "plop" and marimba clinks scaled by impact momentum.
- **Harmonic Merges**: Four-note ascending arpeggio chord with bell resonance.
- **Queen Level-Up**: Sparkling brass-bell fanfare and glissando.
- **Super Burst**: Dreamy cosmic whoosh followed by shimmering harmonic chimes.

---

## 📁 Project Architecture & Directory Structure

```
AG_Accretion/
├── index.html                   # Casual UI layout, HUD cards & modals
├── package.json                 # Project dependencies and npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build configuration
├── src/
│   ├── main.ts                  # Application bootstrap, HUD & event wiring
│   ├── types.ts                 # TypeScript domain types & event interfaces
│   ├── config.ts                # Physical constants, radii, scoring & tuning
│   ├── style.css                # Frosted glass UI, Fredoka/Quicksand fonts
│   ├── audio/
│   │   └── soundEngine.ts       # Web Audio procedural sound synthesizer
│   ├── core/
│   │   └── gameState.ts         # Central state manager & score tracking
│   ├── debug/
│   │   └── debugHarness.ts      # Automated testing scenarios & debug helpers
│   ├── entities/
│   │   └── coreTiers.ts         # 11-tier Star Slime specifications & palettes
│   ├── input/
│   │   └── inputHandler.ts      # 360° mouse, touch & keyboard input tracking
│   ├── physics/
│   │   ├── simulation.ts        # Matter.js rigid body simulation loop
│   │   └── magneticField.ts     # Sun/Moon pairwise magnetic dipole solver
│   └── render/
│       ├── renderer.ts          # HTML5 Canvas viewport & chamber compositor
│       ├── jellyMesh.ts         # 12-vertex volume-preserving harmonic mesh
│       ├── squishSystem.ts      # Spring oscillator & velocity squish manager
│       ├── proceduralSlimeRenderer.ts # 3D glossy jelly & face rendering
│       ├── particleSystem.ts    # Confetti, hearts, stars & floating popups
│       └── assetManager.ts      # Dynamic asset loader & fallback system
├── test/
│   └── logic.test.ts            # Vitest unit test suite (13 passing tests)
└── docs/
    └── superpowers/
        ├── specs/               # High-level architecture specifications
        └── plans/               # Step-by-step implementation plans
```

---

## 🕹️ Controls & Shortcuts

| Action | Control (Mouse / Touch) | Keyboard Shortcut |
|:---|:---|:---:|
| **Aim Launch Angle** | Move mouse / drag finger around orbit | — |
| **Launch Slime** | Left Click / Tap "LAUNCH SLIME" | <kbd>&darr;</kbd> (Down Arrow) |
| **Trigger Super Burst** | Tap "SUPER BURST" button | <kbd>Space</kbd> |
| **Restart Sanctuary** | Click Reset icon / Tap "PLAY AGAIN" | <kbd>R</kbd> |
| **Toggle Audio** | Click Speaker icon | <kbd>M</kbd> |
| **How to Play Guide** | Click Info icon | <kbd>?</kbd> |

---

## 🚀 Getting Started & Development

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/Le-Who/AG_Accretion.git
cd AG_Accretion
npm install
```

### Development Server
Start the local Vite development server with hot module replacement (HMR):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Unit Tests
Execute the Vitest automated test suite:
```bash
npm test
```

### Production Build
Type-check and compile the production bundle:
```bash
npm run build
```
The optimized production output will be generated in `dist/`. You can preview the production bundle locally using:
```bash
npm run preview
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
