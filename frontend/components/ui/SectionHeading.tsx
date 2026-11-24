// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// The gradient is a background clipped to the letters, so anything outside the line box
// isn't painted. Arabic letters reach lower (the dots under ي), so RTL gets a taller line.
export default function SectionHeading({
  children,
  className = "",
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={`bg-gradient-to-r from-accent to-aurora-teal bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl rtl:pb-1 rtl:leading-[1.6] rtl:md:leading-[1.6] ${className}`}
    >
      {children}
    </Tag>
  );
}
