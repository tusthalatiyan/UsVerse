import { z } from "zod";

import {
  ideaStatusValues,
  moodValues,
  themeValues,
  voteModeValues,
} from "@/lib/constants";

export const signupSchema = z
  .object({
    email: z.string().email("Use a valid email address."),
    password: z
      .string()
      .min(8, "Make it at least 8 characters.")
      .max(72, "Keep it under 72 characters."),
    confirmPassword: z.string(),
    nickname: z
      .string()
      .min(2, "Pick a nickname with at least 2 characters.")
      .max(24, "Keep it cute and under 24 characters."),
    emojiIdentity: z
      .string()
      .min(2, "Add a little emoji identity.")
      .max(32, "Keep it short and playful."),
    avatarKey: z.string().min(1, "Choose an avatar."),
    themePreference: z.enum(themeValues),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords need to match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Use a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Use a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Make it at least 8 characters.")
      .max(72, "Keep it under 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords need to match.",
    path: ["confirmPassword"],
  });

export const pairingSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, "Invite codes are 6 characters.")
    .max(8, "Invite codes are short and sweet."),
});

export const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give it a title.")
    .max(80, "Keep the title under 80 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Keep the description under 280 characters.")
    .optional()
    .or(z.literal("")),
  category: z.string().min(1, "Pick a category."),
  emoji: z
    .string()
    .trim()
    .min(1, "Every idea deserves a tiny emoji.")
    .max(8, "One emoji is plenty."),
  tags: z.string().trim().max(120).optional().or(z.literal("")),
  imageUrl: z
    .union([z.string().url("Use a valid image URL."), z.literal("")])
    .optional(),
  status: z.enum(ideaStatusValues),
  priorityWeight: z.number().int().min(1).max(5),
});

export const goalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Add a goal with at least 2 characters.")
    .max(140, "Keep the goal under 140 characters."),
});

export const voteSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, "Ask a real question.")
    .max(120, "Keep the prompt under 120 characters."),
  mode: z.enum(voteModeValues),
  ideaId: z.string().uuid().optional().or(z.literal("")),
  optionsText: z.string().trim().optional().or(z.literal("")),
});

export const voteResponseSchema = z
  .object({
    responseValue: z.string().trim().optional().or(z.literal("")),
    ratingValue: z.coerce.number().int().min(1).max(5).nullable().optional(),
    emojiValue: z.string().trim().optional().or(z.literal("")),
    comment: z.string().trim().max(140).optional().or(z.literal("")),
  })
  .refine(
    (values) =>
      Boolean(values.responseValue || values.ratingValue || values.emojiValue),
    {
      message: "Choose a response before sending your vote.",
      path: ["responseValue"],
    },
  );

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Say something sweet.")
    .max(500, "Keep messages under 500 characters."),
});

export const moodSchema = z.object({
  mood: z.enum(moodValues),
  note: z
    .string()
    .trim()
    .max(120, "Keep the note short and cute.")
    .optional()
    .or(z.literal("")),
});

export const memorySchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Add a title.")
    .max(80, "Keep the title under 80 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Keep the description under 280 characters.")
    .optional()
    .or(z.literal("")),
  occurredAt: z.string().min(1, "Pick a date."),
  coverUrl: z
    .union([z.string().url("Use a valid image URL."), z.literal("")])
    .optional(),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type PairingValues = z.infer<typeof pairingSchema>;
export type IdeaValues = z.infer<typeof ideaSchema>;
export type GoalValues = z.infer<typeof goalSchema>;
export type VoteValues = z.infer<typeof voteSchema>;
export type VoteResponseValues = z.infer<typeof voteResponseSchema>;
export type MessageValues = z.infer<typeof messageSchema>;
export type MoodValues = z.infer<typeof moodSchema>;
export type MemoryValues = z.infer<typeof memorySchema>;
