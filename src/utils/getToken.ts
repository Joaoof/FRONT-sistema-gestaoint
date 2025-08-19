export function getUserIdFromToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id || null; // ajuste conforme seu JWT
    } catch (e) {
        console.error('Erro ao decodificar token', e);
        return null;
    }
}