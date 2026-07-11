"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Heart,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WordCard = {
  id: string;
  english: string;
  german: string;
  article: string;
  example: string;
};

type AnswerState = "idle" | "correct" | "wrong";

type DailyProgress = {
  date: string;
  completedWordIds: string[];
  correctWordIds: string[];
};

const dailyTarget = 10;
const bestScoreKey = "usverse:german-word-sprint:best-score";
const dailyProgressKey = "usverse:german-word-sprint:daily-progress";
const vocabularySource = "OCR GCSE German vocabulary list";

const wordBank: WordCard[] = [
  word("apple", "der", "Apfel", "Der Apfel ist rot."),
  word("water", "das", "Wasser", "Das Wasser ist kalt."),
  word("friend", "der", "Freund", "Mein Freund lernt Deutsch."),
  word("book", "das", "Buch", "Das Buch liegt hier."),
  word("flower", "die", "Blume", "Die Blume ist schön."),
  word("house", "das", "Haus", "Das Haus ist klein."),
  word("moon", "der", "Mond", "Der Mond scheint hell."),
  word("love", "die", "Liebe", "Die Liebe ist weich."),
  word("bread", "das", "Brot", "Das Brot ist frisch."),
  word("milk", "die", "Milch", "Die Milch steht im Kühlschrank."),
  word("coffee", "der", "Kaffee", "Der Kaffee ist warm."),
  word("tea", "der", "Tee", "Der Tee schmeckt gut."),
  word("cheese", "der", "Käse", "Der Käse ist lecker."),
  word("egg", "das", "Ei", "Das Ei ist gekocht."),
  word("dog", "der", "Hund", "Der Hund spielt draußen."),
  word("cat", "die", "Katze", "Die Katze schläft."),
  word("bird", "der", "Vogel", "Der Vogel singt."),
  word("fish", "der", "Fisch", "Der Fisch schwimmt."),
  word("table", "der", "Tisch", "Der Tisch ist rund."),
  word("chair", "der", "Stuhl", "Der Stuhl ist bequem."),
  word("door", "die", "Tür", "Die Tür ist offen."),
  word("window", "das", "Fenster", "Das Fenster ist groß."),
  word("bed", "das", "Bett", "Das Bett ist weich."),
  word("lamp", "die", "Lampe", "Die Lampe ist hell."),
  word("bag", "die", "Tasche", "Die Tasche ist blau."),
  word("phone", "das", "Handy", "Das Handy klingelt."),
  word("key", "der", "Schlüssel", "Der Schlüssel liegt hier."),
  word("car", "das", "Auto", "Das Auto ist schnell."),
  word("train", "der", "Zug", "Der Zug kommt spät."),
  word("bike", "das", "Fahrrad", "Das Fahrrad ist neu."),
  word("street", "die", "Straße", "Die Straße ist lang."),
  word("city", "die", "Stadt", "Die Stadt ist schön."),
  word("school", "die", "Schule", "Die Schule beginnt früh."),
  word("work", "die", "Arbeit", "Die Arbeit ist wichtig."),
  word("time", "die", "Zeit", "Die Zeit vergeht schnell."),
  word("day", "der", "Tag", "Der Tag ist sonnig."),
  word("night", "die", "Nacht", "Die Nacht ist ruhig."),
  word("morning", "der", "Morgen", "Der Morgen ist frisch."),
  word("evening", "der", "Abend", "Der Abend ist gemütlich."),
  word("sun", "die", "Sonne", "Die Sonne scheint."),
  word("rain", "der", "Regen", "Der Regen ist kalt."),
  word("snow", "der", "Schnee", "Der Schnee ist weiß."),
  word("cloud", "die", "Wolke", "Die Wolke ist grau."),
  word("heart", "das", "Herz", "Das Herz ist stark."),
  word("family", "die", "Familie", "Die Familie isst zusammen."),
  word("mother", "die", "Mutter", "Die Mutter lacht."),
  word("father", "der", "Vater", "Der Vater kocht."),
  word("sister", "die", "Schwester", "Die Schwester liest."),
  word("brother", "der", "Bruder", "Der Bruder rennt."),
  word("child", "das", "Kind", "Das Kind malt."),
  word("name", "der", "Name", "Der Name ist kurz."),
  word("question", "die", "Frage", "Die Frage ist einfach."),
  word("answer", "die", "Antwort", "Die Antwort ist richtig."),
  word("language", "die", "Sprache", "Die Sprache klingt schön."),
  word("word", "das", "Wort", "Das Wort ist neu."),
  word("food", "das", "Essen", "Das Essen ist fertig."),
  word("breakfast", "das", "Frühstück", "Das Frühstück ist klein."),
  word("dinner", "das", "Abendessen", "Das Abendessen ist warm."),
  word("kitchen", "die", "Küche", "Die Küche ist sauber."),
  word("room", "das", "Zimmer", "Das Zimmer ist hell."),
  word("bathroom", "das", "Bad", "Das Bad ist frei."),
  word("garden", "der", "Garten", "Der Garten ist grün."),
  word("music", "die", "Musik", "Die Musik ist laut."),
  word("song", "das", "Lied", "Das Lied ist schön."),
  word("movie", "der", "Film", "Der Film ist spannend."),
  word("game", "das", "Spiel", "Das Spiel macht Spaß."),
  word("joy", "die", "Freude", "Die Freude ist groß."),
  word("luck", "das", "Glück", "Das Glück kommt leise."),
  word("peace", "der", "Frieden", "Der Frieden ist wichtig."),
  word("dream", "der", "Traum", "Der Traum ist bunt."),
  word("star", "der", "Stern", "Der Stern leuchtet."),
  word("world", "die", "Welt", "Die Welt ist groß."),
  word("journey", "die", "Reise", "Die Reise beginnt."),
  word("map", "die", "Karte", "Die Karte liegt dort."),
  word("money", "das", "Geld", "Das Geld ist im Portemonnaie."),
  word("shop", "der", "Laden", "Der Laden ist offen."),
  word("price", "der", "Preis", "Der Preis ist niedrig."),
  word("color", "die", "Farbe", "Die Farbe ist rosa."),
  word("red", "", "rot", "Rot ist eine warme Farbe."),
  word("blue", "", "blau", "Blau ist ruhig."),
  word("green", "", "grün", "Grün passt zum Garten."),
  word("small", "", "klein", "Das Haus ist klein."),
  word("big", "", "groß", "Die Stadt ist groß."),
  word("beautiful", "", "schön", "Der Tag ist schön."),
  word("fast", "", "schnell", "Der Zug ist schnell."),
  word("slow", "", "langsam", "Die Musik ist langsam."),
];

