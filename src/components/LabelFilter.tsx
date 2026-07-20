import { useAppStore } from '../store/useAppStore'

interface Props {
  labels: string[]
}

export default function LabelFilter({ labels }: Props) {
  const { activeLabels, toggleLabel, setActiveLabels } = useAppStore()

  if (labels.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        onClick={() => setActiveLabels([])}
        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
          activeLabels.length === 0
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
        }`}
      >
        すべて
      </button>
      {labels.map((label) => (
        <button
          key={label}
          onClick={() => toggleLabel(label)}
          className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
            activeLabels.includes(label)
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
