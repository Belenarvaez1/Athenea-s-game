"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = pin.replace(/\D/g, "").slice(0, 6);
    if (cleaned.length === 6) router.push(`/join/${cleaned}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-5xl font-black text-white">Join a Game</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="text-center text-4xl font-black tracking-widest bg-white rounded-2xl px-6 py-5 text-purple-800 outline-none focus:ring-4 focus:ring-white/40"
          autoFocus
        />
        <button
          type="submit"
          disabled={pin.length !== 6}
          className="py-4 bg-white text-purple-800 font-black text-xl rounded-2xl hover:scale-105 disabled:opacity-40 disabled:scale-100 transition-transform"
        >
          Next →
        </button>
      </form>

      <a href="/" className="text-white/40 hover:text-white/70 text-sm">← Back</a>
    </main>
  );
}