function word(
  english: string,
  article: string,
  german: string,
  example: string,
): WordCard {
  return {
    id: german.toLowerCase(),
    english,
    article,
    german,
    example,
  };
}

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function createSeed(value: string) {
  let seed = 0;

  for (let index = 0; index < value.length; index += 1) {
    seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  }

  return seed || 1;
}

function seededRandom(seed: number) {
  let currentSeed = seed;

  return () => {
    currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
    return currentSeed / 4294967296;
  };
}

function shuffleWords(words: WordCard[], seed: number) {
  const random = seededRandom(seed);
  const shuffled = [...words];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const currentWord = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = currentWord;
  }

  return shuffled;
}

function createDailyDeck(todayKey: string) {
  const shuffled = shuffleWords(wordBank, createSeed(todayKey));
  const dailyWords = shuffled.slice(0, dailyTarget);
  const bonusWords = shuffled.slice(dailyTarget);

  return [...dailyWords, ...bonusWords];
}

function createChoices(card: WordCard, deck: WordCard[], todayKey: string) {
  const distractors = shuffleWords(
    deck.filter((wordItem) => wordItem.id !== card.id),
    createSeed(`${todayKey}-${card.id}`),
  )
    .slice(0, 3)
    .map((wordItem) => wordItem.german);

  return shuffleText([card.german, ...distractors], createSeed(`${card.id}-choices`));
}

function shuffleText(items: string[], seed: number) {
  const random = seededRandom(seed);
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const currentItem = shuffled[index];

    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = currentItem;
  }

  return shuffled;
}

function readDailyProgress(todayKey: string): DailyProgress {
  const fallback: DailyProgress = {
    date: todayKey,
    completedWordIds: [],
    correctWordIds: [],
  };

  try {
    const storedProgress = window.localStorage.getItem(dailyProgressKey);

    if (!storedProgress) {
      return fallback;
    }

    const parsedProgress = JSON.parse(storedProgress) as Partial<DailyProgress>;

    if (parsedProgress.date !== todayKey) {
      return fallback;
    }

    return {
      date: todayKey,
      completedWordIds: parsedProgress.completedWordIds ?? [],
      correctWordIds: parsedProgress.correctWordIds ?? [],
    };
  } catch {
    return fallback;
  }
}

