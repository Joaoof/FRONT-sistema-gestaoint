import { Search } from 'lucide-react';

interface InputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: InputProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
        </div>
    );
}