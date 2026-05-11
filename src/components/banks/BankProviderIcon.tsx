/**
 * Renderiza o logo do provider bancário.
 * Use no select de "Emitir boleto", na lista de boletos, etc.
 */

interface Props {
    provider: string;
    size?: number;
    showLabel?: boolean;
    className?: string;
}

const LOGOS: Record<string, { url: string; label: string; bg?: string }> = {
    ITAU: {
        url: 'https://cdn.cookielaw.org/logos/6b908171-e777-49b0-ae1d-9d82e59fd5f4/018f9654-92af-7d58-b7ab-6dff9491fd6f/86ed9210-885e-4932-ab55-e9141fcf9ec1/itau-logo-0.png',
        label: 'Itaú',
        bg: 'bg-white',
    },
    BB: {
        url: 'https://play-lh.googleusercontent.com/1-aNhsSPNqiVluwNGZar_7F5PbQ4u1zteuJ1jumnArhe8bfYHHaVwu4aVOF5-NAmLaA=s256-rw',
        label: 'Banco do Brasil',
        bg: 'bg-white',
    },
    MOCK: {
        url: '',
        label: 'Teste (Mock)',
    },
};

export function BankProviderIcon({ provider, size = 20, showLabel = false, className = '' }: Props) {
    const meta = LOGOS[provider.toUpperCase()];
    if (!meta) {
        return showLabel ? (
            <span className={`text-[11px] uppercase tracking-wider text-slate-500 ${className}`}>
                {provider}
            </span>
        ) : null;
    }

    if (provider.toUpperCase() === 'MOCK') {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded ${className}`}
            >
                🧪 {showLabel ? meta.label : 'MOCK'}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
            <span
                className={`inline-flex items-center justify-center rounded overflow-hidden ${meta.bg ?? ''} ring-1 ring-slate-200 dark:ring-white/10`}
                style={{ width: size, height: size }}
            >
                <img
                    src={meta.url}
                    alt={meta.label}
                    className="w-full h-full object-contain p-0.5"
                    loading="lazy"
                />
            </span>
            {showLabel && <span className="text-[12.5px] font-medium">{meta.label}</span>}
        </span>
    );
}
