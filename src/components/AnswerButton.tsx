"use client";

type Shape = "triangle" | "diamond" | "circle" | "square";

const SHAPES: Record<Shape, string> = {
  triangle: "▲",
  diamond: "◆",
  circle: "●",
  square: "■",
};

type Props = {
  index: number;
  text: string;
  onClick: () => void;
  state: "idle" | "selected" | "correct" | "wrong" | "disabled";
};

const COLORS = [
  { bg: "bg-red-600 hover:bg-red-500",     selected: "bg-red-400",  shape: "triangle" as Shape },
  { bg: "bg-blue-700 hover:bg-blue-600",   selected: "bg-blue-500", shape: "diamond"  as Shape },
  { bg: "bg-yellow-500 hover:bg-yellow-400", selected: "bg-yellow-300", shape: "circle" as Shape },
  { bg: "bg-green-700 hover:bg-green-600", selected: "bg-green-500", shape: "square"  as Shape },
];

export default function AnswerButton({ index, text, onClick, state }: Props) {
  const color = COLORS[index];

  const bgClass =
    state === "correct"  ? "bg-green-400 scale-105 ring-4 ring-white" :
    state === "wrong"    ? "bg-gray-600 opacity-50 scale-95" :
    state === "selected" ? `${color.selected} ring-4 ring-white scale-105` :
    state === "disabled" ? "bg-gray-600 opacity-40 cursor-not-allowed" :
    color.bg;

  return (
    <button
      onClick={state === "idle" ? onClick : undefined}
      disabled={state === "disabled" || state === "wrong"}
      className={`
        relative flex items-center gap-4 w-full h-20 px-6 rounded-xl
        text-white font-bold text-xl cursor-pointer
        transition-all duration-200 select-none
        ${bgClass}
      `}
    >
      <span className="text-2xl">{SHAPES[color.shape]}</span>
      <span className="flex-1 text-center">{text}</span>
      {state === "correct" && <span className="text-2xl">✓</span>}
      {state === "wrong"   && <span className="text-2xl">✗</span>}
    </button>
  );
}
