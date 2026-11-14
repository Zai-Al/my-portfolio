// Copyright (c) 2026 Zainab Alawi. All rights reserved.

import AuroraBackground from "@/components/layout/AuroraBackground";
import Footer from "@/components/layout/Footer";
import Sidebar from "@/components/layout/Sidebar";
import ChatWidget from "@/components/chat/ChatWidget";
import SectionHeading from "@/components/ui/SectionHeading";
import GameOfLife from "@/components/games/GameOfLife";
import DebugTheBug from "@/components/games/DebugTheBug";
import CompileRace from "@/components/games/CompileRace";
import SegfaultSnake from "@/components/games/SegfaultSnake";
import { getGuides, getSiteSettings } from "@/lib/api/public";
import { starterQuestions } from "@/lib/site";

const GAMES = [
  {
    title: "Conway's Game of Life",
    file: "components/games/GameOfLife.tsx",
    node: <GameOfLife />,
  },
  {
    title: "Debug the Bug",
    file: "components/games/DebugTheBug.tsx",
    node: <DebugTheBug />,
  },
  {
    title: "Compile Race",
    file: "components/games/CompileRace.tsx",
    node: <CompileRace />,
  },
  {
    title: "Segfault Snake",
    file: "components/games/SegfaultSnake.tsx",
    node: <SegfaultSnake />,
  },
];

const REPO_BASE = "https://github.com/Zai-Al/my-portfolio/blob/main/frontend/";

export default async function Playground() {
  const [settings, guides] = await Promise.all([getSiteSettings(), getGuides()]);
  return (
    <>
      <main className="relative min-h-screen px-6 py-16">
        <AuroraBackground />
        <Sidebar variant="playground" />
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading as="h1" className="mx-auto">
            Playground
          </SectionHeading>
          <p className="mt-2 font-mono text-sm text-gray-400">
            nothing here is strict - just things worth clicking around in. there&apos;s also a
            hidden command in the terminal on the home page.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-20">
          {GAMES.map((game) => (
            <div key={game.title} className="flex w-full flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-semibold">{game.title}</h2>
                <a
                  href={`${REPO_BASE}${game.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-gray-400 underline hover:text-accent"
                >
                  view source
                </a>
              </div>
              <div className="flex min-h-[340px] w-[440px] max-w-full flex-col items-center justify-start">
                {game.node}
              </div>
            </div>
          ))}
        </div>
      </main>
      {/* Public pages only - the admin portal has its own layout. */}
      <Footer name={settings.fullName} />
      <ChatWidget ownerName={settings.fullName} suggestions={starterQuestions(guides)} />
    </>
  );
}
