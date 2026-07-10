"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Gamepad2,
  Heart,
  LoaderCircle,
  RefreshCcw,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { hasSupabaseConfig } from "@/lib/env";
import { formatTimestamp } from "@/lib/formatters";
import { createGameSession } from "@/services/game-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { Json, Tables } from "@/types/database";

type ArcadeGameType = "spin_the_wheel" | "emoji_guessing" | "partner_quiz";
type ArcadePhase = "idle" | "playing" | "over" | "won";

interface ArcadeRunState {
  score: number;
  label?: string;
  durationMs?: number;
  catches?: number;
  misses?: number;
  popped?: number;
  combo?: number;
  matchedPairs?: number;
  moves?: number;
}

interface ArcadeRun {
  id: string;
  gameType: ArcadeGameType;
  score: number;
  label: string;
  prompt: string;
  playerId: string;
  playerName: string;
  createdAt: string;
}

const arcadeGameMeta: Record<
  ArcadeGameType,
  {
    title: string;
    icon: string;
    description: string;
    chipClassName: string;
    panelClassName: string;
    boardClassName: string;
  }
> = {
  spin_the_wheel: {
    title: "Peach Catch",
    icon: "\u{1F351}",
    description: "Move the catcher, grab the peaches, and dodge storm clouds.",
    chipClassName: "bg-rose-100 text-rose-700",
    panelClassName: "from-rose-100/90 via-orange-50/90 to-white",
    boardClassName: "from-rose-100 via-orange-50 to-amber-50",
  },
  emoji_guessing: {
    title: "Bubble Pop",
    icon: "\u{1FAE7}",
    description: "Tap the floating bubbles before they drift away and break your combo.",
    chipClassName: "bg-sky-100 text-sky-700",
    panelClassName: "from-sky-100/90 via-cyan-50/90 to-white",
    boardClassName: "from-sky-100 via-cyan-50 to-white",
  },
  partner_quiz: {
    title: "Memory Match",
    icon: "\u{1F49E}",
    description: "Flip the cards, match the cute pairs, and finish with the fewest moves.",
    chipClassName: "bg-amber-100 text-amber-700",
    panelClassName: "from-amber-100/90 via-rose-50/90 to-white",
    boardClassName: "from-amber-50 via-rose-50 to-white",
  },
};

const arcadeGameOrder: ArcadeGameType[] = [
  "spin_the_wheel",
  "emoji_guessing",
  "partner_quiz",
];

const peachCatchDurationMs = 22000;
const peachCatchTickMs = 280;
const peachCatchLaneCount = 5;
const peachCatchRowCount = 6;

const bubblePopDurationMs = 18000;
const bubblePopTickMs = 220;

const memorySymbols = [
  "\u{1F338}",
  "\u{1F36A}",
  "\u{1F31F}",
  "\u{1F9F8}",
  "\u{1F9C1}",
  "\u{1F370}",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shuffle<T>(items: readonly T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }

  return next;
}

function readArcadeState(value: Tables<"game_sessions">["state"]): ArcadeRunState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const state = value as Record<string, Json | undefined>;

  return typeof state.score === "number"
    ? {
        score: Math.round(state.score),
        label: typeof state.label === "string" ? state.label : undefined,
        durationMs:
          typeof state.durationMs === "number" ? Math.round(state.durationMs) : undefined,
        catches: typeof state.catches === "number" ? Math.round(state.catches) : undefined,
        misses: typeof state.misses === "number" ? Math.round(state.misses) : undefined,
        popped: typeof state.popped === "number" ? Math.round(state.popped) : undefined,
        combo: typeof state.combo === "number" ? Math.round(state.combo) : undefined,
        matchedPairs:
          typeof state.matchedPairs === "number" ? Math.round(state.matchedPairs) : undefined,
        moves: typeof state.moves === "number" ? Math.round(state.moves) : undefined,
      }
    : null;
}

