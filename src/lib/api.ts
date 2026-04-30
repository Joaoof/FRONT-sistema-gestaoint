/**
 * Base URL única pra chamadas REST contra a API.
 *
 * Resolução, na ordem:
 *   1. VITE_API_URL              (recomendado — setar no Netlify em produção)
 *   2. VITE_GRAPHQL_ENDPOINT     (deriva removendo "/graphql" do final)
 *   3. ""                         (mesmo origin — só funciona se houver proxy)
 *
 * Evite hardcode de hosts em produção: sem VITE_API_URL, requests REST
 * vão pro próprio host do front (ex: gestaoint.netlify.app/api/...) e quebram.
 */

function resolveApiBase(): string {
  const explicit = import.meta.env.VITE_API_URL as string | undefined;
  if (explicit) return explicit.replace(/\/$/, '');

  const graphql = import.meta.env.VITE_GRAPHQL_ENDPOINT as string | undefined;
  if (graphql) return graphql.replace(/\/graphql\/?$/, '').replace(/\/$/, '');

  if (import.meta.env.PROD) {
    // Em produção, sem env definida, qualquer fetch relativo bate no host do front.
    console.warn(
      '[api] VITE_API_URL não definido em produção — chamadas REST vão falhar. Configure no Netlify.',
    );
  }
  return '';
}

export const API_BASE = resolveApiBase();

export function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('accessToken')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
