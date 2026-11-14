// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import type { TargetAndTransition, Variants } from "framer-motion";

export const revealContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export const cardHover: TargetAndTransition = {
  y: -6,
  transition: { duration: 0.2, ease: "easeOut" },
};
export const cardTap: TargetAndTransition = { scale: 0.97 };
