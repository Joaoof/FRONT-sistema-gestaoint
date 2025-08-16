import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useState } from 'react';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const selected = value ? new Date(value) : undefined;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-red-500 flex items-center"
            >
                <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                {selected ? format(selected, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg p-3">
                    <DayPicker
                        mode="single"
                        selected={selected}
                        onSelect={(date) => {
                            if (date) onChange(date.toISOString().slice(0, 16));
                            setOpen(false);
                        }}
                        locale={ptBR}
                        captionLayout="dropdown"
                        fromYear={2020}
                        toYear={2030}
                    />
                </div>
            )}
        </div>
    );
}