function buildMemberLookup(profile: Tables<"profiles">, members: Tables<"profiles">[]) {
  const lookup = new Map<string, Tables<"profiles">>();

  for (const member of [profile, ...members]) {
    lookup.set(member.id, member);
  }

  return lookup;
}

function createMemoryDeck() {
  return shuffle(
    memorySymbols.flatMap((symbol, pairIndex) => [
      { id: `${pairIndex}-a`, symbol, matched: false },
      { id: `${pairIndex}-b`, symbol, matched: false },
    ]),
  );
}

function formatDuration(durationMs: number) {
  return `${Math.max(1, Math.round(durationMs / 1000))}s`;
}

export function GamesHub({
  coupleId,
  members,
  profile,
  gameSessions,
}: {
  coupleId: string | null;
  members: Tables<"profiles">[];
  profile: Tables<"profiles">;
  gameSessions: Tables<"game_sessions">[];
}) {
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const addPreviewGameSession = useDemoStore((state) => state.addGameSession);
  const [savingGame, setSavingGame] = useState<ArcadeGameType | null>(null);
  const memberLookup = useMemo(() => buildMemberLookup(profile, members), [members, profile]);

  const scoredRuns = useMemo(() => {
    const runs: ArcadeRun[] = [];

    for (const session of gameSessions) {
      if (!arcadeGameOrder.includes(session.game_type as ArcadeGameType)) {
        continue;
      }

      const parsedState = readArcadeState(session.state);

      if (!parsedState) {
        continue;
      }

      const playerId = session.winner_id ?? session.created_by;
      const player = memberLookup.get(playerId);

      runs.push({
        id: session.id,
        gameType: session.game_type as ArcadeGameType,
        score: parsedState.score,
        label: parsedState.label ?? arcadeGameMeta[session.game_type as ArcadeGameType].title,
        prompt: session.prompt,
        playerId,
        playerName: playerId === profile.id ? "You" : player?.nickname ?? "Someone",
        createdAt: session.completed_at ?? session.created_at,
      });
    }

    return runs.sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [gameSessions, memberLookup, profile.id]);

  const bestByGame = useMemo(() => {
    const next = new Map<ArcadeGameType, ArcadeRun>();

    for (const run of scoredRuns) {
      if (!next.has(run.gameType)) {
        next.set(run.gameType, run);
      }
    }

    return next;
  }, [scoredRuns]);

  const memberBestByGame = useMemo(() => {
    const next = new Map<ArcadeGameType, ArcadeRun>();

    for (const run of scoredRuns) {
      if (run.playerId !== profile.id || next.has(run.gameType)) {
        continue;
      }

      next.set(run.gameType, run);
    }

    return next;
  }, [profile.id, scoredRuns]);

  const recentRuns = useMemo(
    () =>
      [...scoredRuns].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [scoredRuns],
  );

  async function recordRun(input: {
    gameType: ArcadeGameType;
    summary: string;
    state: ArcadeRunState;
  }) {
    if (!coupleId) {
      return;
    }

    setSavingGame(input.gameType);

    try {
      if (isPreview) {
        addPreviewGameSession(
          input.gameType,
          input.summary,
          {
            ...input.state,
            label: arcadeGameMeta[input.gameType].title,
          } satisfies Json,
          profile.id,
        );
        return;
      }

      if (!supabase) {
        toast.error("Supabase client unavailable.");
        return;
      }

      const { error } = await createGameSession(supabase, {
        coupleId,
        userId: profile.id,
        gameType: input.gameType,
        prompt: input.summary,
        state: {
          ...input.state,
          label: arcadeGameMeta[input.gameType].title,
        } satisfies Json,
        winnerId: profile.id,
      });

      if (error) {
        toast.error(toErrorMessage(error));
      }
    } finally {
      setSavingGame(null);
    }
  }

  return (
    <FrostCard className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
          Mini Games
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Real little games with scores worth chasing
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-foreground/70">
          Play something quick, chase a new best score, and let the shared space keep
          the cutest bragging rights.
        </p>
      </div>

      {!coupleId ? (
        <div className="rounded-[1.4rem] border border-dashed border-rose-200/80 bg-white/60 px-4 py-3 text-sm text-foreground/68">
          You can still play solo here. Connect your space if you want the scores saved.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <PeachCatchCard
          saving={savingGame === "spin_the_wheel"}
          memberBest={memberBestByGame.get("spin_the_wheel")?.score ?? null}
          overallBest={bestByGame.get("spin_the_wheel") ?? null}
          onComplete={(result) =>
            recordRun({
              gameType: "spin_the_wheel",
              summary: `Caught ${result.catches ?? 0} peaches in ${formatDuration(result.durationMs ?? 0)}`,
              state: result,
            })
          }
        />
        <BubblePopCard
          saving={savingGame === "emoji_guessing"}
          memberBest={memberBestByGame.get("emoji_guessing")?.score ?? null}
          overallBest={bestByGame.get("emoji_guessing") ?? null}
          onComplete={(result) =>
            recordRun({
              gameType: "emoji_guessing",
              summary: `Popped ${result.popped ?? 0} bubbles with a ${(result.combo ?? 0)}x combo`,
              state: result,
            })
          }
        />
        <MemoryMatchCard
          saving={savingGame === "partner_quiz"}
          memberBest={memberBestByGame.get("partner_quiz")?.score ?? null}
          overallBest={bestByGame.get("partner_quiz") ?? null}
          onComplete={(result) =>
            recordRun({
              gameType: "partner_quiz",
              summary: `Matched ${result.matchedPairs ?? 0} pairs in ${result.moves ?? 0} moves`,
              state: result,
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.6rem] border border-white/75 bg-white/68 p-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-500" />
            <p className="font-semibold">Best scores</p>
          </div>
          <div className="mt-4 space-y-3">
            {arcadeGameOrder.map((gameType) => {
              const meta = arcadeGameMeta[gameType];
              const topRun = bestByGame.get(gameType) ?? null;
              const memberRun = memberBestByGame.get(gameType) ?? null;

              return (
                <div
                  key={gameType}
                  className="rounded-[1.3rem] border border-white/80 bg-white/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        <span className="mr-2">{meta.icon}</span>
                        {meta.title}
                      </p>
                      <p className="mt-1 text-sm text-foreground/64">
                        {topRun
                          ? `${topRun.playerName} leads with ${topRun.score}`
                          : "No score locked in yet"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.chipClassName}`}
                    >
                      {memberRun ? `your best ${memberRun.score}` : "play me"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {recentRuns.length ? (
          <div className="rounded-[1.6rem] border border-white/75 bg-white/68 p-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="size-4 text-rose-500" />
              <p className="font-semibold">Recent runs</p>
            </div>
            <div className="mt-4 space-y-3">
              {recentRuns.slice(0, 6).map((run) => (
                <div
                  key={run.id}
                  className="rounded-[1.3rem] border border-white/80 bg-white/80 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        <span className="mr-2">{arcadeGameMeta[run.gameType].icon}</span>
                        {run.label}
                      </p>
                      <p className="mt-1 text-sm text-foreground/68">{run.prompt}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">{run.score}</p>
                      <p className="text-foreground/56">{run.playerName}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-foreground/52">
                    {formatTimestamp(run.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No scores yet"
            description="Finish a round and the high-score wall will start filling up."
          />
        )}
      </div>
    </FrostCard>
  );
}

function GameCardShell({
  gameType,
  saving,
  memberBest,
  overallBest,
  children,
}: {
  gameType: ArcadeGameType;
  saving: boolean;
  memberBest: number | null;
  overallBest: ArcadeRun | null;
  children: React.ReactNode;
}) {
  const meta = arcadeGameMeta[gameType];

  return (
    <div
      className={`rounded-[1.8rem] border border-white/80 bg-gradient-to-br p-4 shadow-[0_18px_36px_rgba(255,194,194,0.12)] ${meta.panelClassName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-semibold">
            <span className="mr-2">{meta.icon}</span>
            {meta.title}
          </p>
          <p className="text-sm leading-6 text-foreground/68">{meta.description}</p>
        </div>
        {saving ? <LoaderCircle className="size-4 animate-spin text-foreground/60" /> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={`rounded-full px-3 py-1 font-semibold ${meta.chipClassName}`}>
          {memberBest !== null ? `your best ${memberBest}` : "fresh board"}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 font-semibold text-foreground/65">
          {overallBest ? `top ${overallBest.score} by ${overallBest.playerName}` : "no champ yet"}
        </span>
      </div>

      {children}
    </div>
  );
}

type PeachItem = {
  id: number;
  lane: number;
  row: number;
  kind: "peach" | "storm";
};

type PeachCatchState = {
  phase: ArcadePhase;
  basketLane: number;
  items: PeachItem[];
  score: number;
  lives: number;
  catches: number;
  misses: number;
  timeLeft: number;
  runId: number;
};

function createPeachCatchState(): PeachCatchState {
  return {
    phase: "idle",
    basketLane: 2,
    items: [],
    score: 0,
    lives: 3,
    catches: 0,
    misses: 0,
    timeLeft: peachCatchDurationMs,
    runId: 0,
  };
}

function PeachCatchCard({
  saving,
  memberBest,
  overallBest,
  onComplete,
}: {
  saving: boolean;
  memberBest: number | null;
  overallBest: ArcadeRun | null;
  onComplete: (result: ArcadeRunState) => Promise<void>;
}) {
  const [game, setGame] = useState<PeachCatchState>(createPeachCatchState);
  const nextItemId = useRef(1);
  const recordedRunId = useRef<number | null>(null);

  useEffect(() => {
    if (game.phase !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((current) => {
        if (current.phase !== "playing") {
          return current;
        }

        let nextScore = current.score;
        let nextLives = current.lives;
        let nextCatches = current.catches;
        let nextMisses = current.misses;
        const movedItems: PeachItem[] = [];

        for (const item of current.items) {
          const nextRow = item.row + 1;
          const caught = nextRow >= peachCatchRowCount - 0.8 && item.lane === current.basketLane;

          if (caught) {
            if (item.kind === "peach") {
              nextScore += 2;
              nextCatches += 1;
            } else {
              nextLives -= 1;
            }

            continue;
          }

          if (nextRow > peachCatchRowCount) {
            if (item.kind === "peach") {
              nextLives -= 1;
              nextMisses += 1;
            }

            continue;
          }

          movedItems.push({
            ...item,
            row: nextRow,
          });
        }

        if (Math.random() < 0.72) {
          movedItems.push({
            id: nextItemId.current,
            lane: Math.floor(Math.random() * peachCatchLaneCount),
            row: 0,
            kind: Math.random() < 0.82 ? "peach" : "storm",
          });
          nextItemId.current += 1;
        }

        const nextTimeLeft = Math.max(0, current.timeLeft - peachCatchTickMs);
        const nextPhase =
          nextTimeLeft <= 0 || nextLives <= 0 ? "over" : ("playing" satisfies ArcadePhase);

        return {
          ...current,
          phase: nextPhase,
          items: nextPhase === "over" ? [] : movedItems,
          score: nextScore,
          lives: nextLives,
          catches: nextCatches,
          misses: nextMisses,
          timeLeft: nextTimeLeft,
        };
      });
    }, peachCatchTickMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [game.phase]);

  useEffect(() => {
    if (game.phase !== "playing") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        setGame((current) => ({
          ...current,
          basketLane: clamp(current.basketLane - 1, 0, peachCatchLaneCount - 1),
        }));
      }

      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        event.preventDefault();
        setGame((current) => ({
          ...current,
          basketLane: clamp(current.basketLane + 1, 0, peachCatchLaneCount - 1),
        }));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [game.phase]);

  useEffect(() => {
    if (game.phase !== "over" || !game.runId || recordedRunId.current === game.runId) {
      return;
    }

    recordedRunId.current = game.runId;

    void onComplete({
      score: game.score,
      catches: game.catches,
      misses: game.misses,
      durationMs: peachCatchDurationMs - game.timeLeft,
    });
  }, [game, onComplete]);

  function startGame() {
    const runId = Date.now();
    recordedRunId.current = null;
    nextItemId.current = 1;
    setGame({
      phase: "playing",
      basketLane: 2,
      items: [],
      score: 0,
      lives: 3,
      catches: 0,
      misses: 0,
      timeLeft: peachCatchDurationMs,
      runId,
    });
  }

  return (
    <GameCardShell
      gameType="spin_the_wheel"
      saving={saving}
      memberBest={memberBest}
      overallBest={overallBest}
    >
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <StatPill label="Score" value={String(game.score)} />
        <StatPill label="Lives" value={String(game.lives)} />
        <StatPill label="Time" value={formatDuration(game.timeLeft)} />
      </div>

      <div
        className={`relative mt-4 h-56 overflow-hidden rounded-[1.6rem] border border-white/80 bg-gradient-to-b ${arcadeGameMeta.spin_the_wheel.boardClassName}`}
      >
        <div className="grid h-full grid-cols-5">
          {Array.from({ length: peachCatchLaneCount }, (_, laneIndex) => (
            <div
              key={laneIndex}
              className="border-r border-white/45 last:border-r-0"
            />
          ))}
        </div>

        {game.items.map((item) => (
          <div
            key={item.id}
            className="absolute text-2xl"
            style={{
              left: `${((item.lane + 0.5) / peachCatchLaneCount) * 100}%`,
              top: `${12 + (item.row / peachCatchRowCount) * 76}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {item.kind === "peach" ? "\u{1F351}" : "\u{2601}"}
          </div>
        ))}

        <div
          className="absolute bottom-3 flex h-10 w-14 items-center justify-center rounded-[1.2rem] bg-foreground text-xs font-semibold text-background shadow-lg"
          style={{
            left: `${((game.basketLane + 0.5) / peachCatchLaneCount) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          catch
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          className="rounded-full"
          disabled={game.phase !== "playing"}
          onClick={() =>
            setGame((current) => ({
              ...current,
              basketLane: clamp(current.basketLane - 1, 0, peachCatchLaneCount - 1),
            }))
          }
        >
          Left
        </Button>
        <Button
          variant="secondary"
          className="rounded-full"
          disabled={game.phase !== "playing"}
          onClick={() =>
            setGame((current) => ({
              ...current,
              basketLane: clamp(current.basketLane + 1, 0, peachCatchLaneCount - 1),
            }))
          }
        >
          Right
        </Button>
        <Button className="ml-auto rounded-full" onClick={startGame}>
          {game.phase === "playing" ? "Restart" : game.runId ? "Play again" : "Start round"}
        </Button>
      </div>

      <p className="mt-3 text-sm text-foreground/62">
        Use the buttons or arrow keys. Catch peaches for 2 points and avoid the clouds.
      </p>
    </GameCardShell>
  );
}

type Bubble = {
  id: number;
  x: number;
  y: number;
  size: number;
  ttl: number;
  value: number;
  kind: "pearl" | "gold";
};

type BubblePopState = {
  phase: ArcadePhase;
  bubbles: Bubble[];
  score: number;
  combo: number;
  bestCombo: number;
  popped: number;
  timeLeft: number;
  runId: number;
};

function createBubblePopState(): BubblePopState {
  return {
    phase: "idle",
    bubbles: [],
    score: 0,
    combo: 0,
    bestCombo: 0,
    popped: 0,
    timeLeft: bubblePopDurationMs,
    runId: 0,
  };
}

function BubblePopCard({
  saving,
  memberBest,
  overallBest,
  onComplete,
}: {
  saving: boolean;
  memberBest: number | null;
  overallBest: ArcadeRun | null;
  onComplete: (result: ArcadeRunState) => Promise<void>;
}) {
  const [game, setGame] = useState<BubblePopState>(createBubblePopState);
  const nextBubbleId = useRef(1);
  const recordedRunId = useRef<number | null>(null);

  useEffect(() => {
    if (game.phase !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((current) => {
        if (current.phase !== "playing") {
          return current;
        }

        let comboBroke = false;
        const nextBubbles = current.bubbles
          .map((bubble) => ({
            ...bubble,
            ttl: bubble.ttl - bubblePopTickMs,
          }))
          .filter((bubble) => {
            if (bubble.ttl <= 0) {
              comboBroke = true;
              return false;
            }

            return true;
          });

        if (nextBubbles.length < 7 && Math.random() < 0.68) {
          nextBubbles.push({
            id: nextBubbleId.current,
            x: 12 + Math.random() * 74,
            y: 12 + Math.random() * 66,
            size: 50 + Math.random() * 22,
            ttl: 1200 + Math.random() * 1400,
            value: Math.random() < 0.18 ? 3 : 1,
            kind: Math.random() < 0.18 ? "gold" : "pearl",
          });
          nextBubbleId.current += 1;
        }

        const nextTimeLeft = Math.max(0, current.timeLeft - bubblePopTickMs);
        const nextPhase =
          nextTimeLeft <= 0 ? "over" : ("playing" satisfies ArcadePhase);

        return {
          ...current,
          phase: nextPhase,
          bubbles: nextPhase === "over" ? [] : nextBubbles,
          combo: comboBroke ? 0 : current.combo,
          timeLeft: nextTimeLeft,
        };
      });
    }, bubblePopTickMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [game.phase]);

  useEffect(() => {
    if (game.phase !== "over" || !game.runId || recordedRunId.current === game.runId) {
      return;
    }

    recordedRunId.current = game.runId;

    void onComplete({
      score: game.score,
      popped: game.popped,
      combo: game.bestCombo,
      durationMs: bubblePopDurationMs - game.timeLeft,
    });
  }, [game, onComplete]);

  function startGame() {
    recordedRunId.current = null;
    nextBubbleId.current = 1;
    setGame({
      phase: "playing",
      bubbles: [],
      score: 0,
      combo: 0,
      bestCombo: 0,
      popped: 0,
      timeLeft: bubblePopDurationMs,
      runId: Date.now(),
    });
  }

  function popBubble(bubbleId: number) {
    setGame((current) => {
      if (current.phase !== "playing") {
        return current;
      }

      const bubble = current.bubbles.find((item) => item.id === bubbleId);

      if (!bubble) {
        return current;
      }

      const nextCombo = current.combo + 1;
      const bonus = Math.min(current.combo, 4);

      return {
        ...current,
        bubbles: current.bubbles.filter((item) => item.id !== bubbleId),
        combo: nextCombo,
        bestCombo: Math.max(current.bestCombo, nextCombo),
        popped: current.popped + 1,
        score: current.score + bubble.value + bonus,
      };
    });
  }

  return (
    <GameCardShell
      gameType="emoji_guessing"
      saving={saving}
      memberBest={memberBest}
      overallBest={overallBest}
    >
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <StatPill label="Score" value={String(game.score)} />
        <StatPill label="Combo" value={`${game.combo}x`} />
        <StatPill label="Time" value={formatDuration(game.timeLeft)} />
      </div>

      <div
        className={`relative mt-4 h-56 overflow-hidden rounded-[1.6rem] border border-white/80 bg-gradient-to-b ${arcadeGameMeta.emoji_guessing.boardClassName}`}
      >
        {game.bubbles.map((bubble) => (
          <button
            key={bubble.id}
            type="button"
            onClick={() => popBubble(bubble.id)}
            className={`absolute flex items-center justify-center rounded-full border border-white/80 font-semibold text-white shadow-lg transition active:scale-95 ${
              bubble.kind === "gold"
                ? "bg-amber-400/90"
                : "bg-sky-400/85"
            }`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size,
              transform: "translate(-50%, -50%)",
            }}
          >
            {bubble.kind === "gold" ? "+3" : "+1"}
          </button>
        ))}

        {game.phase !== "playing" ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-[1.4rem] bg-white/78 px-5 py-4 text-center shadow-lg">
              <p className="font-semibold">
                {game.runId ? `Last score ${game.score}` : "Ready to pop"}
              </p>
              <p className="mt-1 text-sm text-foreground/64">
                Build combos by tapping bubbles before they vanish.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button className="rounded-full" onClick={startGame}>
          {game.phase === "playing" ? "Restart" : game.runId ? "Play again" : "Start burst"}
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() =>
            setGame((current) => ({
              ...current,
              bubbles: [],
              combo: 0,
            }))
          }
          disabled={game.phase !== "playing"}
        >
          <RefreshCcw className="size-4" />
        </Button>
        <p className="ml-auto text-sm text-foreground/62">
          Golden bubbles are worth extra.
        </p>
      </div>
    </GameCardShell>
  );
}

type MemoryCard = {
  id: string;
  symbol: string;
  matched: boolean;
};

type MemoryMatchState = {
  phase: ArcadePhase;
  cards: MemoryCard[];
  flippedIds: string[];
  moves: number;
  matchedPairs: number;
  timeLeft: number;
  runId: number;
  resolving: boolean;
};

function createMemoryMatchState(): MemoryMatchState {
  return {
    phase: "idle",
    cards: createMemoryDeck(),
    flippedIds: [],
    moves: 0,
    matchedPairs: 0,
    timeLeft: 45000,
    runId: 0,
    resolving: false,
  };
}

function calculateMemoryScore(input: {
  matchedPairs: number;
  moves: number;
  timeLeft: number;
  won: boolean;
}) {
  const timeBonus = Math.floor(input.timeLeft / 1000) * 3;
  const baseScore = input.won ? input.matchedPairs * 24 : input.matchedPairs * 12;

  return Math.max(0, baseScore + timeBonus - input.moves);
}

function MemoryMatchCard({
  saving,
  memberBest,
  overallBest,
  onComplete,
}: {
  saving: boolean;
  memberBest: number | null;
  overallBest: ArcadeRun | null;
  onComplete: (result: ArcadeRunState) => Promise<void>;
}) {
  const [game, setGame] = useState<MemoryMatchState>(createMemoryMatchState);
  const resetTimeout = useRef<number | null>(null);
  const recordedRunId = useRef<number | null>(null);

  useEffect(() => {
    if (game.phase !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      setGame((current) => {
        if (current.phase !== "playing") {
          return current;
        }

        const nextTimeLeft = Math.max(0, current.timeLeft - 1000);

        return {
          ...current,
          phase: nextTimeLeft <= 0 ? "over" : current.phase,
          timeLeft: nextTimeLeft,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [game.phase]);

  useEffect(() => {
    return () => {
      if (resetTimeout.current) {
        window.clearTimeout(resetTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      (game.phase !== "over" && game.phase !== "won") ||
      !game.runId ||
      recordedRunId.current === game.runId
    ) {
      return;
    }

    recordedRunId.current = game.runId;

    void onComplete({
      score: calculateMemoryScore({
        matchedPairs: game.matchedPairs,
        moves: game.moves,
        timeLeft: game.timeLeft,
        won: game.phase === "won",
      }),
      matchedPairs: game.matchedPairs,
      moves: game.moves,
      durationMs: 45000 - game.timeLeft,
    });
  }, [game, onComplete]);

  function startGame() {
    if (resetTimeout.current) {
      window.clearTimeout(resetTimeout.current);
      resetTimeout.current = null;
    }

    recordedRunId.current = null;
    setGame({
      phase: "playing",
      cards: createMemoryDeck(),
      flippedIds: [],
      moves: 0,
      matchedPairs: 0,
      timeLeft: 45000,
      runId: Date.now(),
      resolving: false,
    });
  }

  function flipCard(cardId: string) {
    setGame((current) => {
      if (current.phase !== "playing" || current.resolving) {
        return current;
      }

      const card = current.cards.find((item) => item.id === cardId);

      if (!card || card.matched || current.flippedIds.includes(cardId)) {
        return current;
      }

      const nextFlippedIds = [...current.flippedIds, cardId];

      if (nextFlippedIds.length < 2) {
        return {
          ...current,
          flippedIds: nextFlippedIds,
        };
      }

      const [firstId, secondId] = nextFlippedIds;
      const firstCard = current.cards.find((item) => item.id === firstId);
      const secondCard = current.cards.find((item) => item.id === secondId);
      const nextMoves = current.moves + 1;

      if (firstCard && secondCard && firstCard.symbol === secondCard.symbol) {
        const nextMatchedPairs = current.matchedPairs + 1;
        const nextCards = current.cards.map((item) =>
          item.id === firstId || item.id === secondId
            ? { ...item, matched: true }
            : item,
        );

        return {
          ...current,
          cards: nextCards,
          flippedIds: [],
          moves: nextMoves,
          matchedPairs: nextMatchedPairs,
          phase: nextMatchedPairs === memorySymbols.length ? "won" : current.phase,
        };
      }

      resetTimeout.current = window.setTimeout(() => {
        setGame((latest) => ({
          ...latest,
          flippedIds: [],
          resolving: false,
        }));
      }, 720);

      return {
        ...current,
        flippedIds: nextFlippedIds,
        moves: nextMoves,
        resolving: true,
      };
    });
  }

  const liveScore = calculateMemoryScore({
    matchedPairs: game.matchedPairs,
    moves: game.moves,
    timeLeft: game.timeLeft,
    won: game.phase === "won",
  });

  return (
    <GameCardShell
      gameType="partner_quiz"
      saving={saving}
      memberBest={memberBest}
      overallBest={overallBest}
    >
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <StatPill label="Score" value={String(liveScore)} />
        <StatPill label="Moves" value={String(game.moves)} />
        <StatPill label="Time" value={formatDuration(game.timeLeft)} />
      </div>

      <div
        className={`mt-4 rounded-[1.6rem] border border-white/80 bg-gradient-to-b p-3 ${arcadeGameMeta.partner_quiz.boardClassName}`}
      >
        <div className="grid grid-cols-4 gap-2">
          {game.cards.map((card) => {
            const revealed =
              card.matched || game.flippedIds.includes(card.id) || game.phase === "won";

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => flipCard(card.id)}
                disabled={game.phase !== "playing" || revealed}
                className={`flex aspect-square items-center justify-center rounded-[1.1rem] border text-2xl transition ${
                  revealed
                    ? "border-white/80 bg-white/90"
                    : "border-white/60 bg-white/55 text-transparent"
                } ${card.matched ? "shadow-[0_10px_24px_rgba(255,187,128,0.22)]" : ""}`}
              >
                {revealed ? card.symbol : "\u{2726}"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button className="rounded-full" onClick={startGame}>
          {game.phase === "playing" ? "Restart" : game.runId ? "New deck" : "Start match"}
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-foreground/62">
          <Heart className="size-4 text-rose-500" />
          {game.phase === "won"
            ? "Deck cleared"
            : `${game.matchedPairs}/${memorySymbols.length} pairs matched`}
        </div>
      </div>
    </GameCardShell>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-foreground/70">
      {label}: {value}
    </div>
  );
}
