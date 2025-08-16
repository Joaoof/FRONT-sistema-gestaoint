import { NumberFormatBase } from 'react-number-format';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    error?: string;
}

export function CurrencyInput({ value, onChange, error }: CurrencyInputProps) {
    return (
        <NumberFormatBase
            value={value}
            onValueChange={(values) => onChange(values.floatValue || 0)}
            prefix="R$ "
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${error ? 'border-red-500 pl-10' : 'border-gray-300 pl-10'
                }`}
        />
    );
}