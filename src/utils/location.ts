/**
 * Helpers de geolocalização e endereço.
 * - ViaCEP (https://viacep.com.br/) para autocomplete de endereço por CEP
 * - navigator.geolocation para capturar coords do dispositivo
 * - Nominatim/OpenStreetMap para reverse-geocoding (sem API key)
 * - Haversine para cálculo de distância em km
 */

export interface ViaCepResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string; // cidade
    uf: string;
    erro?: boolean;
}

export interface AddressFields {
    cep?: string;
    address?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
}

export interface CoordsResult {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

const CEP_RE = /^\d{8}$/;

export async function lookupCep(cepRaw: string): Promise<AddressFields | null> {
    const cep = cepRaw.replace(/\D/g, '');
    if (!CEP_RE.test(cep)) return null;
    try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!res.ok) return null;
        const data: ViaCepResponse = await res.json();
        if (data.erro) return null;
        return {
            cep: data.cep,
            address: [data.logradouro, data.complemento].filter(Boolean).join(', '),
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf,
        };
    } catch {
        return null;
    }
}

export function getCurrentPosition(timeoutMs = 8000): Promise<CoordsResult> {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Seu navegador não suporta geolocalização.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) =>
                resolve({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                }),
            (err) => {
                let msg = 'Não foi possível obter sua localização.';
                if (err.code === err.PERMISSION_DENIED) {
                    msg = 'Permissão de localização negada. Habilite no navegador.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    msg = 'Localização indisponível no momento.';
                } else if (err.code === err.TIMEOUT) {
                    msg = 'Tempo esgotado tentando obter localização.';
                }
                reject(new Error(msg));
            },
            { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
        );
    });
}

interface NominatimAddress {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    'ISO3166-2-lvl4'?: string;
    postcode?: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<AddressFields | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=pt-BR&zoom=18`;
        const res = await fetch(url, {
            headers: {
                // Nominatim exige User-Agent ou Referer; navegador já manda Referer.
                Accept: 'application/json',
            },
        });
        if (!res.ok) return null;
        const data = await res.json();
        const addr: NominatimAddress = data.address ?? {};
        const street = [addr.road, addr.house_number].filter(Boolean).join(', ');
        const uf = addr['ISO3166-2-lvl4']?.split('-')[1] ?? null;
        return {
            address: street || undefined,
            bairro: addr.suburb ?? addr.neighbourhood ?? undefined,
            cidade: addr.city ?? addr.town ?? addr.village ?? undefined,
            estado: uf ?? undefined,
            cep: addr.postcode?.replace(/\D/g, '') ?? undefined,
        };
    } catch {
        return null;
    }
}

/**
 * Distância em quilômetros entre duas coordenadas (fórmula de Haversine).
 */
export function distanceKm(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
): number {
    const R = 6371;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/**
 * Gera URL do Google Maps abrindo a rota da origem (latLng ou endereço) até o destino.
 */
export function googleMapsRouteUrl(
    origin: string | { latitude: number; longitude: number } | null,
    destination: string | { latitude: number; longitude: number },
): string {
    const fmt = (p: any) =>
        typeof p === 'string'
            ? encodeURIComponent(p)
            : `${p.latitude},${p.longitude}`;
    const dest = fmt(destination);
    if (!origin) {
        return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${fmt(origin)}&destination=${dest}&travelmode=driving`;
}
