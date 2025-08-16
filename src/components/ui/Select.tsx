interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export function FilterSelect({ value, onChange, options }: SelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-36"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}