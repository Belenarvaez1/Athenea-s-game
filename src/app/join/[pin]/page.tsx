"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

type Phase = "name" | "waiting" | "error";

export default function JoinLobbyPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phase, setPhase] = useState<Phase>("name");
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

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.emit("player:join", { pin, name: trimmed }, (res: { ok?: boolean; error?: string }) => {
      if (res.error) { setError(res.error); setPhase("error"); return; }
      sessionStorage.setItem("player-name", trimmed);
      sessionStorage.setItem("player-pin", pin);
      setPhase("waiting");
    });
  }

  if (phase === "error") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-6xl">😕</div>
        <p className="text-white text-xl text-center">{error}</p>
        <a href="/join" className="text-white/60 underline">Try again</a>
      </main>
    );
  }

  if (phase === "waiting") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <div className="text-7xl mb-4">🎮</div>
          <h1 className="text-4xl font-black text-white">{name}</h1>
          <p className="text-white/60 mt-2">You&apos;re in! Waiting for the host to start…</p>
        </div>
        <div className="flex gap-1 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <p className="text-white/40 text-sm mt-8">PIN: {pin}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
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
