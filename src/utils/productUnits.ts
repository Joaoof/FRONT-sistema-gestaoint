export interface UnitOption {
    value: string;
    label: string;
}

export const PRODUCT_UNITS: UnitOption[] = [
    { value: 'UN', label: 'Unidade' },
    { value: 'PC', label: 'Pacote' },
    { value: 'CX', label: 'Caixa' },
    { value: 'DZ', label: 'Dúzia' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'G', label: 'Grama' },
    { value: 'T', label: 'Tonelada' },
    { value: 'L', label: 'Litro' },
    { value: 'ML', label: 'Mililitro' },
    { value: 'M', label: 'Metro' },
    { value: 'CM', label: 'Centímetro' },
    { value: 'M2', label: 'Metro quadrado (m²)' },
    { value: 'M3', label: 'Metro cúbico (m³)' },
    { value: 'SC', label: 'Saco' },
    { value: 'PR', label: 'Par' },
    { value: 'RL', label: 'Rolo' },
    { value: 'BD', label: 'Balde' },
    { value: 'GL', label: 'Galão' },
];

const UNIT_MAP = new Map(PRODUCT_UNITS.map((u) => [u.value, u.label]));

export function unitLabel(value: string | null | undefined): string {
    if (!value) return '—';
    return UNIT_MAP.get(value) ?? value;
}

export function isKnownUnit(value: string | null | undefined): boolean {
    return !!value && UNIT_MAP.has(value);
}
