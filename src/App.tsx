import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameEngine } from './game/engine';
import { LEVELS } from './game/levels';
import { subscribeMayorPortrait } from './game/mayorSprite';
import { HudSnapshot } from './game/types';

const BACKDROP_SRC = '/src/assets/images/paglieta_title_backdrop_1794818977156.jpg';
const PORTRAIT_SRC = '/assets/aistudio/graziani-sindaco_dafad287.jpg';

const INITIAL_HUD: HudSnapshot = {
  screen: 'TITLE_MENU',
  levelIndex: 0,
  levelName: LEVELS[0].name,
  district: LEVELS[0].district,
  score: 0,
  lives: 3,
  maxLives: 3,
  hasShield: false,
  cocktailsCollected: 0,
  cocktailsRequired: LEVELS[0].cocktails.length,
  combo: 0,
  elapsedSeconds: 0,
  missingDirection: 0,
  goalReachedHint: false,
  muted: false,
  levelStats: {
    cocktailsCollected: 0,
    cocktailsRequired: LEVELS[0].cocktails.length,
    timeBonus: 0,
    stars: 3,
  },
  totalCocktailsAllLevels: 0,
  highScore: 0,
};

function MayorSashMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <rect x="2" y="2" width="24" height="24" rx="6" fill="#1E3A5F" stroke="#FCD34D" strokeWidth="1.5" />
      <path d="M5 23 L23 5" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" />
      <path d="M8 23 L23 8" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M11 23 L23 11" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function CocktailIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        d="M5 6 H19 L12 14 Z"
        fill="#FF6B1A"
        stroke="#FFFBEB"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line x1="12" y1="14" x2="12" y2="20" stroke="#FFFBEB" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="20" x2="16" y2="20" stroke="#FFFBEB" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17.5" cy="5.5" r="2.6" fill="#FBBF24" stroke="#FFFBEB" strokeWidth="1" />
      <line x1="10" y1="9" x2="7" y2="3" stroke="#F43F5E" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TitleLockupSvg() {
  return (
    <svg
      viewBox="0 0 540 132"
      className="w-full max-w-[490px] drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
      role="img"
      aria-label="Il Sindaco di Paglieta"
    >
      <defs>
        <linearGradient id="titleGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF7D6" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      {/* Tricolore ribbon rule */}
      <rect x="2" y="10" width="38" height="5" rx="2.5" fill="#16A34A" />
      <rect x="44" y="10" width="38" height="5" rx="2.5" fill="#FFFFFF" />
      <rect x="86" y="10" width="38" height="5" rx="2.5" fill="#DC2626" />
      <text
        x="138"
        y="16"
        fill="#FDE68A"
        fontSize="13"
        fontWeight="700"
        letterSpacing="2.2"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        ABRUZZO · EDIZIONE APERITIVO
      </text>

      <text
        x="0"
        y="74"
        fill="#1C1917"
        stroke="#1C1917"
        strokeWidth="8"
        strokeLinejoin="round"
        fontSize="54"
        fontWeight="800"
        fontFamily="Bricolage Grotesque, sans-serif"
      >
        Il Sindaco
      </text>
      <text
        x="0"
        y="74"
        fill="url(#titleGold)"
        fontSize="54"
        fontWeight="800"
        fontFamily="Bricolage Grotesque, sans-serif"
      >
        Il Sindaco
      </text>

      <text
        x="2"
        y="120"
        fill="#1C1917"
        stroke="#1C1917"
        strokeWidth="7"
        strokeLinejoin="round"
        fontSize="42"
        fontWeight="800"
        fontFamily="Bricolage Grotesque, sans-serif"
      >
        di Paglieta
      </text>
      <text
        x="2"
        y="120"
        fill="#FFFFFF"
        fontSize="42"
        fontWeight="800"
        fontFamily="Bricolage Grotesque, sans-serif"
      >
        di Paglieta
      </text>
    </svg>
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [selectedStartLevel, setSelectedStartLevel] = useState<number>(0);
  const [backdropError, setBackdropError] = useState(false);
  const [portraitError, setPortraitError] = useState(false);
  const [cleanPortraitUrl, setCleanPortraitUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeMayorPortrait((url) => setCleanPortraitUrl(url));
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-stone-950 select-none">
      {/* Isolated Game Canvas Viewport */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      {/* ================================================================ */}
      {/* TITLE SCREEN                                                     */}
      {/* ================================================================ */}
      {hud.screen === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col justify-between overflow-hidden">
          {/* Illustrated Paglieta Key-Art Backdrop */}
          {!backdropError ? (
            <img
              src={BACKDROP_SRC}
              alt="Panorama di Paglieta in Abruzzo al tramonto con la Maiella sullo sfondo"
              referrerPolicy="no-referrer"
              onError={() => setBackdropError(true)}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-900 via-amber-900 to-stone-950" />
          )}

          {/* Measured Atmospheric Scrim on Left 45% for Calm Title Space */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/65 to-stone-950/15" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/85 via-transparent to-stone-950/30" />

          {/* Top Bar: Quiet High Score & Mute Toggle */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-5 sm:px-10">
            <div className="flex items-center gap-3 text-sm font-medium text-amber-100/90">
              <span>Comune di Paglieta (CH)</span>
              {hud.highScore > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num text-amber-300">
                    Record: {hud.highScore.toLocaleString('it-IT')} pt
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => engineRef.current?.toggleMute()}
              aria-label={hud.muted ? 'Attiva audio' : 'Disattiva audio'}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900/75 text-amber-100 ring-1 ring-white/15 transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              {hud.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          {/* Center-Left Hero Title Lockup & Mission Brief */}
          <div className="relative z-10 flex flex-1 items-center px-6 sm:px-10 lg:px-14">
            <div className="max-w-xl space-y-5">
              <TitleLockupSvg />

              <div className="flex items-center gap-4">
                {!portraitError ? (
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-sky-300 via-amber-100 to-amber-200 ring-2 ring-amber-400/80 shadow-lg">
                    <img
                      src={cleanPortraitUrl ?? PORTRAIT_SRC}
                      alt="Il Sindaco di Paglieta"
                      referrerPolicy="no-referrer"
                      onError={() => setPortraitError(true)}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-stone-800 ring-2 ring-amber-400/70">
                    <MayorSashMark />
                  </div>
                )}

                <p className="text-sm leading-relaxed text-stone-200 sm:text-base">
                  Raccogli tutti i cocktail dell’aperitivo tra le vie di Paglieta, salta sulle tende
                  dei bar per raggiungere i balconi e schiva o salta in testa ai cittadini arrabbiati.
                </p>
              </div>

              {/* District / Level Selector */}
              <div className="space-y-2">
                <div className="text-xs font-semibold tracking-wide text-amber-300/90">
                  Scegli quartiere di partenza
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {LEVELS.map((lvl) => {
                    const active = selectedStartLevel === lvl.index;
                    return (
                      <button
                        key={lvl.index}
                        type="button"
                        onClick={() => setSelectedStartLevel(lvl.index)}
                        className={`rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-amber-400 ${
                          active
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                            : 'bg-stone-900/80 text-stone-200 ring-1 ring-white/15 hover:bg-stone-800'
                        }`}
                      >
                        <div className="font-mono-num text-[11px] opacity-80">
                          Livello {lvl.index + 1}
                        </div>
                        <div className="truncate text-xs font-semibold">{lvl.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Start CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => engineRef.current?.startNewGame(selectedStartLevel)}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-amber-500 px-7 py-3.5 font-display text-lg font-extrabold text-stone-950 shadow-[0_6px_24px_rgba(245,158,11,0.45)] transition-transform duration-150 hover:bg-amber-400 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
                >
                  <Play className="h-5 w-5 fill-current" />
                  <span>Inizia Partita</span>
                </button>
              </div>
            </div>
          </div>

          {/* Single Flat Control-Hint Line */}
          <div className="relative z-10 px-6 pb-5 sm:px-10">
            <p className="text-xs font-medium tracking-wide text-stone-300/90 sm:text-sm">
              WASD / Frecce Muovi · Spazio / W Salta · Shift Scatta · Esc Pausa · M Audio
            </p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* ACTIVE PLAY HUD (Pointer-events-none, zero backdrop-blur)        */}
      {/* ================================================================ */}
      {hud.screen !== 'TITLE_MENU' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
          {/* Top Perimeter Status Clusters */}
          <div className="flex items-start justify-between gap-4">
            {/* Top-Left: Mayor Lives, Shield & District */}
            <div className="flex flex-col gap-1.5 rounded-xl bg-stone-950/75 px-3.5 py-2.5 ring-1 ring-white/15">
              <div className="flex items-center gap-3">
                <MayorSashMark />
                <div className="flex items-center gap-1.5" aria-label={`Vite: ${hud.lives}`}>
                  {Array.from({ length: hud.maxLives }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block h-3.5 w-3.5 rounded-sm transition-transform ${
                        i < hud.lives
                          ? 'bg-red-500 ring-1 ring-red-300'
                          : 'bg-stone-700/80 ring-1 ring-white/10'
                      }`}
                    />
                  ))}
                  <span className="ml-1 font-mono-num text-xs font-bold text-stone-200">
                    VITE {hud.lives}/{hud.maxLives}
                  </span>
                </div>

                {hud.hasShield && (
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <Shield className="h-4 w-4 fill-emerald-500/30" />
                    <span>Scudo</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-stone-300">
                <span className="font-semibold text-amber-300">
                  Livello {hud.levelIndex + 1}
                </span>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[200px] sm:max-w-none">{hud.levelName}</span>
              </div>
            </div>

            {/* Top-Right: Cocktails, Score, Time & Controls */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-4 rounded-xl bg-stone-950/75 px-3.5 py-2.5 ring-1 ring-white/15">
                <div className="flex items-center gap-2">
                  <CocktailIcon />
                  <span
                    className={`font-mono-num text-base font-bold ${
                      hud.cocktailsCollected >= hud.cocktailsRequired
                        ? 'text-emerald-400'
                        : 'text-amber-300'
                    }`}
                  >
                    {hud.cocktailsCollected}/{hud.cocktailsRequired}
                  </span>
                </div>

                <span className="h-4 w-px bg-white/15" aria-hidden="true" />

                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-stone-400">Punti</span>
                  <span className="font-mono-num text-base font-bold text-white">
                    {hud.score.toLocaleString('it-IT')}
                  </span>
                </div>

                {hud.combo >= 2 && (
                  <span className="font-mono-num text-xs font-extrabold text-orange-400">
                    x{Math.min(3, 1 + Math.floor((hud.combo - 1) / 2))}
                  </span>
                )}

                <span className="hidden h-4 w-px bg-white/15 sm:inline-block" aria-hidden="true" />
                <span className="hidden font-mono-num text-xs text-stone-300 sm:inline">
                  {formatTime(hud.elapsedSeconds)}
                </span>
              </div>

              {/* Interactive HUD Buttons */}
              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => engineRef.current?.toggleMute()}
                  aria-label={hud.muted ? 'Attiva audio' : 'Disattiva audio'}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-950/80 text-stone-100 ring-1 ring-white/15 transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  {hud.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => engineRef.current?.togglePause()}
                  aria-label="Pausa"
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-stone-950/80 text-stone-100 ring-1 ring-white/15 transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-amber-400"
                >
                  <Pause className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Subtle Missing Cocktail Direction Prompt near Municipio */}
          {hud.screen === 'PLAYING' && (hud.goalReachedHint || hud.missingDirection !== 0) && (
            <div className="mx-auto mb-2 rounded-lg bg-stone-950/85 px-4 py-2 text-center text-xs font-semibold text-amber-300 ring-1 ring-amber-400/40 sm:text-sm">
              {hud.missingDirection === -1
                ? '← Torna indietro: mancano ancora dei cocktail per aprire il Municipio'
                : hud.missingDirection === 1
                  ? 'Raccogli i cocktail rimanenti avanti → per aprire il Municipio'
                  : `Raccogli tutti i ${hud.cocktailsRequired} cocktail prima di entrare in Municipio`}
            </div>
          )}

          {/* Mobile / Touch Virtual Controls */}
          {hud.screen === 'PLAYING' && (
            <div className="pointer-events-auto flex items-end justify-between pb-1 md:hidden">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Sinistra"
                  onPointerDown={() => engineRef.current?.setTouchButton('left', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('left', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('left', false)}
                  onPointerLeave={() => engineRef.current?.setTouchButton('left', false)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950/70 text-white ring-1 ring-white/25 active:bg-amber-500 active:text-stone-950"
                >
                  <ArrowLeft className="h-7 w-7" />
                </button>
                <button
                  type="button"
                  aria-label="Destra"
                  onPointerDown={() => engineRef.current?.setTouchButton('right', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('right', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('right', false)}
                  onPointerLeave={() => engineRef.current?.setTouchButton('right', false)}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-950/70 text-white ring-1 ring-white/25 active:bg-amber-500 active:text-stone-950"
                >
                  <ArrowRight className="h-7 w-7" />
                </button>
              </div>

              <button
                type="button"
                aria-label="Salta"
                onPointerDown={() => engineRef.current?.setTouchButton('jump', true)}
                onPointerUp={() => engineRef.current?.setTouchButton('jump', false)}
                onPointerCancel={() => engineRef.current?.setTouchButton('jump', false)}
                onPointerLeave={() => engineRef.current?.setTouchButton('jump', false)}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/90 text-stone-950 ring-2 ring-amber-200 active:scale-95"
              >
                <ArrowUp className="h-8 w-8 stroke-[2.6]" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* PAUSE MODAL                                                      */}
      {/* ================================================================ */}
      {hud.screen === 'PAUSED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/75 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-stone-900 p-6 text-center ring-1 ring-white/15 shadow-2xl">
            <h2 className="font-display text-2xl font-extrabold text-white">Gioco in Pausa</h2>
            <p className="mt-1 text-sm text-stone-400">
              Livello {hud.levelIndex + 1} · {hud.levelName}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => engineRef.current?.togglePause()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 transition-colors hover:bg-amber-400"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Riprendi</span>
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.restartCurrentLevel()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-800 px-5 py-3 font-semibold text-stone-100 ring-1 ring-white/10 transition-colors hover:bg-stone-700"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Ricomincia Livello</span>
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.returnToTitle()}
                className="w-full rounded-xl px-5 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800/70 hover:text-white"
              >
                Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* LEVEL CLEAR MODAL                                                */}
      {/* ================================================================ */}
      {hud.screen === 'LEVEL_CLEAR' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/75 p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 p-7 text-center ring-1 ring-amber-400/30 shadow-2xl">
            <div className="text-xs font-bold tracking-wider text-emerald-400">
              QUARTIERE COMPLETATO
            </div>
            <h2 className="mt-1 font-display text-3xl font-extrabold text-white">
              {hud.levelName}
            </h2>

            {/* Stars */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`h-8 w-8 ${
                    s <= hud.levelStats.stars
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-700'
                  }`}
                />
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-stone-950/70 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-xs text-stone-400">Cocktail</div>
                <div className="mt-0.5 font-mono-num text-lg font-bold text-amber-300">
                  {hud.levelStats.cocktailsCollected}/{hud.levelStats.cocktailsRequired}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Bonus Tempo</div>
                <div className="mt-0.5 font-mono-num text-lg font-bold text-emerald-400">
                  +{hud.levelStats.timeBonus}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Punteggio</div>
                <div className="mt-0.5 font-mono-num text-lg font-bold text-white">
                  {hud.score.toLocaleString('it-IT')}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => engineRef.current?.restartCurrentLevel()}
                className="flex-1 rounded-xl bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 ring-1 ring-white/10 transition-colors hover:bg-stone-700"
              >
                Rigioca
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.nextLevel()}
                className="flex-[1.5] rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 transition-colors hover:bg-amber-400"
              >
                Prossimo Livello
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* GAME OVER MODAL                                                  */}
      {/* ================================================================ */}
      {hud.screen === 'GAME_OVER' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-stone-900 p-7 text-center ring-1 ring-red-500/30 shadow-2xl">
            <div className="text-xs font-bold tracking-wider text-red-400">
              PROTESTA IN PIAZZA
            </div>
            <h2 className="mt-1 font-display text-3xl font-extrabold text-white">
              Sfiducia al Sindaco
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              I cittadini arrabbiati hanno avuto la meglio in {hud.levelName}.
            </p>

            <div className="mt-5 flex justify-around rounded-xl bg-stone-950/70 p-3.5 ring-1 ring-white/10">
              <div>
                <div className="text-xs text-stone-400">Punteggio</div>
                <div className="font-mono-num text-lg font-bold text-white">
                  {hud.score.toLocaleString('it-IT')}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Cocktail</div>
                <div className="font-mono-num text-lg font-bold text-amber-300">
                  {hud.cocktailsCollected}/{hud.cocktailsRequired}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => engineRef.current?.restartCurrentLevel()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 transition-colors hover:bg-amber-400"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Riprova Livello</span>
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.returnToTitle()}
                className="w-full rounded-xl px-5 py-2.5 text-sm font-medium text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
              >
                Torna al Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* VICTORY MODAL                                                    */}
      {/* ================================================================ */}
      {hud.screen === 'VICTORY' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950/85 p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 p-7 text-center ring-1 ring-amber-400/40 shadow-2xl">
            <div className="mx-auto mb-3 flex w-fit items-center gap-3">
              {!portraitError ? (
                <div className="h-22 w-22 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-300 via-amber-100 to-amber-200 ring-2 ring-amber-400 shadow-lg">
                  <img
                    src={cleanPortraitUrl ?? PORTRAIT_SRC}
                    alt="Il Sindaco trionfante a Paglieta"
                    referrerPolicy="no-referrer"
                    onError={() => setPortraitError(true)}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : (
                <MayorSashMark />
              )}
            </div>

            <div className="text-xs font-bold tracking-wider text-emerald-400">
              VITTORIA A PAGLIETA
            </div>
            <h2 className="mt-1 font-display text-3xl font-extrabold text-white">
              Sindaco Riconfermato!
            </h2>
            <p className="mt-2 text-sm text-stone-300">
              Hai brindato in tutti i quartieri di Paglieta e riportato il buonumore in Piazza Municipio.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-stone-950/75 p-4 ring-1 ring-white/10">
              <div>
                <div className="text-xs text-stone-400">Punteggio Finale</div>
                <div className="mt-0.5 font-mono-num text-xl font-extrabold text-amber-300">
                  {hud.score.toLocaleString('it-IT')}
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-400">Cocktail Raccolti</div>
                <div className="mt-0.5 font-mono-num text-xl font-extrabold text-emerald-400">
                  {hud.totalCocktailsAllLevels}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => engineRef.current?.returnToTitle()}
                className="flex-1 rounded-xl bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 ring-1 ring-white/10 transition-colors hover:bg-stone-700"
              >
                Menu Principale
              </button>
              <button
                type="button"
                onClick={() => engineRef.current?.startNewGame(0)}
                className="flex-[1.5] rounded-xl bg-amber-500 px-5 py-3 font-bold text-stone-950 transition-colors hover:bg-amber-400"
              >
                Gioca Ancora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
