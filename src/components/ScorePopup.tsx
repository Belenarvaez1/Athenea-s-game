"use client";

type Props = {
  correct: boolean;
  points: number;
  timeBonus: number;
  totalScore: number;
};

export default function ScorePopup({ correct, points, timeBonus, totalScore }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 animate-in fade-in zoom-in duration-300">
      <div className={`text-8xl ${correct ? "animate-bounce" : ""}`}>
        {correct ? "🎉" : "😢"}
      </div>
      <h2 className={`text-4xl font-black ${correct ? "text-green-400" : "text-red-400"}`}>
        {correct ? "Correct!" : "Wrong!"}
      </h2>

      {correct && (
        <div className="flex flex-col items-center gap-1 text-white/80">
          <p className="text-xl">+{points} base points</p>
          {timeBonus > 0 && <p className="text-lg text-yellow-300">+{timeBonus} speed bonus</p>}
        </div>
      )}

      <div className="mt-4 px-8 py-4 bg-white/10 rounded-2xl text-center">
        <p className="text-white/60 text-sm uppercase tracking-widest">Total Score</p>
        <p className="text-5xl font-black text-white">{totalScore.toLocaleString()}</p>
      </div>
    </div>
  );
}
