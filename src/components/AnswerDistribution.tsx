"use client";

const COLORS = ["bg-red-600", "bg-blue-700", "bg-yellow-500", "bg-green-700"];
const SHAPES = ["▲", "◆", "●", "■"];

type Props = {
  answers: string[];       // answer texts
  counts: number[];        // how many players picked each
  correctIndex: number;
};

export default function AnswerDistribution({ answers, counts, correctIndex }: Props) {
  const max = Math.max(...counts, 1);

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-end justify-around gap-3 h-40 mb-3">
        {counts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-white font-bold text-lg">{count}</span>
            <div
              className={`w-full rounded-t-lg transition-all duration-700 ${COLORS[i]} ${i === correctIndex ? "ring-4 ring-white" : "opacity-70"}`}
              style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? "12px" : "4px" }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {answers.map((text, i) => (
          <div
            key={i}
            className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-bold truncate ${COLORS[i]} ${i === correctIndex ? "ring-2 ring-white" : "opacity-60"}`}
          >
            <span>{SHAPES[i]}</span>
            <span className="truncate">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
