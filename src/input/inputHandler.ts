import { GAME_CONFIG } from '../config.js';
import { GameState } from '../core/gameState.js';

export interface InputCallbacks {
  onAimAngle: (rad: number) => void;
  onLaunch: () => void;
  onFluxPulse: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
}

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private gameState: GameState;
  private callbacks: InputCallbacks;
  private isPointerDown: boolean = false;

  constructor(canvas: HTMLCanvasElement, gameState: GameState, callbacks: InputCallbacks) {
    this.canvas = canvas;
    this.gameState = gameState;
    this.callbacks = callbacks;

    this.bindPointerEvents();
    this.bindKeyboardEvents();
  }

  private clientToChamberCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return {
      x: nx * GAME_CONFIG.CHAMBER_WIDTH,
      y: ny * GAME_CONFIG.CHAMBER_HEIGHT
    };
  }

  private updateAimFromPointer(clientX: number, clientY: number): void {
    const coords = this.clientToChamberCoords(clientX, clientY);
    const dx = coords.x - GAME_CONFIG.CENTER_X;
    const dy = coords.y - GAME_CONFIG.CENTER_Y;
    const angle = Math.atan2(dy, dx);
    this.callbacks.onAimAngle(angle);
  }

  private bindPointerEvents(): void {
    window.addEventListener('pointermove', (e: PointerEvent) => {
      this.updateAimFromPointer(e.clientX, e.clientY);
    }, { passive: false });

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.isPointerDown = true;
      this.updateAimFromPointer(e.clientX, e.clientY);
    }, { passive: false });

    window.addEventListener('pointerup', (e: PointerEvent) => {
      if (!this.isPointerDown) return;
      this.isPointerDown = false;

      const rect = this.canvas.getBoundingClientRect();
      const isOverCanvas = (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      );

      if (isOverCanvas) {
        this.callbacks.onLaunch();
      }
    }, { passive: false });

    window.addEventListener('pointercancel', () => {
      this.isPointerDown = false;
    });
  }

  private bindKeyboardEvents(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (['input', 'textarea', 'button', 'summary', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase()) || document.querySelector('.modal-backdrop:not(.hidden), .hud-dropdown[open]')) {
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA': {
          e.preventDefault();
          this.callbacks.onAimAngle(this.gameState.aimAngle - 0.08);
          break;
        }
        case 'ArrowRight':
        case 'KeyD': {
          e.preventDefault();
          this.callbacks.onAimAngle(this.gameState.aimAngle + 0.08);
          break;
        }
        case 'ArrowDown':
        case 'Enter': {
          e.preventDefault();
          this.callbacks.onLaunch();
          break;
        }
        case 'Space': {
          e.preventDefault();
          this.callbacks.onFluxPulse();
          break;
        }
        case 'KeyM': {
          e.preventDefault();
          this.callbacks.onToggleSound();
          break;
        }
        case 'KeyR': {
          e.preventDefault();
          this.callbacks.onRestart();
          break;
        }
      }
    });
  }
}
