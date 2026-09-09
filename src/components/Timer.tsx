"use client";

type Props = {
  timeLeft: number;
  totalTime: number;
};

export default function Timer({ timeLeft, totalTime }: Props) {
  const pct = (timeLeft / totalTime) * 100;
  const urgent = timeLeft <= 5;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`
          w-20 h-20 rounded-full flex items-center justify-center
          text-3xl font-black text-white border-4
          transition-colors duration-300
          ${urgent ? "border-red-400 bg-red-600 animate-pulse" : "border-white/30 bg-white/10"}
        `}
      >
        {timeLeft}
      </div>
      <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${urgent ? "bg-red-400" : "bg-white"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
