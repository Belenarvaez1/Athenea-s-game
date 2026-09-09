"use client";

import { useEffect, useState } from "react";
import type { Question, AnswerOption } from "@/types/game";
import { QUESTIONS as DEFAULT_QUESTIONS } from "@/data/questions";

const STORAGE_KEY = "kahoot-questions";

function newQuestion(): Question {
  return {
    id: String(Date.now()),
    text: "",
    timeLimit: 20,
    points: 1000,
    answers: [
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
  };
}

function load(): Question[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_QUESTIONS as unknown as Question[];
}

function save(questions: Question[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export default function EditorPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Question | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setQuestions(load()); }, []);

  function persist(qs: Question[]) {
    setQuestions(qs);
    save(qs);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function openNew() {
    const q = newQuestion();
    setDraft(q);
    setEditingId(q.id);
  }

  function openEdit(q: Question) {
    setDraft(JSON.parse(JSON.stringify(q)));
    setEditingId(q.id);
  }

  function closeEditor() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    if (!draft.text.trim()) return alert("Question text is required.");
    if (!draft.answers.some((a) => a.correct)) return alert("Mark one answer as correct.");
    if (draft.answers.some((a) => !a.text.trim())) return alert("All 4 answer texts are required.");

    const exists = questions.find((q) => q.id === draft.id);
    if (exists) {
      persist(questions.map((q) => (q.id === draft.id ? draft : q)));
    } else {
      persist([...questions, draft]);
    }
    closeEditor();
  }

  function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    persist(questions.filter((q) => q.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const i = questions.findIndex((q) => q.id === id);
    if (i + dir < 0 || i + dir >= questions.length) return;
    const qs = [...questions];
    [qs[i], qs[i + dir]] = [qs[i + dir], qs[i]];
    persist(qs);
  }

  function setDraftAnswer(index: number, field: keyof AnswerOption, value: string | boolean) {
    if (!draft) return;
    const answers = draft.answers.map((a, i) => {
      if (field === "correct") return { ...a, correct: i === index };
      if (i === index) return { ...a, [field]: value };
      return a;
    }) as Question["answers"];
    setDraft({ ...draft, answers });
  }

  const COLORS = ["bg-red-600", "bg-blue-700", "bg-yellow-500", "bg-green-700"];
  const SHAPES = ["▲", "◆", "●", "■"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black text-white">Question Editor</h1>
            <p className="text-white/50 text-sm mt-1">{questions.length} questions</p>
          </div>
          <div className="flex items-center gap-3">
            {saved && <span className="text-green-300 text-sm font-bold animate-in fade-in">Saved ✓</span>}
            <a href="/" className="text-white/50 hover:text-white/80 text-sm">← Home</a>
          </div>
        </div>

        {/* Question list */}
        <div className="flex flex-col gap-3 mb-6">
          {questions.length === 0 && (
            <div className="text-center text-white/40 py-10">No questions yet. Add one below.</div>
          )}
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white/10 rounded-2xl p-4 flex gap-4 items-start">
              <div className="flex flex-col gap-1 pt-1">
                <button onClick={() => move(q.id, -1)} disabled={i === 0} className="text-white/40 hover:text-white disabled:opacity-20 text-lg leading-none">▲</button>
                <button onClick={() => move(q.id, 1)} disabled={i === questions.length - 1} className="text-white/40 hover:text-white disabled:opacity-20 text-lg leading-none">▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/40 text-sm font-bold">Q{i + 1}</span>
                  <span className="text-white/40 text-xs">{q.timeLimit}s · {q.points.toLocaleString()} pts</span>
                </div>
                <p className="text-white font-bold truncate">{q.text || <em className="opacity-40">Untitled</em>}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {q.answers.map((a, ai) => (
                    <span key={ai} className={`text-xs px-2 py-1 rounded-lg text-white font-bold ${COLORS[ai]} ${a.correct ? "ring-2 ring-white" : "opacity-60"}`}>
                      {SHAPES[ai]} {a.text || "…"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(q)} className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg font-bold">Edit</button>
                <button onClick={() => deleteQuestion(q.id)} className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 text-red-200 text-sm rounded-lg font-bold">✕</button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={openNew}
          className="w-full py-4 border-2 border-dashed border-white/30 text-white/60 hover:border-white/60 hover:text-white rounded-2xl font-bold text-lg transition-colors"
        >
          + Add Question
        </button>
      </div>

      {/* Edit modal */}
      {draft && editingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={(e) => e.target === e.currentTarget && closeEditor()}>
          <div className="bg-gray-900 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col gap-5">
            <h2 className="text-2xl font-black text-white">
              {questions.find((q) => q.id === draft.id) ? "Edit Question" : "New Question"}
            </h2>

            {/* Question text */}
            <div>
              <label className="text-white/60 text-sm mb-1 block">Question</label>
              <textarea
                value={draft.text}
                onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                placeholder="What is the capital of France?"
                rows={2}
                className="w-full bg-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>

            {/* Time + Points */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-white/60 text-sm mb-1 block">Time limit</label>
                <select
                  value={draft.timeLimit}
                  onChange={(e) => setDraft({ ...draft, timeLimit: Number(e.target.value) })}
                  className="w-full bg-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {[5, 10, 15, 20, 30, 60].map((t) => <option key={t} value={t} className="bg-gray-900">{t}s</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-white/60 text-sm mb-1 block">Points</label>
                <select
                  value={draft.points}
                  onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
                  className="w-full bg-white/10 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {[500, 1000, 2000].map((p) => <option key={p} value={p} className="bg-gray-900">{p.toLocaleString()}</option>)}
                </select>
              </div>
            </div>

            {/* Answers */}
            <div>
              <label className="text-white/60 text-sm mb-2 block">Answers <span className="text-white/30">(click radio to mark correct)</span></label>
              <div className="flex flex-col gap-2">
                {draft.answers.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${COLORS[i]} bg-opacity-80`}>
                    <input
                      type="radio"
                      name="correct"
                      checked={a.correct ?? false}
                      onChange={() => setDraftAnswer(i, "correct", true)}
                      className="w-5 h-5 accent-white cursor-pointer"
                    />
                    <span className="text-white text-lg">{SHAPES[i]}</span>
                    <input
                      type="text"
                      value={a.text}
                      onChange={(e) => setDraftAnswer(i, "text", e.target.value)}
                      placeholder={`Answer ${i + 1}`}
                      className="flex-1 bg-transparent text-white font-bold placeholder:text-white/40 outline-none"
                    />
                    {a.correct && <span className="text-white text-lg">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={closeEditor} className="flex-1 py-3 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20">
                Cancel
              </button>
              <button onClick={saveEdit} className="flex-1 py-3 bg-white text-purple-800 rounded-xl font-black hover:scale-105 transition-transform">
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
