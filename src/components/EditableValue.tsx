import { useState } from 'react';

interface EditableValueProps {
    value: number;
    onChange: (value: number) => void;
    format?: 'currency';
    color: 'green' | 'red' | 'blue' | 'gray';
    readOnly?: boolean;
}

export function EditableValue({
    value,
    onChange,
    format = 'currency',
    color,
    readOnly = false,
}: EditableValueProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState<string>(value.toFixed(2));

    const displayValue =
        format === 'currency' ? `R$ ${value.toFixed(2)}` : value.toString();

    const handleDoubleClick = () => {
        if (readOnly) return;
        setIsEditing(true);
        setEditValue(value.toFixed(2));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
    };

    const handleBlur = () => {
        const parsed = parseFloat(editValue);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setEditValue(value.toFixed(2));
            setIsEditing(false);
        }
    };

    return (
        <p
            onDoubleClick={handleDoubleClick}
            className={`text-2xl font-bold cursor-pointer ${color === 'green'
                    ? 'text-green-900'
                    : color === 'red'
                        ? 'text-red-900'
                        : color === 'blue'
                            ? 'text-blue-900'
                            : 'text-gray-900'
                }`}
        >
            {isEditing ? (
                <input
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-32 p-1 text-lg border-b-2 border-dashed border-gray-400 text-right focus:border-blue-500 outline-none"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                displayValue
            )}
        </p>
    );
}