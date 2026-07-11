"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Heart, RotateCcw, Sparkles, XCircle } from "lucide-react";

import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WordCard = {
  english: string;
  german: string;
  article: string;
  pronunciation: string;
  example: string;
  choices: string[];
};

type AnswerState = "idle" | "correct" | "wrong";

const bestScoreKey = "usverse:german-word-sprint:best-score";

const wordDeck: WordCard[] = [
  {
    english: "apple",
    german: "Apfel",
    article: "der",
    pronunciation: "AHP-fel",
    example: "Der Apfel ist rot.",
    choices: ["Apfel", "Milch", "Fenster", "Tasche"],
  },
  {
    english: "water",
    german: "Wasser",
    article: "das",
    pronunciation: "VAH-ser",
    example: "Das Wasser ist kalt.",
    choices: ["Wasser", "Schule", "Brot", "Hund"],
  },
  {
    english: "friend",
    german: "Freund",
    article: "der",
    pronunciation: "froynt",
    example: "Mein Freund lernt Deutsch.",
    choices: ["Freund", "Lampe", "Katze", "Uhr"],
  },
  {
    english: "book",
    german: "Buch",
    article: "das",
    pronunciation: "bookh",
    example: "Das Buch liegt hier.",
    choices: ["Buch", "Sonne", "Kaffee", "Tür"],
  },
  {
    english: "flower",
    german: "Blume",
    article: "die",
    pronunciation: "BLOO-meh",
    example: "Die Blume ist schön.",
    choices: ["Blume", "Auto", "Maus", "Tisch"],
  },
  {
    english: "house",
    german: "Haus",
    article: "das",
    pronunciation: "hows",
    example: "Das Haus ist klein.",
    choices: ["Haus", "Käse", "Regen", "Stuhl"],
  },
  {
    english: "moon",
    german: "Mond",
    article: "der",
    pronunciation: "mohnt",
    example: "Der Mond scheint hell.",
    choices: ["Mond", "Zug", "Bett", "Saft"],
  },
  {
    english: "love",
    german: "Liebe",
    article: "die",
    pronunciation: "LEE-beh",
    example: "Die Liebe ist weich.",
    choices: ["Liebe", "Straße", "Fisch", "Wolke"],
  },
];

function createRoundIndex(currentIndex: number) {
  return (currentIndex + 1) % wordDeck.length;
}

export function GermanWordSprint() {
  const [cardIndex, setCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const card = wordDeck[cardIndex];
  const progress = useMemo(
    () => Math.round(((cardIndex + 1) / wordDeck.length) * 100),
    [cardIndex],
  );

  useEffect(() => {
    const storedBestScore = window.localStorage.getItem(bestScoreKey);

    if (storedBestScore) {
      setBestScore(Number(storedBestScore));
    }
  }, []);

  function chooseAnswer(choice: string) {
    if (answerState !== "idle") {
      return;
    }

    const correct = choice === card.german;
    const nextScore = correct ? score + 10 + streak * 2 : score;
    const nextStreak = correct ? streak + 1 : 0;

    setSelectedChoice(choice);
    setAnswerState(correct ? "correct" : "wrong");
    setScore(nextScore);
    setStreak(nextStreak);

    if (nextScore > bestScore) {
      setBestScore(nextScore);
      window.localStorage.setItem(bestScoreKey, String(nextScore));
    }
  }

  function nextWord() {
    setCardIndex((currentIndex) => createRoundIndex(currentIndex));
    setSelectedChoice(null);
    setAnswerState("idle");
  }

  function restartGame() {
    setCardIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedChoice(null);
    setAnswerState("idle");
  }

  return (
    <FrostCard className="overflow-hidden">
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
                German Game
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Deutsch Sprint
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-foreground/70">
                Pick the German word, learn the article, and chase a cozy streak.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-foreground/70">
              <StatPill label="Score" value={String(score)} />
              <StatPill label="Streak" value={`${streak}x`} />
              <StatPill label="Best" value={String(bestScore)} />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/75 bg-white/58 p-4 shadow-sm">
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-rose-100">
              <div
                className="h-full rounded-full bg-rose-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-50 via-white to-teal-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">
                Translate this
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                {card.english}
              </p>
              <p className="mt-2 text-sm text-foreground/60">
                Which German word matches it?
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {card.choices.map((choice) => {
                const chosen = selectedChoice === choice;
                const correctChoice = choice === card.german;
                const revealed = answerState !== "idle";

                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={revealed}
                    onClick={() => chooseAnswer(choice)}
                    className={cn(
                      "rounded-[1.35rem] border border-white/80 bg-white/75 px-4 py-3 text-left text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white disabled:cursor-default disabled:hover:translate-y-0",
                      revealed &&
                        correctChoice &&
                        "border-emerald-200 bg-emerald-50 text-emerald-700",
                      revealed &&
                        chosen &&
                        !correctChoice &&
                        "border-rose-200 bg-rose-50 text-rose-600",
                    )}
                  >
                    <span className="flex items-center justify-between gap-3">
                      {choice}
                      {revealed && correctChoice ? (
                        <CheckCircle2 className="size-4" />
                      ) : null}
                      {revealed && chosen && !correctChoice ? (
                        <XCircle className="size-4" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-[1.8rem] border border-white/75 bg-white/55 p-5">
          <div className="space-y-4">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400">
                Learn Card
              </p>
              <h3 className="mt-2 text-2xl font-semibold">
                {card.article} {card.german}
              </h3>
              <p className="mt-2 text-sm text-foreground/65">
                Sounds like: {card.pronunciation}
              </p>
            </div>

            <div className="rounded-[1.4rem] bg-white/70 p-4 text-sm leading-6 text-foreground/72">
              <p className="font-semibold text-foreground">Example</p>
              <p>{card.example}</p>
            </div>

            <div className="rounded-[1.4rem] bg-rose-50/80 p-4 text-sm leading-6 text-foreground/72">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Heart className="size-4 text-rose-400" />
                Tiny rule
              </p>
              <p>
                Learn nouns with their article: der, die, or das. It makes German
                much easier later.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="rounded-full" onClick={restartGame}>
              <RotateCcw className="size-4" />
              Restart
            </Button>
            <Button
              className="rounded-full"
              disabled={answerState === "idle"}
              onClick={nextWord}
            >
              Next word
            </Button>
          </div>
        </div>
      </div>
    </FrostCard>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-white/70 px-3 py-2">
      <span className="text-xs uppercase tracking-[0.16em] text-foreground/45">
        {label}
      </span>
      <span className="ml-2 font-semibold text-foreground">{value}</span>
    </div>
  );
}
