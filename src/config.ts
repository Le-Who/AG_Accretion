export const GAME_CONFIG = {
  // Chamber Resolution (Radial Coordinates)
  CHAMBER_WIDTH: 620,
  CHAMBER_HEIGHT: 620,
  CENTER_X: 310,
  CENTER_Y: 310,

  // Geometry & Radii
  CENTRAL_CORE_RADIUS: 30,
  CONTAINMENT_PERIMETER_RADIUS: 250, // Critical boundary threshold
  LAUNCH_ORBIT_RADIUS: 285,          // Perimeter where launcher aims and deploys

  // Inward Accretion & Central Gravity
  CENTRAL_GRAVITY_COEFF: 0.0018,      // Radial inward gravitational pull
  CENTRAL_DAMPING: 0.985,             // Orbital orbital decay friction
  LAUNCH_SPEED: 8.5,                  // Initial inward velocity
  SPAWN_SAFE_DELAY_MS: 420,

  // Physics Engine Setup
  FIXED_TIMESTEP_MS: 1000 / 60,
  MAX_SUB_STEPS: 4,
  MAX_DELTA_ACCUMULATION_MS: 100,

  // Magnetic Polarity Simulation
  MAGNETIC_ENABLED: true,
  MAGNETIC_MAX_DISTANCE: 140,
  MAGNETIC_FORCE_COEFFICIENT: 0.00030,
  MAGNETIC_MAX_IMPULSE: 0.006,

  // Containment Breach / Hazard
  HAZARD_GRACE_PERIOD_MS: 3000,
  HAZARD_RECOVERY_RATE: 1.8,

  // Signature System: Flux Pulse
  FLUX_MAX_CHARGE: 100,
  FLUX_CHARGE_FORCED_MERGE: 10,
  FLUX_CHARGE_RESONANT_MERGE: 28,

  // Scoring & Combos
  COMBO_WINDOW_MS: 1400,
  COMBO_INCREMENT: 0.5,
  MAX_COMBO_MULTIPLIER: 5.0,
  RESONANT_SCORE_MULTIPLIER: 2.5,

  // Drop Spawn Distribution
  SPAWNABLE_TIERS: [1, 2, 3, 4],
  SPAWN_WEIGHTS: [0.42, 0.35, 0.18, 0.05],

  // Storage Keys
  STORAGE_BEST_SCORE_KEY: 'accretion_zero_best_score',
  STORAGE_AUDIO_KEY: 'accretion_zero_audio_enabled',
  STORAGE_MOTION_KEY: 'accretion_zero_reduced_motion'
} as const;
