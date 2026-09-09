"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { QUESTIONS } from "@/data/questions";
import type { Question } from "@/types/game";

function loadQuestions(): Question[] {
  if (typeof window === "undefined") return QUESTIONS as unknown as Question[];
  try {
    const saved = localStorage.getItem("kahoot-questions");
    if (saved) return JSON.parse(saved);
  } catch {}
  return QUESTIONS as unknown as Question[];
}

export default function HostPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "creating" | "error">("idle");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setQuestions(loadQuestions());
  }, []);

  function createGame() {
    if (questions.length === 0) return setError("Add at least one question first.");
    setStatus("creating");
    const socket = getSocket();
    socket.connect();
    socket.emit("host:create", questions, (res: { pin?: string; error?: string }) => {
      if (res.error) { setError(res.error); setStatus("error"); return; }
      router.push(`/host/${res.pin}`);
    });
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-black text-white mb-2">Host a Game</h1>
        <p className="text-white/60">
          {questions.length} question{questions.length !== 1 ? "s" : ""} loaded
        </p>
      </div>

      {error && (
        <p className="bg-red-500/20 border border-red-400 text-red-200 px-4 py-3 rounded-xl">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={createGame}
          disabled={status === "creating"}
          className="py-5 bg-white text-purple-800 font-black text-2xl rounded-2xl hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-transform"
        >
          {status === "creating" ? "Creating…" : "Create Game"}
        </button>
        <a
          href="/editor"
          className="py-3 text-center text-white/60 hover:text-white/90 text-sm underline underline-offset-4"
        >
          Edit questions first
        </a>
        <a
          href="/"
          className="py-3 text-center text-white/40 hover:text-white/70 text-sm"
        >
          ← Back
        </a>
      </div>
    </main>
  );
}
