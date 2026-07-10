import type { Enums } from "@/types/database";

export const themeValues = [
  "rosewater",
  "peach-fizz",
  "mint-meringue",
  "starlit-lagoon",
] as const satisfies readonly Enums<"theme_preference">[];

export const ideaStatusValues = [
  "pending",
  "shortlisted",
  "completed",
] as const satisfies readonly Enums<"idea_status">[];

export const voteModeValues = [
  "yes_no",
  "emoji",
  "rating",
  "vibe",
] as const satisfies readonly Enums<"vote_mode">[];

export const moodValues = [
  "hungry",
  "bored",
  "romantic",
  "adventurous",
  "tired",
  "movie_mood",
  "lazy",
  "excited",
] as const satisfies readonly Enums<"mood_name">[];

export const gameTypeValues = [
  "this_or_that",
  "would_you_rather",
  "spin_the_wheel",
  "partner_quiz",
  "emoji_guessing",
] as const satisfies readonly Enums<"game_type">[];

export const themeOptions = [
  {
    value: "rosewater",
    name: "Rosewater Glow",
    description: "Petal pink, cream soda, and moonlit coral.",
    gradient: "from-rose-200 via-pink-100 to-orange-100",
    ring: "ring-rose-300/70",
  },
  {
    value: "peach-fizz",
    name: "Peach Fizz",
    description: "Golden peach skies with fizzy sunset sparkles.",
    gradient: "from-amber-200 via-orange-100 to-rose-100",
    ring: "ring-orange-300/70",
  },
  {
    value: "mint-meringue",
    name: "Mint Meringue",
    description: "Cloud mint tones with sugary aqua highlights.",
    gradient: "from-emerald-100 via-teal-50 to-cyan-100",
    ring: "ring-emerald-300/70",
  },
  {
    value: "starlit-lagoon",
    name: "Starlit Lagoon",
    description: "A dreamy lagoon with soft blue dusk shimmer.",
    gradient: "from-sky-200 via-cyan-100 to-blue-100",
    ring: "ring-sky-300/70",
  },
] as const;

export const avatarOptions = [
  {
    key: "peach-cat",
    emoji: "🐱",
    title: "Peach Cat",
    aura: "from-rose-200 via-orange-100 to-amber-100",
  },
  {
    key: "mochi-bear",
    emoji: "🐻",
    title: "Mochi Bear",
    aura: "from-amber-200 via-orange-100 to-pink-100",
  },
  {
    key: "cosmic-bunny",
    emoji: "🐰",
    title: "Cosmic Bunny",
    aura: "from-pink-200 via-fuchsia-100 to-rose-100",
  },
  {
    key: "sleepy-panda",
    emoji: "🐼",
    title: "Sleepy Panda",
    aura: "from-slate-200 via-zinc-100 to-stone-100",
  },
  {
    key: "mint-fox",
    emoji: "🦊",
    title: "Mint Fox",
    aura: "from-emerald-200 via-cyan-100 to-sky-100",
  },
  {
    key: "starlight-otter",
    emoji: "🦦",
    title: "Starlight Otter",
    aura: "from-sky-200 via-indigo-100 to-violet-100",
  },
] as const;

export const moodOptions = [
  { value: "hungry", label: "Hungry", emoji: "🍜" },
  { value: "bored", label: "Bored", emoji: "🫠" },
  { value: "romantic", label: "Cozy", emoji: "💗" },
  { value: "adventurous", label: "Adventurous", emoji: "🧭" },
  { value: "tired", label: "Tired", emoji: "😴" },
  { value: "movie_mood", label: "Movie Mood", emoji: "🎬" },
  { value: "lazy", label: "Lazy", emoji: "🛋️" },
  { value: "excited", label: "Excited", emoji: "✨" },
] as const;

export const ideaCategories = [
  { value: "food", label: "Food", emoji: "🍝" },
  { value: "restaurants", label: "Restaurants", emoji: "🍽️" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "movies", label: "Movies", emoji: "🎞️" },
  { value: "date_plans", label: "Outing Plans", emoji: "💞" },
  { value: "activities", label: "Activities", emoji: "🎨" },
  { value: "wishes", label: "Wishes", emoji: "🌠" },
  { value: "gifts", label: "Gifts", emoji: "🎁" },
  { value: "surprises", label: "Surprises", emoji: "🎉" },
  { value: "challenges", label: "Challenges", emoji: "🏁" },
] as const;

export const voteModeOptions = [
  {
    value: "yes_no",
    label: "Yes / No",
    description: "Fast binary vote for simple decisions.",
  },
  {
    value: "emoji",
    label: "Emoji Pulse",
    description: "Vote with a vibe instead of words.",
  },
  {
    value: "rating",
    label: "Star Rating",
    description: "Give it a score from 1 to 5.",
  },
  {
    value: "vibe",
    label: "Hell Yes",
    description: "Choose between hell yes, maybe, or nope.",
  },
] as const;

export const gameSpotlightCopy = [
  "Tiny sparks for when you both want something fun right now.",
  "Small games, big shared energy.",
  "For the nights when choosing a vibe is the whole plan.",
] as const;

export const thisOrThatPrompts = [
  "Sunrise breakfast run or midnight dessert mission?",
  "Cozy blanket fort or spontaneous city walk?",
  "Beach breeze weekend or mountain cabin escape?",
  "Movie marathon or game night chaos?",
  "Photo dump moment or no phones all night?",
] as const;

export const wouldYouRatherPrompts = [
  "Would you rather get a surprise snack drop every Friday or a handwritten note every Sunday?",
  "Would you rather try ten new snack spots or rewatch your comfort movie in theaters?",
  "Would you rather plan the whole hangout or let the other side mystery-box it?",
  "Would you rather teleport to dinner or teleport back home after dinner?",
  "Would you rather have a hangout budget of time or money, but never both?",
] as const;

export const emojiGuessingPrompts = [
  { clue: "🍿🌧️🛋️", answer: "cozy movie night" },
  { clue: "🍜🚶🌃", answer: "late-night noodle walk" },
  { clue: "🧺☀️🌿", answer: "picnic in the park" },
  { clue: "🎡🍭✨", answer: "carnival night" },
  { clue: "🚗🎶🌌", answer: "night drive playlist mission" },
] as const;

export const inviteCodeLength = 6;
