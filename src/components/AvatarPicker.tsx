"use client"

export const AVATARS = [
  { emoji: "🦊", bg: "bg-orange-500",  label: "Fox"      },
  { emoji: "🐼", bg: "bg-slate-400",   label: "Panda"    },
  { emoji: "🦁", bg: "bg-yellow-500",  label: "Lion"     },
  { emoji: "🐸", bg: "bg-green-500",   label: "Frog"     },
  { emoji: "🦄", bg: "bg-pink-500",    label: "Unicorn"  },
  { emoji: "🐨", bg: "bg-sky-400",     label: "Koala"    },
  { emoji: "🦖", bg: "bg-emerald-600", label: "Dino"     },
  { emoji: "🐺", bg: "bg-gray-500",    label: "Wolf"     },
  { emoji: "🦋", bg: "bg-violet-500",  label: "Butterfly"},
  { emoji: "🐬", bg: "bg-cyan-500",    label: "Dolphin"  },
  { emoji: "🦉", bg: "bg-amber-700",   label: "Owl"      },
  { emoji: "🐶", bg: "bg-orange-300",  label: "Dog"      },
  { emoji: "🐯", bg: "bg-orange-600",  label: "Tiger"    },
  { emoji: "🐮", bg: "bg-lime-400",    label: "Cow"      },
  { emoji: "🐷", bg: "bg-pink-300",    label: "Pig"      },
  { emoji: "🐵", bg: "bg-yellow-700",  label: "Monkey"   },
]

export function getAvatarBg(emoji: string): string {
  return AVATARS.find((a) => a.emoji === emoji)?.bg ?? "bg-purple-500"
}

type Props = {
  selected: string | null
  onSelect: (emoji: string) => void
}

export default function AvatarPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
      {AVATARS.map(({ emoji, bg, label }) => {
        const isSelected = selected === emoji
        return (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            title={label}
            className={`
              relative flex items-center justify-center rounded-2xl aspect-square text-4xl
              transition-all duration-150 select-none cursor-pointer
              ${bg}
              ${isSelected
                ? "ring-4 ring-white scale-110 shadow-lg shadow-white/20"
                : "opacity-80 hover:opacity-100 hover:scale-105 active:scale-95"}
            `}
          >
            {emoji}
            {isSelected && (
              <span className="absolute -top-1 -right-1 bg-white text-purple-800 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
