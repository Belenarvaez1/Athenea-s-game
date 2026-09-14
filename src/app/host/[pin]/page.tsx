"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import type { Player } from "@/types/game";

export default function HostLobbyPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    function reclaim() {
      socket.emit("host:reclaim", { pin }, (res: { ok?: boolean; players?: Player[] }) => {
        if (res.ok && res.players) setPlayers(res.players);
      });
    }

    socket.on("connect", reclaim);
    socket.on("game:player-joined", setPlayers);
    socket.on("game:host-disconnected", () => router.push("/"));

    // Reclaim immediately if already connected (page load after server restart)
    if (socket.connected) reclaim();

    return () => {
      socket.off("connect", reclaim);
      socket.off("game:player-joined", setPlayers);
      socket.off("game:host-disconnected");
    };
  }, [pin, router]);

  function startGame() {
    getSocket().emit("host:start", { pin });
    router.push(`/host/${pin}/game`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 flex flex-col items-center p-6 gap-8">
      {/* PIN display */}
      <div className="mt-8 text-center">
        <p className="text-white/60 uppercase tracking-widest text-sm mb-1">Game PIN</p>
        <div className="bg-white rounded-2xl px-10 py-4">
          <span className="text-5xl font-black text-purple-800 tracking-widest">{pin}</span>
        </div>
        <p className="text-white/50 text-sm mt-2">Players go to this site and enter the PIN</p>
      </div>

      {/* Player list */}
      <div className="w-full max-w-lg">
        <p className="text-white/60 text-sm mb-3 text-center">
          {players.length} player{players.length !== 1 ? "s" : ""} joined
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="bg-white/10 rounded-xl px-4 py-3 text-white font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-200"
            >
              {p.avatar && <span className="text-2xl flex-shrink-0">{p.avatar}</span>}
              <span className="truncate">{p.name}</span>
            </div>
          ))}
          {players.length === 0 && (
            <div className="col-span-full text-center text-white/40 py-8">
              Waiting for players…
            </div>
          )}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={startGame}
        disabled={players.length === 0}
        className="mt-auto px-12 py-5 bg-white text-purple-800 font-black text-2xl rounded-full hover:scale-105 disabled:opacity-40 disabled:scale-100 transition-transform"
      >
        Start Game →
      </button>
    </main>
  );
}
