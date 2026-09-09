"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import Timer from "@/components/Timer";
import Leaderboard from "@/components/Leaderboard";
import AnswerDistribution from "@/components/AnswerDistribution";
import type { Player, QuestionEvent, ResultsEvent } from "@/types/game";

type Phase = "waiting" | "question" | "results" | "leaderboard" | "finished";

export default function HostGamePage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("waiting");
  const [question, setQuestion] = useState<QuestionEvent | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answerCount, setAnswerCount] = useState({ count: 0, total: 0 });
  const [results, setResults] = useState<ResultsEvent | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on("game:question", (q: QuestionEvent) => {
      setQuestion(q);
      setTimeLeft(q.timeLimit);
      setAnswerCount({ count: 0, total: 0 });
      setResults(null);
      setPhase("question");
    });

    socket.on("game:timer", (t: number) => setTimeLeft(t));

    socket.on("game:answer-count", (data: { count: number; total: number }) => {
      setAnswerCount(data);
    });

    socket.on("game:results", (data: ResultsEvent) => {
      setResults(data);
      setPlayers(data.players);
      setPhase("results");
    });

    socket.on("game:over", (finalPlayers: Player[]) => {
      setPlayers(finalPlayers);
      setPhase("finished");
    });

    socket.on("game:host-disconnected", () => router.push("/"));

    return () => {
      socket.off("game:question");
      socket.off("game:timer");
      socket.off("game:answer-count");
      socket.off("game:results");
      socket.off("game:over");
      socket.off("game:host-disconnected");
    };
  }, [router]);

  function nextQuestion() {
    getSocket().emit("host:next", { pin });
    setPhase("leaderboard");
  }

  // ── Finished ──────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-7xl">🏆</div>
        <h1 className="text-5xl font-black text-white">Game Over!</h1>
        <div className="w-full max-w-md flex flex-col gap-3">
          {sorted.map((p, i) => (
            <div key={p.id} className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-4">
              <span className="text-3xl">{"🥇🥈🥉"[i] ?? `#${i + 1}`}</span>
              <span className="flex-1 text-white font-bold text-xl">{p.name}</span>
              <span className="text-yellow-300 font-black text-xl">{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <a href="/" className="mt-4 px-10 py-4 bg-white text-purple-800 font-black text-xl rounded-full hover:scale-105 transition-transform">
          Back to Home
        </a>
      </main>
    );
  }

  // ── Leaderboard ───────────────────────────────────────────────────────────
  if (phase === "leaderboard") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center p-6">
        <p className="text-white/60 mb-6 animate-pulse">Waiting for next question…</p>
        <Leaderboard players={players} onNext={() => {}} isLastQuestion={false} />
      </main>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (phase === "results" && results && question) {
    const isLast = question.index === question.total - 1;
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
        <h2 className="text-3xl font-black text-white">Results</h2>
        <AnswerDistribution
          answers={question.answers.map((a) => a.text)}
          counts={results.answerCounts}
          correctIndex={results.correctIndex}
        />
        <Leaderboard players={players} onNext={nextQuestion} isLastQuestion={isLast} />
      </main>
    );
  }

  // ── Question ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-between p-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between pt-2">
        <span className="text-white/50 font-semibold">
          {question ? `Q${question.index + 1} / ${question.total}` : "…"}
        </span>
        <span className="text-white/50 font-semibold">
          {answerCount.total > 0
            ? `${answerCount.count} / ${answerCount.total} answered`
            : "Waiting for players…"}
        </span>
      </div>

      {/* Timer */}
      <Timer timeLeft={timeLeft} totalTime={question?.timeLimit ?? 20} />

      {/* Question */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur rounded-2xl px-8 py-8 text-center">
        <p className="text-white text-3xl font-bold leading-snug">
          {question?.text ?? "Loading…"}
        </p>
      </div>

      {/* Answer labels (host sees correct one highlighted) */}
      {question && (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-3">
          {question.answers.map((a, i) => {
            const colors = ["bg-red-600", "bg-blue-700", "bg-yellow-500", "bg-green-700"];
            const shapes = ["▲", "◆", "●", "■"];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl text-white font-bold text-lg ${colors[i]} ${a.correct ? "ring-4 ring-white scale-105" : "opacity-70"}`}
              >
                <span>{shapes[i]}</span>
                <span className="flex-1 text-center">{a.text}</span>
                {a.correct && <span>✓</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="h-4" />
    </main>
  );
}
