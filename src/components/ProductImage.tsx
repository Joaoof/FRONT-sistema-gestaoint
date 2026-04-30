import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
    src?: string | null;
    alt?: string;
    className?: string;
    fallbackClassName?: string;
    iconSize?: number;
}

/**
 * Imagem com fallback gracioso quando a URL falha (404, CORS, R2 mal configurado).
 * Mostra ícone de Package ao invés de quebrar o layout.
 */
export function ProductImage({
    src,
    alt = '',
    className = '',
    fallbackClassName = '',
    iconSize = 16,
}: ProductImageProps) {
    const [errored, setErrored] = useState(false);

    if (!src || errored) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-100 dark:bg-white/[0.05] text-slate-400 ${fallbackClassName || className}`}
                aria-label={alt || 'Imagem indisponível'}
                role="img"
            >
                <Package
                    className="opacity-60"
                    style={{ width: iconSize, height: iconSize }}
                    strokeWidth={1.5}
                />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setErrored(true)}
            className={className}
        />
    );
}
