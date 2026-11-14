// Copyright (c) 2026 Zainab Alawi. All rights reserved.

// One AI guide for the whole site: the chat panel (ChatWidget). Other parts of the page,
// like the home page terminal, hand questions to it with this event instead of answering
// themselves, so there's one conversation and follow-ups keep their context.

export const AI_GUIDE_EVENT = "ai-guide:open";

export type AiGuideRequest = { question?: string };

/** Opens the AI guide panel, and asks `question` there if one is given. */
export function openAiGuide(question?: string) {
  window.dispatchEvent(new CustomEvent<AiGuideRequest>(AI_GUIDE_EVENT, { detail: { question } }));
}
