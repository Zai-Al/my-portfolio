// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

/**
 * Fixed, blurred gradient blobs that drift slowly behind all content.
 * Uses mix-blend-mode: screen so the colors glow rather than muddy together,
 * and stays fixed (not parallax) since parallax depth is handled per-section
 * by the sections themselves via Framer Motion's useScroll/useTransform.
 */
export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
    >
      <div
        className="aurora-blob-a absolute left-1/4 top-0 h-[60vh] w-[60vh] rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #1fd1a3 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="aurora-blob-b absolute right-1/4 top-1/3 h-[70vh] w-[70vh] rounded-full opacity-25 blur-3xl"
        style={{
          background: "radial-gradient(circle, #7c6cff 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="aurora-blob-a absolute bottom-0 left-1/3 h-[50vh] w-[50vh] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #3ea6ff 0%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />
      {/* subtle scanline texture for the terminal feel */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 2px, #fff 3px)",
        }}
      />
    </div>
  );
}
