# Eye-Candy Casual Redesign Specification: Star Slime Sanctuary

## 1. Overview & Vision
Transform the existing strict sci-fi "reactor telemetry" drop-and-merge game into a vibrant, delicious, high-polish casual hit: **Star Slime Sanctuary**. 

The core physical and strategic mechanics remain preserved and enhanced:
- A 360° radial launch perimeter.
- Central Core starting at Tier 1 that levels up upon absorbing matching-tier entities.
- Central gravity and pairwise magnetic dipoles (Sun / Moon).
- Outer containment threshold warning and breach.
- Instant, satisfying restart loop.

The visual and auditory experience is elevated to top-tier casual standards (comparable to *Slime Rancher*, *Puyo Puyo*, *Candy Crush*, and *Peggle*): rich glossy materials, bouncy squish-and-stretch jelly animations, adorable facial reactions, celebratory particle confetti, and warm melodic audio chimes.

---

## 2. Character Roster & Visual Progression

### 2.1 The Central Core: Slime Queen (Королева Слаймов)
- **Base Form (Tier 1)**: Tiny shimmering pink jelly drop with an ornate miniature golden crown and big expressive anime-style eyes.
- **Level-Up Evolution**:
  - T1: Princess Drop (r=18)
  - T2: Pearl Queen (r=24)
  - T3: Star Monarch (r=32)
  - T4: Emerald Duchess (r=40)
  - T5: Crystal Empress (r=48)
  - T6: Celestial Sovereign (r=58)
  - T7: Royal Bubblegem (r=68)
  - T8: Sapphire Goddess (r=80)
  - T9: Solar Majesty (r=94)
  - T10: Cosmic Aurora Queen (r=112)
  - T11: Primordial Galaxy Mother (r=136)
- **Dynamic Emotional States**:
  - `IDLE`: Gentle rhythmic breathing, soft eye blinks, curious gaze tracking launched slimes.
  - `ANTICIPATING`: When a matching-tier slime enters a close radial distance, the Queen's eyes sparkle with excitement, mouth opens wide with a cute "nom-nom" expression.
  - `FEEDING / LEVEL UP`: Expands in a burst of hearts, rainbow stars, and musical chimes, pushing surrounding slimes outward with an elastic jelly shockwave.

### 2.2 Accretion Slime Hierarchy (Tiers 1–11)
Each tier has distinct silhouette features, color story, and personality:
1. **Tier 1 (Cherry Berry, r=18px)**: Glossy raspberry drop, round eyes, tiny cute blush.
2. **Tier 2 (Sunny Tangerine, r=24px)**: Radiant citrus orange, bouncy little sprout tuft.
3. **Tier 3 (Star Lemon, r=32px)**: Luminous pastel yellow, cheerful star-shaped highlights.
4. **Tier 4 (Minty Leaf, r=40px)**: Fresh jade mint jelly, translucent dew drop leaf on head.
5. **Tier 5 (Aqua Bubble, r=48px)**: Crystal azure water drop with floating micro-bubbles inside.
6. **Tier 6 (Sweet Lavender, r=58px)**: Dreamy violet slime with cute sleepy eyes and soft cat ears.
7. **Tier 7 (Bubblegum Berry, r=68px)**: Chubby cotton-candy pink slime with bouncy rosy cheeks.
8. **Tier 8 (Royal Sapphire, r=80px)**: Deep ocean ultramarine with sparkling jewel facets.
9. **Tier 9 (Golden Honey, r=94px)**: Luscious amber-peach slime with honey-drop gloss.
10. **Tier 10 (Astral Galaxy, r=112px)**: Deep violet-magenta cosmic jelly swirling with star clusters.
11. **Tier 11 (Star Titan, r=136px)**: Grand prismatic opalescent celestial slime with planetary rings.

### 2.3 Polarity Reimagined: Sun Sparkle & Moon Frost
- **Sun Slimes (Polarity +1)**: Warm golden glow, amber sparkling particles, energetic bright expressions.
- **Moon Slimes (Polarity -1)**: Cool starlight cyan/lavender glow, twinkling diamond stars, sweet serene expressions.
- **Resonant Fusion (Sun + Moon)**: Rainbow confetti burst, doubled score bonus, high-priority Flux charge, and harmonic chime chord.

---

## 3. Asset Generation & Chroma-Key Processing Pipeline

