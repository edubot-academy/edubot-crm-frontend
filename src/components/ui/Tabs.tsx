export type TabItem = { key: string; label: string };
export function Tabs({ value, onChange, items }: { value: string; onChange: (k: string) => void; items: TabItem[] }) {
    return (
        <div className="flex items-center gap-2 bg-gray-50 border rounded-xl p-1 w-fit">
            {items.map((it) => (
                <button
                    key={it.key}
                    onClick={() => onChange(it.key)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${value === it.key ? 'bg-white border shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    {it.label}
                </button>
            ))}
        </div>
    );
}