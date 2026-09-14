"use client"
import { useRef } from "react"

const FREQ = {
  C4: 261.63, D4: 293.66, E4: 329.63,
  G4: 392.00, A4: 440.00, C5: 523.25, C6: 1046.5,
}

// Question phase: upbeat 8-note melody at 128 BPM
// Waiting phase: calmer variation at 80 BPM
const MELODIES = {
  question: [FREQ.E4, FREQ.G4, FREQ.A4, FREQ.G4, FREQ.E4, FREQ.D4, FREQ.C4, FREQ.D4],
  waiting:  [FREQ.C4, FREQ.E4, FREQ.G4, FREQ.E4, FREQ.C4, FREQ.D4, FREQ.E4, FREQ.D4],
}

const BPM: Record<string, number> = { question: 128, waiting: 80 }

export type MusicPhase = "question" | "waiting"

export function useGameMusic() {
  const r = useRef({
    ctx:     null as AudioContext | null,
    master:  null as GainNode | null,
    loop:    null as ReturnType<typeof setTimeout> | null,
    playing: false,
    phase:   "waiting" as MusicPhase,
  })

  function getCtx(): AudioContext {
    if (!r.current.ctx) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AC = window.AudioContext ?? (window as any).webkitAudioContext
      r.current.ctx    = new AC() as AudioContext
      r.current.master = r.current.ctx.createGain()
      r.current.master.gain.value = 0.12
      r.current.master.connect(r.current.ctx.destination)
    }
    if (r.current.ctx.state === "suspended") r.current.ctx.resume()
    return r.current.ctx
  }

  function playNote(
    freq: number, at: number, dur: number,
    vol: number = 0.5, type: OscillatorType = "square",
  ) {
    const c   = r.current.ctx!
    const osc = c.createOscillator()
    const g   = c.createGain()
    osc.type          = type
    osc.frequency.value = freq
    osc.connect(g)
    g.connect(r.current.master!)
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, at + Math.max(dur - 0.02, 0.01))
    osc.start(at)
    osc.stop(at + dur)
  }

  function scheduleLoop(startAt: number): number {
    const melody = MELODIES[r.current.phase]
    const beat   = 60 / BPM[r.current.phase]
    melody.forEach((freq, i) => {
      const t = startAt + i * beat
      playNote(freq, t, beat * 0.75)
      // bass note on bar downbeats
      if (i % 4 === 0) playNote(freq / 2, t, beat * 0.9, 0.3, "sine")
    })
    return beat * melody.length
  }

  function tick() {
    if (!r.current.playing || !r.current.ctx) return
    const dur = scheduleLoop(r.current.ctx.currentTime)
    r.current.loop = setTimeout(tick, (dur - 0.15) * 1000)
  }

  const api = useRef({
    startMusic(phase: MusicPhase = "waiting") {
      try {
        r.current.phase   = phase
        r.current.playing = true
        getCtx()
        r.current.master!.gain.cancelScheduledValues(r.current.ctx!.currentTime)
        r.current.master!.gain.value = 0.12
        if (r.current.loop) clearTimeout(r.current.loop)
        tick()
      } catch { /* AudioContext blocked or SSR */ }
    },

    setPhase(phase: MusicPhase) {
      if (r.current.phase === phase) return
      r.current.phase = phase
      if (!r.current.playing) return
      if (r.current.loop) clearTimeout(r.current.loop)
      tick()
    },

    stopMusic(fadeMs = 300) {
      r.current.playing = false
      if (r.current.loop) clearTimeout(r.current.loop)
      const c = r.current.ctx
      const m = r.current.master
      if (c && m) {
        m.gain.cancelScheduledValues(c.currentTime)
        m.gain.linearRampToValueAtTime(0, c.currentTime + fadeMs / 1000)
      }
    },

    // Short high-pitched tick for countdown (call when timeLeft <= 5)
    playTick() {
      try {
        const c   = getCtx()
        const osc = c.createOscillator()
        const g   = c.createGain()
        osc.type           = "sine"
        osc.frequency.value = FREQ.C6
        osc.connect(g)
        g.connect(c.destination)
        const now = c.currentTime
        g.gain.setValueAtTime(0.25, now)
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
        osc.start(now)
        osc.stop(now + 0.1)
      } catch { /* ignore */ }
    },

    // Ascending arpeggio played once when results are revealed
    playReveal() {
      try {
        const c = getCtx()
        r.current.playing = false
        if (r.current.loop) clearTimeout(r.current.loop)
        const m   = r.current.master!
        const now = c.currentTime
        m.gain.cancelScheduledValues(now)
        m.gain.linearRampToValueAtTime(0, now + 0.1)
        ;[FREQ.C4, FREQ.E4, FREQ.G4, FREQ.C5].forEach((freq, i) => {
          const t   = now + 0.12 + i * 0.13
          const osc = c.createOscillator()
          const gn  = c.createGain()
          osc.type           = "sine"
          osc.frequency.value = freq
          osc.connect(gn)
          gn.connect(c.destination)
          gn.gain.setValueAtTime(0.2, t)
          gn.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
          osc.start(t)
          osc.stop(t + 0.2)
        })
      } catch { /* ignore */ }
    },
  })

  return api.current
}
