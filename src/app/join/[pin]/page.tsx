"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import AvatarPicker, { getAvatarBg } from "@/components/AvatarPicker";

type Phase = "avatar" | "name" | "waiting" | "error";

export default function JoinLobbyPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("avatar");
  const [error, setError] = useState("");

  useEffect(() => {
    const socket = getSocket();
    socket.on("game:started", () => router.push(`/play/${pin}`));
    socket.on("game:host-disconnected", () => {
      setError("The host disconnected. Game over.");
      setPhase("error");
    });
    return () => {
      socket.off("game:started");
      socket.off("game:host-disconnected");
    };
  }, [pin, router]);

  function handleAvatarSelect(emoji: string) {
    setAvatar(emoji);
    setPhase("name");
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !avatar) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit(
      "player:join",
      { pin, name: trimmed, avatar },
      (res: { ok?: boolean; error?: string }) => {
        if (res.error) { setError(res.error); setPhase("error"); return; }
        sessionStorage.setItem("player-name", trimmed);
        sessionStorage.setItem("player-pin", pin);
        sessionStorage.setItem("player-avatar", avatar!);
        setPhase("waiting");
      },
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-6xl">😕</div>
        <p className="text-white text-xl text-center">{error}</p>
        <a href="/join" className="text-white/60 underline">Try again</a>
      </main>
    );
  }

  // ── Waiting for host ───────────────────────────────────────────────────────
  if (phase === "waiting") {
    const bg = avatar ? getAvatarBg(avatar) : "bg-purple-500";
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className={`${bg} rounded-full w-28 h-28 flex items-center justify-center text-6xl shadow-lg`}>
          {avatar}
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black text-white">{name}</h1>
          <p className="text-white/60 mt-2">You&apos;re in! Waiting for the host to start…</p>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-white/40 text-sm mt-6">PIN: {pin}</p>
      </main>
    );
  }

  // ── Name entry ─────────────────────────────────────────────────────────────
  if (phase === "name") {
    const bg = avatar ? getAvatarBg(avatar) : "bg-purple-500";
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
        {/* Selected avatar preview */}
        <button
          onClick={() => setPhase("avatar")}
          className={`${bg} rounded-full w-24 h-24 flex items-center justify-center text-5xl shadow-lg hover:scale-105 transition-transform`}
          title="Change avatar"
        >
          {avatar}
        </button>

        <div className="text-center -mt-2">
          <p className="text-white/50 text-sm uppercase tracking-widest mb-1">PIN: {pin}</p>
          <h1 className="text-4xl font-black text-white">What&apos;s your name?</h1>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="text"
            placeholder="Your nickname"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            maxLength={20}
            className="text-center text-2xl font-bold bg-white rounded-2xl px-6 py-4 text-purple-800 outline-none focus:ring-4 focus:ring-white/40"
            autoFocus
          />
          {error && <p className="text-red-300 text-center text-sm">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim()}
            className="py-4 bg-white text-purple-800 font-black text-xl rounded-2xl hover:scale-105 disabled:opacity-40 disabled:scale-100 transition-transform"
          >
            Join Game →
          </button>
        </form>
      </main>
    );
  }

  // ── Avatar picker ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-1">PIN: {pin}</p>
        <h1 className="text-4xl font-black text-white">Pick your character!</h1>
        <p className="text-white/50 text-sm mt-1">Tap an animal to continue</p>
      </div>
      <AvatarPicker selected={avatar} onSelect={handleAvatarSelect} />
    </main>
  );
}
