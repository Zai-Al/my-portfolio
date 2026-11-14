// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const TOUCH_QUERY = "(pointer: coarse)";
const subscribeToPointer = (onChange: () => void) => {
  const media = window.matchMedia(TOUCH_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

export default function CursorGlow() {
  const reduceMotion = useReducedMotion();
  // Touch screen? The server can't know, so it assumes yes and renders nothing.
  const isTouch = useSyncExternalStore(
    subscribeToPointer,
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => true
  );
  const enabled = !reduceMotion && !isTouch;
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const springX = useSpring(x, { damping: 30, stiffness: 200, mass: 0.5 });
  const springY = useSpring(y, { damping: 30, stiffness: 200, mass: 0.5 });

  useEffect(() => {
    if (!enabled) return;
    const handleMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-0 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        x: springX,
        y: springY,
        background:
          "radial-gradient(circle, rgba(0,255,157,0.12) 0%, rgba(0,255,157,0.05) 40%, transparent 70%)",
      }}
    />
  );
}
