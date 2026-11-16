import {Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Polyfill CanvasRenderingContext2D.roundRect for older mobile browsers
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | DOMPointInit | (number | DOMPointInit)[]
  ) {
    const r = typeof radii === 'number' ? radii : Array.isArray(radii) && typeof radii[0] === 'number' ? radii[0] : 0;
    const clamped = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    this.beginPath();
    this.moveTo(x + clamped, y);
    this.arcTo(x + w, y, x + w, y + h, clamped);
    this.arcTo(x + w, y + h, x, y + h, clamped);
    this.arcTo(x, y + h, x, y, clamped);
    this.arcTo(x, y, x + w, y, clamped);
    this.closePath();
    return this;
  };
}

class GameErrorBoundary extends Component<{children: ReactNode}, {errorMessage: string | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = {errorMessage: null};
  }

  static getDerivedStateFromError(error: Error) {
    return {errorMessage: error.message || 'Errore imprevisto durante il caricamento.'};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game render error:', error, info);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="flex h-dvh w-screen items-center justify-center bg-stone-950 p-6 text-center text-stone-100">
          <div className="max-w-md rounded-2xl bg-stone-900 p-6 ring-1 ring-amber-400/30">
            <h1 className="font-display text-xl font-bold text-amber-400">Il Sindaco di Paglieta</h1>
            <p className="mt-2 text-sm text-stone-300">{this.state.errorMessage}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <GameErrorBoundary>
    <App />
  </GameErrorBoundary>
);
