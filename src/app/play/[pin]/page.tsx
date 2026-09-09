"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import AnswerButton from "@/components/AnswerButton";
import Timer from "@/components/Timer";
import ScorePopup from "@/components/ScorePopup";
import type { Player, QuestionEvent, ResultsEvent } from "@/types/game";

type Phase = "waiting" | "question" | "answered" | "results" | "finished";
type BtnState = "idle" | "selected" | "correct" | "wrong" | "disabled";

export default function PlayPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [question, setQuestion] = useState<QuestionEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<ResultsEvent | null>(null);
  const [me, setMe] = useState<Player | null>(null);
  const [finalPlayers, setFinalPlayers] = useState<Player[] | null>(null);

  const playerName =
    typeof window !== "undefined" ? sessionStorage.getItem("player-name") ?? "You" : "You";

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on("game:question", (q: QuestionEvent) => {
      setQuestion(q);
      setTimeLeft(q.timeLimit);
      setSelectedIndex(null);
      setResults(null);
      setPhase("question");
    });

    socket.on("game:timer", (t: number) => setTimeLeft(t));

    socket.on("game:results", (data: ResultsEvent) => {
      setResults(data);
      const myPlayer = data.players.find((p) => p.id === socket.id) ?? null;
      setMe(myPlayer);
      setPhase("results");
    });

    socket.on("game:over", (players: Player[]) => {
      const myPlayer = players.find((p) => p.id === socket.id) ?? null;
      setMe(myPlayer);
      setFinalPlayers(players);
      setPhase("finished");
    });

    socket.on("game:host-disconnected", () => router.push("/"));

    return () => {
      socket.off("game:question");
      socket.off("game:timer");
      socket.off("game:results");
      socket.off("game:over");
      socket.off("game:host-disconnected");
    };
  }, [router]);

  function submitAnswer(index: number) {
    if (phase !== "question" || selectedIndex !== null) return;
    setSelectedIndex(index);
    setPhase("answered");
    getSocket().emit("player:answer", { pin, answerIndex: index });
  }

  function btnState(i: number): BtnState {
    if (phase === "question") return "idle";
    if (phase === "answered") return selectedIndex === i ? "selected" : "disabled";
    if (phase === "results" && results) {
      if (i === results.correctIndex) return "correct";
      if (i === selectedIndex) return "wrong";
      return "disabled";
    }
    return "disabled";
  }

  // ── Finished ───────────────────────────────────────────────────────────────
  if (phase === "finished" && finalPlayers) {
    const sorted = [...finalPlayers].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((p) => p.id === getSocket().id) + 1;
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-7xl">🏆</div>
        <h1 className="text-4xl font-black text-white">Game Over!</h1>
        <div className="bg-white/10 rounded-2xl px-8 py-5 text-center">
          <p className="text-white/60 text-sm">Your final rank</p>
          <p className="text-6xl font-black text-yellow-300">#{myRank}</p>
          <p className="text-white font-bold text-xl mt-1">{me?.score.toLocaleString() ?? 0} pts</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-2">
          {sorted.slice(0, 5).map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${p.id === getSocket().id ? "bg-yellow-400/20 ring-2 ring-yellow-300" : "bg-white/10"}`}>
              <span className="text-xl">{"🥇🥈🥉"[i] ?? `#${i + 1}`}</span>
              <span className="flex-1 text-white font-bold truncate">{p.name}</span>
              <span className="text-yellow-300 font-black">{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <a href="/join" className="mt-4 px-8 py-4 bg-white text-purple-800 font-black text-lg rounded-full hover:scale-105 transition-transform">
          Play Again
        </a>
      </main>
    );
  }

  // ── Waiting for next question ──────────────────────────────────────────────
  if (phase === "waiting") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-4">
        <div className="text-6xl animate-pulse">⏳</div>
        <p className="text-white text-xl font-bold">Waiting for the host…</p>
        <p className="text-white/50 text-sm">{playerName}</p>
      </main>
    );
  }

  // ── Results popup ─────────────────────────────────────────────────────────
  if (phase === "results" && me) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center p-6">
        <ScorePopup
          correct={me.lastCorrect ?? false}
          points={me.lastCorrect ? me.lastPoints - Math.round(0) : 0}
          timeBonus={0}
          totalScore={me.score}
        />
        <p className="text-white/40 text-sm mt-8 animate-pulse">Waiting for next question…</p>
      </main>
    );
  }

  // ── Answered — waiting for others ─────────────────────────────────────────
  if (phase === "answered") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-7xl">
          {selectedIndex !== null
            ? ["🔴", "🔵", "🟡", "🟢"][selectedIndex]
            : "✅"}
        </div>
        <h2 className="text-3xl font-black text-white">Answer submitted!</h2>
        <p className="text-white/60">Waiting for others…</p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </main>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-between p-4 py-6">
      <div className="flex items-center justify-between w-full">
        <span className="text-white/50 text-sm">
          Q{question ? question.index + 1 : "?"}/{question?.total ?? "?"}
        </span>
        <span className="text-white/50 text-sm">{playerName}</span>
      </div>

      <Timer timeLeft={timeLeft} totalTime={question?.timeLimit ?? 20} />

      <div className="w-full max-w-md bg-white/10 rounded-2xl px-6 py-5 text-center">
        <p className="text-white font-bold text-xl leading-snug">{question?.text ?? "…"}</p>
      </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-3">
        {question?.answers.map((a, i) => (
          <AnswerButton
            key={i}
            index={i}
            text={a.text}
            onClick={() => submitAnswer(i)}
            state={btnState(i)}
          />
        )) ?? null}
      </div>

      <div className="h-2" />
    </main>
  );
}
