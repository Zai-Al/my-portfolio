// Copyright (c) 2026 Zainab Alawi. All rights reserved.

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
      className={`bg-gradient-to-r from-accent to-aurora-teal bg-clip-text font-display text-3xl font-bold text-transparent md:text-4xl ${className}`}
    >
      {children}
    </Tag>
  );
}