function saveDailyProgress(progress: DailyProgress) {
  window.localStorage.setItem(dailyProgressKey, JSON.stringify(progress));
}

function createDudenUrl(germanWord: string) {
  return `https://www.duden.de/suchen/dudenonline/${encodeURIComponent(germanWord)}`;
}

export function GermanWordSprint() {
  const todayKey = useMemo(getTodayKey, []);
  const deck = useMemo(() => createDailyDeck(todayKey), [todayKey]);
  const dailyWordIds = useMemo(
    () => new Set(deck.slice(0, dailyTarget).map((dailyWord) => dailyWord.id)),
    [deck],
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({
    date: todayKey,
    completedWordIds: [],
    correctWordIds: [],
  });
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const card = deck[cardIndex % deck.length];
  const choices = useMemo(
    () => createChoices(card, deck, todayKey),
    [card, deck, todayKey],
  );
  const completedToday = dailyProgress.completedWordIds.length;
  const correctToday = dailyProgress.correctWordIds.length;
  const dailyComplete = completedToday >= dailyTarget;
  const progress = Math.min(100, Math.round((completedToday / dailyTarget) * 100));
  const isDailyWord = dailyWordIds.has(card.id);
  const dictionaryUrl = createDudenUrl(card.german);

  useEffect(() => {
    const storedBestScore = window.localStorage.getItem(bestScoreKey);

    if (storedBestScore) {
      setBestScore(Number(storedBestScore));
    }

    setDailyProgress(readDailyProgress(todayKey));
  }, [todayKey]);

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

    if (isDailyWord) {
      const nextProgress: DailyProgress = {
        date: todayKey,
        completedWordIds: Array.from(
          new Set([...dailyProgress.completedWordIds, card.id]),
        ),
        correctWordIds: correct
          ? Array.from(new Set([...dailyProgress.correctWordIds, card.id]))
          : dailyProgress.correctWordIds,
      };

      setDailyProgress(nextProgress);
      saveDailyProgress(nextProgress);
    }
  }

  function nextWord() {
    setCardIndex((currentIndex) => (currentIndex + 1) % deck.length);
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
                Practice 10 fresh words from your OCR GCSE vocabulary PDF. For
                pronunciation, use the Duden dictionary link instead of guessed
                sound-alike text.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-foreground/70">
              <StatPill label="Today" value={`${completedToday}/${dailyTarget}`} />
              <StatPill label="Score" value={String(score)} />
              <StatPill label="Streak" value={`${streak}x`} />
              <StatPill label="Best" value={String(bestScore)} />
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/75 bg-white/58 p-4 shadow-sm">
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
                <span>{todayKey}</span>
                <span>{dailyComplete ? "Daily goal done" : "10-word daily goal"}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-rose-100">
                <div
                  className="h-full rounded-full bg-rose-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-50 via-white to-teal-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-foreground/45">
                {isDailyWord ? "Today's word" : "Bonus practice"}
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                {card.english}
              </p>
              <p className="mt-2 text-sm text-foreground/60">
                Which German word matches it?
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {choices.map((choice) => {
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
                {[card.article, card.german].filter(Boolean).join(" ")}
              </h3>
              <a
                href={dictionaryUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-white"
              >
                Check spelling and pronunciation on Duden
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="rounded-[1.4rem] bg-white/70 p-4 text-sm leading-6 text-foreground/72">
              <p className="font-semibold text-foreground">Meaning</p>
              <p>{card.english}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-foreground/45">
                Source: {vocabularySource}
              </p>
            </div>

            <div className="rounded-[1.4rem] bg-rose-50/80 p-4 text-sm leading-6 text-foreground/72">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Heart className="size-4 text-rose-400" />
                Safer learning note
              </p>
              <p>
                The app avoids fake pronunciation spellings. Use Duden for
                pronunciation/audio, and use the PDF-backed meaning for the quiz.
              </p>
              <p className="mt-2 text-foreground/60">
                Today&apos;s accuracy: {correctToday}/{Math.max(completedToday, 1)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" className="rounded-full" onClick={restartGame}>
              <RotateCcw className="size-4" />
              Restart round
            </Button>
            <Button
              className="rounded-full"
              disabled={answerState === "idle"}
              onClick={nextWord}
            >
              {dailyComplete ? "Bonus word" : "Next word"}
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
