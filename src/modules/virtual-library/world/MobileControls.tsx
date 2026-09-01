"use client";

import { useEffect, useRef } from "react";

interface Props {
  movementInputRef: React.RefObject<{
    press: (key: string) => void;
    release: (key: string) => void;
    setClickTarget: (t: { x: number; y: number } | null) => void;
  } | null>;
  worldRef: React.RefObject<HTMLDivElement | null>;
  /** World map size in pixels (canvas internal coords) — width × tileSize. */
  worldPixelSize: number;
}

type Dir = "up" | "down" | "left" | "right";

const DIR_KEYS: Record<Dir, string> = {
  up: "w",
  down: "s",
  left: "a",
  right: "d",
};

export function MobileControls({ movementInputRef, worldRef, worldPixelSize }: Props) {
  const holdTimers = useRef<Record<Dir, number | null>>({
    up: null,
    down: null,
    left: null,
    right: null,
  });

  const pressDir = (dir: Dir) => {
    movementInputRef.current?.press(DIR_KEYS[dir]);
  };

  const releaseDir = (dir: Dir) => {
    movementInputRef.current?.release(DIR_KEYS[dir]);
    if (holdTimers.current[dir] !== null) {
      clearTimeout(holdTimers.current[dir]!);
      holdTimers.current[dir] = null;
    }
  };

  // Start auto-repeat for D-pad to enable holding to move continuously
  const startRepeat = (dir: Dir) => {
    releaseDir(dir);
    pressDir(dir);
    holdTimers.current[dir] = window.setTimeout(() => {
      const repeat = () => {
        pressDir(dir);
        holdTimers.current[dir] = window.setTimeout(repeat, 80);
      };
      holdTimers.current[dir] = window.setTimeout(repeat, 350) as unknown as number;
    }, 350) as unknown as number;
  };

  // Touch on canvas = click-to-move. Convert from screen → canvas world coords.
  const handleCanvasTouch = (e: React.TouchEvent) => {
    const world = worldRef.current;
    const canvas = world?.querySelector("canvas");
    if (!world || !canvas || worldPixelSize <= 0) return;

    const touch = e.touches[0];
    if (!touch) return;

    const canvasRect = canvas.getBoundingClientRect();

    // Map canvas display rect → internal world coords
    const scaleX = worldPixelSize / canvasRect.width;
    const scaleY = worldPixelSize / canvasRect.height;

    const worldX = (touch.clientX - canvasRect.left) * scaleX;
    const worldY = (touch.clientY - canvasRect.top) * scaleY;

    movementInputRef.current?.setClickTarget({ x: worldX, y: worldY });
  };

  const handleCanvasTouchEnd = () => {
    // Nothing to do — touch-to-move is consumed once per tap
  };

  useEffect(() => {
    return () => {
      (["up", "down", "left", "right"] as Dir[]).forEach((d) => {
        if (holdTimers.current[d] !== null) clearTimeout(holdTimers.current[d]!);
      });
    };
  }, []);

  const dirClass =
    "flex items-center justify-center w-12 h-12 bg-foreground-dark/60 backdrop-blur-sm border border-border-light/50 rounded-xl active:bg-foreground-dark/90 select-none touch-manipulation";

  return (
    <div className="md:hidden absolute inset-0 z-30 pointer-events-none">
      {/* Click-to-move overlay: taps outside D-pad move the avatar */}
      <div
        className="absolute top-0 left-0 right-16 bottom-24 pointer-events-auto cursor-crosshair"
        onTouchStart={handleCanvasTouch}
        onTouchMove={handleCanvasTouch}
        onTouchEnd={handleCanvasTouchEnd}
      />

      {/* D-pad — bottom-left */}
      <div className="absolute bottom-8 left-4 pointer-events-auto">
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-40">
          <div />
          <button
            className={dirClass}
            onTouchStart={(e) => {
              e.preventDefault();
              startRepeat("up");
            }}
            onTouchEnd={() => releaseDir("up")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground-light" fill="currentColor">
              <path d="M12 4l-8 8h16z" />
            </svg>
          </button>
          <div />

          <button
            className={dirClass}
            onTouchStart={(e) => {
              e.preventDefault();
              startRepeat("left");
            }}
            onTouchEnd={() => releaseDir("left")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground-light" fill="currentColor">
              <path d="M4 12l8-8v16z" />
            </svg>
          </button>
          <div />
          <button
            className={dirClass}
            onTouchStart={(e) => {
              e.preventDefault();
              startRepeat("right");
            }}
            onTouchEnd={() => releaseDir("right")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground-light" fill="currentColor">
              <path d="M20 12l-8-8v16z" />
            </svg>
          </button>

          <div />
          <button
            className={dirClass}
            onTouchStart={(e) => {
              e.preventDefault();
              startRepeat("down");
            }}
            onTouchEnd={() => releaseDir("down")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-foreground-light" fill="currentColor">
              <path d="M12 20l8-8H4z" />
            </svg>
          </button>
          <div />
        </div>
      </div>

      {/* Direction indicator */}
      <div className="absolute bottom-32 left-48 pointer-events-none">
        <p className="text-[10px] text-foreground-light/40 bg-foreground-dark/40 backdrop-blur-sm rounded-full px-2 py-0.5">
          Tap to move
        </p>
      </div>
    </div>
  );
}