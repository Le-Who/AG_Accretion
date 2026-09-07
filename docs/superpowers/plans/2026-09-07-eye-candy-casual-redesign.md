# Star Slime Sanctuary: Eye-Candy Casual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the game from a sterile sci-fi terminal into a juicy, polished, eye-candy casual title (*Star Slime Sanctuary*) with 3D-styled glossy jelly slimes, procedural squish-and-stretch physics, Queen Slime evolution, and a charming pastel UI.

**Architecture:** Maintain the deterministic Matter.js circular rigid-body simulation for buttery 60 FPS performance, while layering a dynamic sprite & procedural deformation engine on HTML5 Canvas (squish-spring oscillator, velocity stretch, idle breathing, and facial reactions). Assets generated on `#FF00FF` are processed into transparent PNGs with a chroma-key pipeline, backed by high-polish procedural fallbacks.

**Tech Stack:** TypeScript, Matter.js, HTML5 Canvas 2D, Vite, Vitest, Web Audio API, Google Fonts (Fredoka & Quicksand).

**Spec:** [`docs/superpowers/specs/2026-09-07-eye-candy-casual-redesign.md`](file:///e:/Projects/AG_Accretion/docs/superpowers/specs/2026-09-07-eye-candy-casual-redesign.md)

## Global Constraints
- Target 60 FPS on standard desktop and mobile viewports with 35+ active slimes.
- Keep all unit tests passing (`npm test`).
- Keep clean production build without TypeScript errors (`npm run build`).
- Preserve core radial accretion mechanics: 360° orbital launch, central gravity, Sun/Moon polarities, Queen Slime Tier 1 base growing upon absorbing matching-tier slimes.
- Individual assets generated on `#FF00FF` background, converted to transparent PNGs.

---

### Task 1: Slime Character Hierarchy & Core Configuration

**Files:**
- Modify: `src/entities/coreTiers.ts`
- Modify: `src/config.ts`
- Test: `test/logic.test.ts`

**Interfaces:**
- Produces: Updated `CORE_TIERS` with 11 slime tier definitions: `name`, `displayName`, `radius`, `mass`, `colorAlpha` (Sun), `colorBeta` (Moon), `baseFreq`, `scoreValue`.

- [ ] **Step 1: Write test for Slime Tier Definitions in `test/logic.test.ts`**

Update `test/logic.test.ts` to assert that all 11 tiers have casual slime display names (`Cherry Berry`, `Sunny Tangerine`, `Star Lemon`, etc.) and increasing radii.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/logic.test.ts`

- [ ] **Step 3: Update `src/entities/coreTiers.ts` and `src/config.ts`**

Define the 11 Star Slime tiers with pastel jelly colors:
- Tier 1: Cherry Berry (r=18, `#ff3b77` / `#ff70a6`)
- Tier 2: Sunny Tangerine (r=24, `#ff8800` / `#ffaa33`)
- Tier 3: Star Lemon (r=32, `#ffd000` / `#ffe066`)
- Tier 4: Minty Leaf (r=40, `#10b981` / `#34d399`)
- Tier 5: Aqua Bubble (r=48, `#06b6d4` / `#38bdf8`)
- Tier 6: Sweet Lavender (r=58, `#8b5cf6` / `#a78bfa`)
- Tier 7: Bubblegum Berry (r=68, `#ec4899` / `#f472b6`)
- Tier 8: Royal Sapphire (r=80, `#2563eb` / `#60a5fa`)
- Tier 9: Golden Honey (r=94, `#f59e0b` / `#fbbf24`)
- Tier 10: Astral Galaxy (r=112, `#7c3aed` / `#c084fc`)
- Tier 11: Star Titan (r=136, `#f43f5e` / `#fb7185`)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/logic.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/entities/coreTiers.ts src/config.ts test/logic.test.ts
git commit -m "feat: define 11 Star Slime character tiers with pastel jelly palettes"
```

---

### Task 2: Asset Pipeline & High-Fidelity Procedural Slime Renderer

**Files:**
- Create: `scripts/chromaKeyExtractor.cjs`
- Create: `src/render/proceduralSlimeRenderer.ts`
- Create: `src/render/assetManager.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `AssetManager` to load sprite textures, and `ProceduralSlimeRenderer.renderSlime()` to render 3D-styled glossy jelly spheres with specular highlights, sub-surface glow, and expressive cute animated faces.

- [ ] **Step 1: Create `scripts/chromaKeyExtractor.cjs`**

Script that takes images on `#FF00FF` background, detects the magenta pixels with smooth color distance thresholding, writes alpha=0, and saves transparent PNGs.

- [ ] **Step 2: Generate key character assets using `generate_image`**

Generate 3D cute slimes on `#FF00FF` (Queen Slime, Cherry Slime, Tangerine Slime, Lemon Slime) and process them through the chroma-key extractor into `public/assets/slimes/`.

- [ ] **Step 3: Create `src/render/proceduralSlimeRenderer.ts`**

Implement full 2D Canvas rendering of glossy 3D-shaded jelly spheres:
- Radial gradient with 3D spherical light offset (top-left keylight).
- Soft ambient occlusion rim shadow at bottom right.
- Dual specular gloss spots (large soft white oval + crisp bright dot).
- Big shiny anime-style black eyes with dual white reflections and subtle blink animation.
- Cute pink blush ovals.
- Sun / Moon phase sparkles and accents.
- Golden royal crown with gems for the Queen Slime.

- [ ] **Step 4: Build and test asset loading**

Create `src/render/assetManager.ts` to asynchronously load sprites with graceful fallback to `ProceduralSlimeRenderer`.

- [ ] **Step 5: Commit**

```bash
git add scripts/ src/render/proceduralSlimeRenderer.ts src/render/assetManager.ts
git commit -m "feat: add chroma-key asset pipeline and procedural 3D slime renderer"
```

---

### Task 3: Squish & Stretch Physics-Render Animation System

**Files:**
- Create: `src/render/squishSystem.ts`
- Modify: `src/physics/simulation.ts`
- Modify: `src/types.ts`
- Test: `test/logic.test.ts`

**Interfaces:**
- Produces: `SquishSystem` tracking per-entity squish springs:
  - `triggerCollisionSquish(bodyId, normalX, normalY, intensity)`
  - `getTransform(bodyId, vx, vy, dtMs)` -> `{ scaleX, scaleY, angle, mouthOpen, blinkProgress }`

- [ ] **Step 1: Write test for SquishSystem in `test/logic.test.ts`**

Verify that an impulse squishes the entity ($< 1.0$), rebounds ($> 1.0$), and damps back to $1.0$ over time.

- [ ] **Step 2: Create `src/render/squishSystem.ts`**

Implement the damped harmonic oscillator:
- Natural frequency $\omega = 18\text{ rad/s}$, damping ratio $\zeta = 0.35$.
- Velocity stretch along motion direction ($1 + \min(0.25, v \cdot 0.02)$).
- Gentle breathing oscillation ($1 \pm 0.03 \sin(\text{time} \cdot 3 + \text{offset})$).
- Blinking timer per slime.
- Queen Slime state: open mouth when a matching-tier slime is within $100\text{px}$.

- [ ] **Step 3: Wire collision impact into simulation and squish system**

Update `simulation.ts` to pass impact normals and intensity to the squish system callback.

- [ ] **Step 4: Run tests**

Run: `npx vitest run test/logic.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/render/squishSystem.ts src/physics/simulation.ts src/types.ts test/logic.test.ts
git commit -m "feat: implement squish-and-stretch physics animation system"
```

---

### Task 4: Juicy Casual Chamber & Particle Renderer

**Files:**
- Modify: `src/render/renderer.ts`
- Modify: `src/render/particleSystem.ts`

**Interfaces:**
- Consumes: `SquishSystem`, `ProceduralSlimeRenderer`, `GameState`.
- Produces: Fully overhauled visual presentation: starry night sky, floral/starlight perimeter, squishy slimes, Queen Slime with golden crown, confetti celebrations.

- [ ] **Step 1: Update background and chamber perimeter**

Replace the technical grid with:
- Warm deep indigo-violet cosmic sky (`#0d0c22` to `#1b1235`) with soft purple/cyan nebula dust.
- Twinkling star field.
- Pastel starlight containment perimeter with soft glowing dots.
- Rainbow dotted aiming reticle.

- [ ] **Step 2: Integrate Slime & Queen Slime rendering with SquishSystem**

Render all active slimes and the central Queen Slime using `SquishSystem.getTransform()`:
- Apply translation, rotation to collision normal, scale(sx, sy).
- Draw the jelly slime via sprite or procedural 3D renderer.
- Draw Sun / Moon aura and sparkling stars.
- For matching-tier slimes, draw a cute pulsing golden heart/star indicator.

- [ ] **Step 3: Add casual celebratory particle effects**

In `particleSystem.ts`:
- Rainbow confetti rectangles fluttering and rotating on resonant merge.
- Pink hearts floating up on Queen Slime level up.
- Starburst spark particles.
- Bouncy floating score popups with colorful pastel text.

- [ ] **Step 4: Commit**

```bash
git add src/render/renderer.ts src/render/particleSystem.ts
git commit -m "feat: implement cozy starry chamber, Queen Slime visuals, and celebratory particles"
```

---

### Task 5: Casual UI, Playful Typography & Sweet Audio Engine

**Files:**
- Modify: `index.html`
- Modify: `src/style.css`
- Modify: `src/audio/soundEngine.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces: Cheerful pastel UI cards with Google Fonts *Fredoka* and *Quicksand*, cute crown badge for Queen Level, and joyful melodic audio chimes.

- [ ] **Step 1: Update `index.html` & `style.css` with casual design**

- Load Google Fonts: `Fredoka:wght@400;600;700` and `Quicksand:wght@500;700`.
- Retitle game: **STAR SLIME SANCTUARY** (subtitle: *Cosmic Jelly Accretion*).
- Replace dark terminal cards with frosted pastel glass cards (`rgba(255, 255, 255, 0.08)`), rounded borders (`border-radius: 20px`), bubbly gradient buttons (`linear-gradient(135deg, #ff70a6, #ff9a8b)`), and candy progress bars.
- Queen Level badge with golden crown icon: `👑 QUEEN LV.1 (Cherry Princess)`.

- [ ] **Step 2: Update `src/audio/soundEngine.ts` to sweet chime soundscape**

- Collision: cute soft "pop" and wood/marimba tone.
- Merge: rising major pentatonic arpeggio (C5-E5-G5-B5).
- Queen Level Up: triumphant sparkling chime fanfare.
- Flux Pulse: bubbly cosmic glissando.

- [ ] **Step 3: Update `main.ts` event handlers & telemetry labels**

Update HUD text updates to display slime names and friendly casual messages.

- [ ] **Step 4: Commit**

```bash
git add index.html src/style.css src/audio/soundEngine.ts src/main.ts
git commit -m "feat: update casual UI with Fredoka font, candy cards, and sweet audio chimes"
```

---

### Task 6: Quality Gates, Automated Tests & Browser QA

**Files:**
- Modify: `test/logic.test.ts`
- Modify: `src/debug/debugHarness.ts`

- [ ] **Step 1: Run full unit test suite**

Run: `npm test`
Expected: 11+ tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: 0 errors, clean build.

- [ ] **Step 3: Automated Browser QA with `browser_subagent`**

- Launch Vite dev server.
- Verify page loads with joyful casual UI, 0 console errors.
- Test launching slimes, verify squish-and-stretch on collisions.
- Verify Queen Slime absorption and level-up with hearts and confetti.
- Verify mobile viewport (390x844) responsive scaling.
- Record video and capture screenshots.

- [ ] **Step 4: Commit final verification**

```bash
git add test/logic.test.ts src/debug/debugHarness.ts
git commit -m "test: verify Star Slime Sanctuary eye-candy casual overhaul"
```
