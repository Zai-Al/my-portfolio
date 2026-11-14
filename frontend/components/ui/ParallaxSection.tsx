// Copyright (c) 2026 Zainab Alawi. All rights reserved.

"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Wraps a section so it moves at a different speed than the page scroll,
 * creating real depth instead of a simple fade/slide-in.
 * `speed` > 0 moves slower than scroll (feels "further back"),
 * `speed` < 0 moves faster (feels "closer to camera").
 */
export default function ParallaxSection({
  children,
  speed = 0.15,
  className = "",
  id,
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, speed * -100]);

  return (
    <div ref={ref} id={id} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
