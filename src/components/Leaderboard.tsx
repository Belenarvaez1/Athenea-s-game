"use client";

type Player = { name: string; score: number };

type Props = {
  players: Player[];
  onNext: () => void;
  isLastQuestion: boolean;
};

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ players, onNext, isLastQuestion }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto py-8">
      <h2 className="text-4xl font-black text-white">Leaderboard</h2>

      <div className="w-full flex flex-col gap-3">
        {sorted.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-4"
          >
            <span className="text-3xl w-10 text-center">
              {MEDALS[i] ?? `#${i + 1}`}
            </span>
            <span className="flex-1 text-white font-bold text-xl">{p.name}</span>
            <span className="text-yellow-300 font-black text-xl">
              {p.score.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-4 px-10 py-4 bg-white text-purple-800 font-black text-xl rounded-full hover:scale-105 transition-transform"
      >
        {isLastQuestion ? "See Final Results 🏆" : "Next Question →"}
      </button>
    </div>
  );
}
