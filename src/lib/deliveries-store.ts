import type { Delivery } from '../types';

const STORAGE_KEY = 'deliveries-store-v1';

const SEED: Delivery[] = [
    { id: '1', orderId: 'ENT-1001', driver: 'Carlos Silva', vehicle: 'Caminhão 123', route: 'Rota A', category: 'Produtos Acabados', status: 'entregue', scheduledDate: '2025-03-01', deliveryDate: '2025-03-01', origin: 'Fábrica Central', destination: 'Distribuidor SP', distanceKm: 120, estimatedTimeHours: 2 },
    { id: '2', orderId: 'ENT-1002', driver: 'Ana Souza', vehicle: 'Van 456', route: 'Rota B', category: 'Materiais Brutos', status: 'em rota', scheduledDate: '2025-03-02', origin: 'Porto Santos', destination: 'Fábrica Central', distanceKm: 80, estimatedTimeHours: 1.5 },
    { id: '3', orderId: 'ENT-1003', driver: 'João Lima', vehicle: 'Caminhão 789', route: 'Rota C', category: 'Produtos Acabados', status: 'atrasado', scheduledDate: '2025-03-01', origin: 'Fábrica Central', destination: 'Distribuidor RJ', distanceKm: 400, estimatedTimeHours: 6 },
    { id: '4', orderId: 'ENT-1004', driver: 'Maria Oliveira', vehicle: 'Van 101', route: 'Rota A', category: 'Alimentos', status: 'pendente', scheduledDate: '2025-03-03', origin: 'Fábrica Central', destination: 'Supermercado BH', distanceKm: 600, estimatedTimeHours: 8 },
    { id: '5', orderId: 'ENT-1005', driver: 'Pedro Costa', vehicle: 'Caminhão 123', route: 'Rota D', category: 'Produtos Acabados', status: 'entregue', scheduledDate: '2025-03-02', deliveryDate: '2025-03-02', origin: 'Fábrica Central', destination: 'Atacado Curitiba', distanceKm: 180, estimatedTimeHours: 3 },
];

const EVENT = 'deliveries-store:changed';

export function listDeliveries(): Delivery[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
            return SEED;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : SEED;
    } catch {
        return SEED;
    }
}

export function saveDelivery(d: Omit<Delivery, 'id'> & { id?: string }): Delivery {
    const all = listDeliveries();
    const id = d.id ?? `D-${Date.now()}`;
    const next: Delivery = { ...d, id } as Delivery;
    const updated = [next, ...all.filter((x) => x.id !== id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT));
    return next;
}

export function updateDeliveryStatus(id: string, status: Delivery['status']): void {
    const all = listDeliveries();
    const updated = all.map((d) =>
        d.id === id
            ? { ...d, status, deliveryDate: status === 'entregue' ? new Date().toISOString().slice(0, 10) : d.deliveryDate }
            : d,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeDeliveries(cb: () => void): () => void {
    const handler = () => cb();
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
        window.removeEventListener(EVENT, handler);
        window.removeEventListener('storage', handler);
    };
}
