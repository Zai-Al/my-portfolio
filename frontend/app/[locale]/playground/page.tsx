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
import { localize } from "@/lib/i18n/localize";
import { getTranslations, setRequestLocale } from "next-intl/server";

// title = key in the "playground" strings. The games themselves stay in English.
const GAMES = [
  {
    title: "gameOfLife",
    file: "components/games/GameOfLife.tsx",
    node: <GameOfLife />,
  },
  {
    title: "debugTheBug",
    file: "components/games/DebugTheBug.tsx",
    node: <DebugTheBug />,
  },
  {
    title: "compileRace",
    file: "components/games/CompileRace.tsx",
    node: <CompileRace />,
  },
  {
    title: "segfaultSnake",
    file: "components/games/SegfaultSnake.tsx",
    node: <SegfaultSnake />,
  },
];

const REPO_BASE = "https://github.com/Zai-Al/my-portfolio/blob/main/frontend/";

export async function generateMetadata({ params }: PageProps<"/[locale]/playground">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "playground" });
  return { title: t("title") };
}

export default async function Playground({ params }: PageProps<"/[locale]/playground">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("playground");
  const [settings, guides] = localize(await Promise.all([getSiteSettings(), getGuides()]), locale);
  return (
    <>
      <main className="relative min-h-screen px-6 py-16">
        <AuroraBackground />
        <Sidebar variant="playground" />
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading as="h1" className="mx-auto">
            {t("title")}
          </SectionHeading>
          <p className="mt-2 font-mono text-sm text-gray-400">{t("intro")}</p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-20">
          {GAMES.map((game) => (
            <div key={game.title} className="flex w-full flex-col items-center gap-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-semibold">{t(game.title)}</h2>
                <a
                  href={`${REPO_BASE}${game.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-gray-400 underline hover:text-accent"
                >
                  {t("viewSource")}
                </a>
              </div>
              <div
                dir="ltr"
                className="flex min-h-[340px] w-[440px] max-w-full flex-col items-center justify-start"
              >
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
