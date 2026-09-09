import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-10 p-6">
      <div className="text-center">
        <h1 className="text-7xl font-black text-white mb-3 tracking-tight">Athenea's Game</h1>
        <p className="text-white/60 text-xl">Real-time quiz battles</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link
          href="/host"
          className="flex-1 py-5 bg-white text-purple-800 font-black text-2xl rounded-2xl text-center hover:scale-105 transition-transform shadow-2xl"
        >
          Host a Game
        </Link>
        <Link
          href="/join"
          className="flex-1 py-5 bg-purple-500 text-white font-black text-2xl rounded-2xl text-center hover:scale-105 transition-transform shadow-2xl border-2 border-white/20"
        >
          Join a Game
        </Link>
      </div>

      <Link
        href="/editor"
        className="text-white/50 hover:text-white/80 text-sm underline underline-offset-4 transition-colors"
      >
        Question Editor
      </Link>
    </main>
  );
}
