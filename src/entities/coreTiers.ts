import { CoreTierDefinition } from '../types.js';

export const CORE_TIERS: Record<number, CoreTierDefinition> = {
  1: {
    tier: 1,
    name: 'Cherry Berry',
    codename: 'CHRY-1',
    radius: 18,
    mass: 1.0,
    restitution: 0.35,
    friction: 0.12,
    frictionAir: 0.008,
    colorBaseAlpha: '#ff3366',
    colorBaseBeta: '#ff6699',
    glowColorAlpha: 'rgba(255, 51, 102, 0.7)',
    glowColorBeta: 'rgba(255, 102, 153, 0.7)',
    scoreValue: 20,
    audioFreq: 261.63, // C4
    queenTitle: 'Princess Cherry'
  },
  2: {
    tier: 2,
    name: 'Sunny Tangerine',
    codename: 'TNGR-2',
    radius: 24,
    mass: 1.7,
    restitution: 0.33,
    friction: 0.12,
    frictionAir: 0.009,
    colorBaseAlpha: '#ff8c00',
    colorBaseBeta: '#ffa500',
    glowColorAlpha: 'rgba(255, 140, 0, 0.7)',
    glowColorBeta: 'rgba(255, 165, 0, 0.7)',
    scoreValue: 50,
    audioFreq: 293.66, // D4
    queenTitle: 'Tangerine Queen'
  },
  3: {
    tier: 3,
    name: 'Star Lemon',
    codename: 'LEMN-3',
    radius: 30,
    mass: 2.8,
    restitution: 0.31,
    friction: 0.14,
    frictionAir: 0.010,
    colorBaseAlpha: '#ffcc00',
    colorBaseBeta: '#ffe066',
    glowColorAlpha: 'rgba(255, 204, 0, 0.75)',
    glowColorBeta: 'rgba(255, 224, 102, 0.75)',
    scoreValue: 120,
    audioFreq: 329.63, // E4
    queenTitle: 'Lemon Monarch'
  },
  4: {
    tier: 4,
    name: 'Minty Leaf',
    codename: 'MINT-4',
    radius: 36,
    mass: 4.5,
    restitution: 0.29,
    friction: 0.15,
    frictionAir: 0.011,
    colorBaseAlpha: '#10b981',
    colorBaseBeta: '#34d399',
    glowColorAlpha: 'rgba(16, 185, 129, 0.75)',
    glowColorBeta: 'rgba(52, 211, 153, 0.75)',
    scoreValue: 260,
    audioFreq: 392.00, // G4
    queenTitle: 'Emerald Duchess'
  },
  5: {
    tier: 5,
    name: 'Aqua Bubble',
    codename: 'AQUA-5',
    radius: 42,
    mass: 7.0,
    restitution: 0.27,
    friction: 0.16,
    frictionAir: 0.012,
    colorBaseAlpha: '#06b6d4',
    colorBaseBeta: '#38bdf8',
    glowColorAlpha: 'rgba(6, 182, 212, 0.75)',
    glowColorBeta: 'rgba(56, 189, 248, 0.75)',
    scoreValue: 550,
    audioFreq: 440.00, // A4
    queenTitle: 'Crystal Empress'
  },
  6: {
    tier: 6,
    name: 'Sweet Lavender',
    codename: 'LVND-6',
    radius: 48,
    mass: 10.5,
    restitution: 0.25,
    friction: 0.18,
    frictionAir: 0.013,
    colorBaseAlpha: '#8b5cf6',
    colorBaseBeta: '#a78bfa',
    glowColorAlpha: 'rgba(139, 92, 246, 0.8)',
    glowColorBeta: 'rgba(167, 139, 250, 0.8)',
    scoreValue: 1100,
    audioFreq: 523.25, // C5
    queenTitle: 'Lavender Sovereign'
  },
  7: {
    tier: 7,
    name: 'Bubblegum Berry',
    codename: 'BBLG-7',
    radius: 54,
    mass: 15.0,
    restitution: 0.23,
    friction: 0.20,
    frictionAir: 0.014,
    colorBaseAlpha: '#ec4899',
    colorBaseBeta: '#f472b6',
    glowColorAlpha: 'rgba(236, 72, 153, 0.85)',
    glowColorBeta: 'rgba(244, 114, 182, 0.85)',
    scoreValue: 2200,
    audioFreq: 587.33, // D5
    queenTitle: 'Royal Bubblegem'
  },
  8: {
    tier: 8,
    name: 'Royal Sapphire',
    codename: 'SPHR-8',
    radius: 60,
    mass: 21.0,
    restitution: 0.21,
    friction: 0.22,
    frictionAir: 0.015,
    colorBaseAlpha: '#2563eb',
    colorBaseBeta: '#60a5fa',
    glowColorAlpha: 'rgba(37, 99, 235, 0.85)',
    glowColorBeta: 'rgba(96, 165, 250, 0.85)',
    scoreValue: 4500,
    audioFreq: 659.25, // E5
    queenTitle: 'Sapphire Goddess'
  },
  9: {
    tier: 9,
    name: 'Golden Honey',
    codename: 'HONY-9',
    radius: 67,
    mass: 30.0,
    restitution: 0.19,
    friction: 0.24,
    frictionAir: 0.016,
    colorBaseAlpha: '#f59e0b',
    colorBaseBeta: '#fbbf24',
    glowColorAlpha: 'rgba(245, 158, 11, 0.9)',
    glowColorBeta: 'rgba(251, 191, 36, 0.9)',
    scoreValue: 9000,
    audioFreq: 783.99, // G5
    queenTitle: 'Solar Majesty'
  },
  10: {
    tier: 10,
    name: 'Astral Galaxy',
    codename: 'GLXY-10',
    radius: 74,
    mass: 42.0,
    restitution: 0.17,
    friction: 0.26,
    frictionAir: 0.018,
    colorBaseAlpha: '#7c3aed',
    colorBaseBeta: '#c084fc',
    glowColorAlpha: 'rgba(124, 58, 237, 0.95)',
    glowColorBeta: 'rgba(192, 132, 252, 0.95)',
    scoreValue: 18000,
    audioFreq: 880.00, // A5
    queenTitle: 'Cosmic Aurora Queen'
  },
  11: {
    tier: 11,
    name: 'Star Titan',
    codename: 'TITN-11',
    radius: 81,
    mass: 60.0,
    restitution: 0.15,
    friction: 0.28,
    frictionAir: 0.020,
    colorBaseAlpha: '#f43f5e',
    colorBaseBeta: '#fb7185',
    glowColorAlpha: 'rgba(244, 63, 94, 1.0)',
    glowColorBeta: 'rgba(251, 113, 133, 1.0)',
    scoreValue: 40000,
    audioFreq: 1046.50, // C6
    queenTitle: 'Galaxy Mother'
  }
};

export const MAX_TIER = 11;
