"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Link2, LoaderCircle, Unlink2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FrostCard } from "@/components/shared/frost-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOptionalSupabase } from "@/hooks/use-supabase";
import { hasSupabaseConfig } from "@/lib/env";
import { pairingSchema, type PairingValues } from "@/lib/schemas";
import {
  createInviteCode,
  joinCoupleWithCode,
  unlinkCouple,
} from "@/services/pairing-service";
import { toErrorMessage } from "@/services/service-utils";
import { useDemoStore } from "@/stores/demo-store";
import type { Tables } from "@/types/database";

export function PairingCard({
  couple,
  members,
  profile,
}: {
  couple: Tables<"couples"> | null;
  members: Tables<"profiles">[];
  profile: Tables<"profiles">;
}) {
  const router = useRouter();
  const supabase = useOptionalSupabase();
  const isPreview = !hasSupabaseConfig;
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const createPreviewInviteCode = useDemoStore((state) => state.createInviteCode);
  const joinPreviewWithCode = useDemoStore((state) => state.joinWithCode);
  const unlinkPreviewCouple = useDemoStore((state) => state.unlinkCouple);
  const form = useForm<PairingValues>({
    resolver: zodResolver(pairingSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const otherMembers = members.filter((member) => member.id !== profile.id);

  if (!couple) {
    return (
      <FrostCard className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Invite
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Open your shared space
          </h2>
          <p className="text-sm leading-6 text-foreground/70">
            Create an invite code for people joining your space, or use one
            they sent you.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.7rem] border border-white/75 bg-white/65 p-4">
            <p className="font-semibold">Create an invite code</p>
            <p className="mt-1 text-sm text-foreground/68">
              This opens your shared space and keeps the same code ready for
              more people to join later.
            </p>
            <Button
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  if (isPreview) {
                    createPreviewInviteCode();
                    toast.success("Invite code created.");
                    return;
                  }

                  if (!supabase) {
                    toast.error("Supabase client unavailable.");
                    return;
                  }

                  const { error } = await createInviteCode(supabase);

                  if (error) {
                    toast.error(toErrorMessage(error));
                    return;
                  }

                  toast.success("Invite code created.");
                  router.refresh();
                })
              }
              className="mt-4 rounded-full"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                "Generate code"
              )}
            </Button>
          </div>

          <form
            onSubmit={form.handleSubmit((values) => {
              startTransition(async () => {
                if (isPreview) {
                  joinPreviewWithCode(values);
                  toast.success("You're connected. The universe is officially shared.");
                  form.reset();
                  return;
                }

                if (!supabase) {
                  toast.error("Supabase client unavailable.");
                  return;
                }

                const { error } = await joinCoupleWithCode(supabase, values);

                if (error) {
                  toast.error(toErrorMessage(error));
                  return;
                }

                toast.success("You're connected. The universe is officially shared.");
                router.refresh();
              });
            })}
            className="rounded-[1.7rem] border border-white/75 bg-white/65 p-4"
          >
            <Label htmlFor="inviteCode">Use an invite code</Label>
            <Input
              id="inviteCode"
              className="mt-2 uppercase"
              placeholder="ABC123"
              maxLength={8}
              {...form.register("inviteCode")}
            />
            {form.formState.errors.inviteCode?.message ? (
              <p className="mt-2 text-xs text-rose-500">
                {form.formState.errors.inviteCode.message}
              </p>
            ) : null}
            <Button disabled={isPending} type="submit" className="mt-4 rounded-full">
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : "Connect"}
            </Button>
          </form>
        </div>
      </FrostCard>
    );
  }

  if (!otherMembers.length) {
    return (
      <FrostCard className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
              Invite Waiting
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Your invite code is ready
            </h2>
            <p className="text-sm leading-6 text-foreground/70">
              Send this code to people joining your space.
            </p>
          </div>
          <Link2 className="size-6 text-rose-500" />
        </div>

        <div className="rounded-[1.8rem] border border-white/75 bg-white/70 p-5">
          <p className="text-xs uppercase tracking-[0.32em] text-foreground/45">
            Invite code
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="font-heading text-4xl font-semibold tracking-[0.24em]">
              {couple.invite_code}
            </p>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={async () => {
                await navigator.clipboard.writeText(couple.invite_code);
                setCopied(true);
                toast.success("Invite code copied.");
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              <Copy className="size-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </FrostCard>
    );
  }

  return (
    <FrostCard className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-400">
            Connected
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your shared space is live
          </h2>
          <p className="text-sm leading-6 text-foreground/70">
            One private space, one reusable code, and room for more cozy chaos.
          </p>
        </div>
        <Button
          variant="ghost"
          className="rounded-full text-foreground/65 hover:text-rose-600"
          onClick={() =>
            startTransition(async () => {
              if (isPreview) {
                unlinkPreviewCouple();
                toast.success("Connection removed.");
                return;
              }

              if (!supabase) {
                toast.error("Supabase client unavailable.");
                return;
              }

              const { error } = await unlinkCouple(supabase);

              if (error) {
                toast.error(toErrorMessage(error));
                return;
              }

              toast.success("Connection removed.");
              router.refresh();
            })
          }
        >
          <Unlink2 className="size-4" />
          Disconnect
        </Button>
      </div>

      <div className="rounded-[1.6rem] border border-white/75 bg-white/65 p-4">
        <p className="text-xs uppercase tracking-[0.32em] text-foreground/45">
          Invite code
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-heading text-3xl font-semibold tracking-[0.24em] sm:text-4xl">
            {couple.invite_code}
          </p>
          <Button
            variant="secondary"
            className="rounded-full"
            onClick={async () => {
              await navigator.clipboard.writeText(couple.invite_code);
              setCopied(true);
              toast.success("Invite code copied.");
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="size-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 rounded-[1.5rem] border border-white/75 bg-white/65 p-4"
          >
            <UserAvatar avatarKey={person.avatar_key} nickname={person.nickname} />
            <div>
              <p className="font-semibold">{person.nickname}</p>
              <p className="text-sm text-foreground/68">{person.emoji_identity}</p>
            </div>
          </div>
        ))}
      </div>
    </FrostCard>
  );
}