### 3.1 Isolated Asset Generation
- Using `generate_image`, create individual high-resolution 3D-styled rendered icons for key slime tiers and the Queen Slime.
- Prompt structure:
  - Subject: Single isolated 3D cartoon slime creature, glossy translucent jelly texture, sub-surface scattering, cute Pixar/Nintendo style, round glossy eyes.
  - Background: Flat uniform solid magenta `#FF00FF` background with zero shadows on the floor.
  - Aspect ratio: `1:1`.

### 3.2 Automated Chroma-Key Extraction Tool (`scripts/extract-sprites.js`)
- Node.js script using canvas or sharp/pure pixel analysis to process generated images:
  - Reads image files from the artifacts directory or generated assets.
  - Scans pixels: if pixel color matches `#FF00FF` (within Euclidean tolerance with soft edge feathering), sets alpha to 0.
  - Trims to bounding box and writes optimized transparent PNGs into `public/assets/slimes/`.
  - Built-in procedural high-fidelity fallback generator on Canvas 2D ensuring instant runtime availability of all 11 tiers with 3D spherical shading, specular reflections, sub-surface glow, and cute animated faces.

---

## 4. Squish & Stretch Physics & Animation Engine

To achieve buttery 60 FPS performance while delivering the tangible feel of squishy jelly:

1. **Matter.js Core Rigidity**:
   - Physics simulation uses optimized circular rigid bodies (`isStatic` for Queen, dynamic circles for outer slimes).
   - Zero multi-body soft-body lag or clipping issues.

2. **Procedural Render Deformation**:
   - **Velocity Stretch**: During inward launch and flight, the sprite is scaled along its velocity vector:
     $$\text{scale}_X = 1 + \min(0.25, v \cdot 0.02), \quad \text{scale}_Y = \frac{1}{\text{scale}_X}$$
   - **Collision Spring Oscillator (Squish-Spring)**:
     - On impact, an elastic spring accumulator triggers:
       $$\delta(t) = A \cdot e^{-\zeta \omega t} \cdot \cos(\omega t)$$
     - Slime squishes by up to 25% along the collision normal and widens perpendicular to it, vibrating with a satisfying "boing" decay over 250ms.
   - **Idle Breathing & Jiggle**:
     - Slight sine wave breathing ($1 \pm 0.03$) with random phase offsets per slime.
   - **Facial Animation**:
     - Blinking cycle every 3–6 seconds.
     - Eyes follow the center or collision impact points.

---

## 5. Casual UI / HUD & Environmental Styling

### 5.1 Color Palette & Background
- **Chamber Background**: Cozy deep indigo-violet night sky (`#0e0f2b` to `#1e1338`) filled with soft pastel nebula dust and gentle twinkling star particles.
- **Containment Ring**: Replaced by a gentle glowing pastel floral or starlight perimeter with soft warning pulse when slimes drift near the edge.

### 5.2 Casual HUD Cards & Typography
- Font: Google Fonts **Quicksand** / **Nunito** / **Fredoka** (rounded, warm, playful, highly legible).
- Cards: Frosted glassmorphic pastel cards with white borders, soft drop shadows (`box-shadow: 0 8px 24px rgba(0,0,0,0.2)`), candy gradient badges.
- Launch Aiming Reticle: Sweet dotted rainbow arc showing projected trajectory.
- Slime Queen Status Bar: Cute heart/crown badge showing the Queen's current evolution tier with progress star indicators.

---

## 6. Audio Engine Evolution: Sweet Melodies & Juicy Sound Effects

- **Web Audio API Procedural Synthesizer**:
  - Re-tuned to a bright, joyful Pentatonic / Lydian scale.
  - Collision sounds: High-frequency soft "plop" and marimba clinks with varying pitches.
  - Merge sounds: Ascending melodic arpeggio with bright bell resonance.
  - Queen Level-Up: Triumphant brass-bell fanfare with glittering harp glissando.
  - Flux Pulse: Dreamy cosmic whoosh followed by all slimes sparkling with joy.

---

## 7. Verification & Acceptance Criteria
1. **Visual Quality**: Looks like a world-class mobile casual game (lush colors, juicy textures, zero ugly wireframes or sterile grids).
2. **Performance**: Rock-solid 60 FPS on desktop and mobile viewports with 30+ active slimes.
3. **Gameplay Mechanics Intact**: Radial launching, central gravity, Sun/Moon dipoles, Queen Slime leveling up on matching size, containment breach warning.
4. **Automated Testing**: 100% pass on all existing and new unit tests.
5. **Zero Console Errors**: Clean production build with Vite.
