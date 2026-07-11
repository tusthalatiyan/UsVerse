"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Heart, RotateCcw, Sparkles, XCircle } from "lucide-react";

import { FrostCard } from "@/components/shared/frost-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WordCard = {
  id: string;
  english: string;
  german: string;
  article: string;
  pronunciation: string;
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

const wordBank: WordCard[] = [
  word("apple", "der", "Apfel", "AHP-fel", "Der Apfel ist rot."),
  word("water", "das", "Wasser", "VAH-ser", "Das Wasser ist kalt."),
  word("friend", "der", "Freund", "froynt", "Mein Freund lernt Deutsch."),
  word("book", "das", "Buch", "bookh", "Das Buch liegt hier."),
  word("flower", "die", "Blume", "BLOO-meh", "Die Blume ist schoen."),
  word("house", "das", "Haus", "hows", "Das Haus ist klein."),
  word("moon", "der", "Mond", "mohnt", "Der Mond scheint hell."),
  word("love", "die", "Liebe", "LEE-beh", "Die Liebe ist weich."),
  word("bread", "das", "Brot", "broht", "Das Brot ist frisch."),
  word("milk", "die", "Milch", "milkh", "Die Milch steht im Kuehlschrank."),
  word("coffee", "der", "Kaffee", "KAH-fay", "Der Kaffee ist warm."),
  word("tea", "der", "Tee", "tay", "Der Tee schmeckt gut."),
  word("cheese", "der", "Kaese", "KAY-zeh", "Der Kaese ist lecker."),
  word("egg", "das", "Ei", "eye", "Das Ei ist gekocht."),
  word("dog", "der", "Hund", "hoont", "Der Hund spielt draussen."),
  word("cat", "die", "Katze", "KAHT-seh", "Die Katze schlaeft."),
  word("bird", "der", "Vogel", "FOH-gel", "Der Vogel singt."),
  word("fish", "der", "Fisch", "fish", "Der Fisch schwimmt."),
  word("table", "der", "Tisch", "tish", "Der Tisch ist rund."),
  word("chair", "der", "Stuhl", "shtool", "Der Stuhl ist bequem."),
  word("door", "die", "Tuer", "tyoor", "Die Tuer ist offen."),
  word("window", "das", "Fenster", "FEN-ster", "Das Fenster ist gross."),
  word("bed", "das", "Bett", "bet", "Das Bett ist weich."),
  word("lamp", "die", "Lampe", "LAHM-peh", "Die Lampe ist hell."),
  word("bag", "die", "Tasche", "TAH-sheh", "Die Tasche ist blau."),
  word("phone", "das", "Handy", "HEN-dee", "Das Handy klingelt."),
  word("key", "der", "Schluessel", "SHLOO-sel", "Der Schluessel liegt hier."),
  word("car", "das", "Auto", "OW-toh", "Das Auto ist schnell."),
  word("train", "der", "Zug", "tsook", "Der Zug kommt spaet."),
  word("bike", "das", "Fahrrad", "FAHR-raht", "Das Fahrrad ist neu."),
  word("street", "die", "Strasse", "SHTRAH-seh", "Die Strasse ist lang."),
  word("city", "die", "Stadt", "shtaht", "Die Stadt ist schoen."),
  word("school", "die", "Schule", "SHOO-leh", "Die Schule beginnt frueh."),
  word("work", "die", "Arbeit", "AR-bite", "Die Arbeit ist wichtig."),
  word("time", "die", "Zeit", "tsite", "Die Zeit vergeht schnell."),
  word("day", "der", "Tag", "tahk", "Der Tag ist sonnig."),
  word("night", "die", "Nacht", "nahkht", "Die Nacht ist ruhig."),
  word("morning", "der", "Morgen", "MOR-gen", "Der Morgen ist frisch."),
  word("evening", "der", "Abend", "AH-bent", "Der Abend ist gemuetlich."),
  word("sun", "die", "Sonne", "ZON-neh", "Die Sonne scheint."),
  word("rain", "der", "Regen", "RAY-gen", "Der Regen ist kalt."),
  word("snow", "der", "Schnee", "shnay", "Der Schnee ist weiss."),
  word("cloud", "die", "Wolke", "VOL-keh", "Die Wolke ist grau."),
  word("heart", "das", "Herz", "herts", "Das Herz ist stark."),
  word("family", "die", "Familie", "fah-MEE-lee-eh", "Die Familie isst zusammen."),
  word("mother", "die", "Mutter", "MOOT-er", "Die Mutter lacht."),
  word("father", "der", "Vater", "FAH-ter", "Der Vater kocht."),
  word("sister", "die", "Schwester", "SHVES-ter", "Die Schwester liest."),
  word("brother", "der", "Bruder", "BROO-der", "Der Bruder rennt."),
  word("child", "das", "Kind", "kint", "Das Kind malt."),
  word("name", "der", "Name", "NAH-meh", "Der Name ist kurz."),
  word("question", "die", "Frage", "FRAH-geh", "Die Frage ist einfach."),
  word("answer", "die", "Antwort", "ANT-vort", "Die Antwort ist richtig."),
  word("language", "die", "Sprache", "SHPRAH-kheh", "Die Sprache klingt schoen."),
  word("word", "das", "Wort", "vort", "Das Wort ist neu."),
  word("food", "das", "Essen", "ES-en", "Das Essen ist fertig."),
  word("breakfast", "das", "Fruehstueck", "FROO-shtook", "Das Fruehstueck ist klein."),
  word("dinner", "das", "Abendessen", "AH-bent-es-en", "Das Abendessen ist warm."),
  word("kitchen", "die", "Kueche", "KOO-kheh", "Die Kueche ist sauber."),
  word("room", "das", "Zimmer", "TSIM-er", "Das Zimmer ist hell."),
  word("bathroom", "das", "Bad", "baht", "Das Bad ist frei."),
  word("garden", "der", "Garten", "GAR-ten", "Der Garten ist gruen."),
  word("music", "die", "Musik", "moo-ZEEK", "Die Musik ist laut."),
  word("song", "das", "Lied", "leet", "Das Lied ist schoen."),
  word("movie", "der", "Film", "film", "Der Film ist spannend."),
  word("game", "das", "Spiel", "shpeel", "Das Spiel macht Spass."),
  word("joy", "die", "Freude", "FROY-deh", "Die Freude ist gross."),
  word("luck", "das", "Glueck", "glook", "Das Glueck kommt leise."),
  word("peace", "der", "Frieden", "FREE-den", "Der Frieden ist wichtig."),
  word("dream", "der", "Traum", "trowm", "Der Traum ist bunt."),
  word("star", "der", "Stern", "shtern", "Der Stern leuchtet."),
  word("world", "die", "Welt", "velt", "Die Welt ist gross."),
  word("journey", "die", "Reise", "RYE-zeh", "Die Reise beginnt."),
  word("map", "die", "Karte", "KAR-teh", "Die Karte liegt dort."),
  word("money", "das", "Geld", "gelt", "Das Geld ist im Portemonnaie."),
  word("shop", "der", "Laden", "LAH-den", "Der Laden ist offen."),
  word("price", "der", "Preis", "pryce", "Der Preis ist niedrig."),
  word("color", "die", "Farbe", "FAR-beh", "Die Farbe ist rosa."),
  word("red", "", "rot", "roht", "Rot ist eine warme Farbe."),
  word("blue", "", "blau", "blow", "Blau ist ruhig."),
  word("green", "", "gruen", "groon", "Gruen passt zum Garten."),
  word("small", "", "klein", "kline", "Das Haus ist klein."),
  word("big", "", "gross", "grohs", "Die Stadt ist gross."),
  word("beautiful", "", "schoen", "shurn", "Der Tag ist schoen."),
  word("fast", "", "schnell", "shnel", "Der Zug ist schnell."),
  word("slow", "", "langsam", "LAHNG-zahm", "Die Musik ist langsam."),
];

function word(
  english: string,
  article: string,
  german: string,
  pronunciation: string,
  example: string,
): WordCard {
  return {
    id: german.toLowerCase(),
    english,
    article,
    german,
    pronunciation,
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
                Practice 10 fresh words every day, then keep going in bonus mode.
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
                Daily rhythm
              </p>
              <p>
                Finish 10 unique words today. Tomorrow, the deck reshuffles into a
                new daily set automatically.
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
