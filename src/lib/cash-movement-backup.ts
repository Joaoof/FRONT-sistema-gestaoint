/**
 * Cliente REST para backup/restauração de movimentações de caixa.
 *
 * Endpoints expostos pelo backend:
 *   GET  /api/cash-movements/export            -> baixa CSV (UTF-8 com BOM, ;)
 *   POST /api/cash-movements/import { csv }    -> insere movimentações em lote
 *
 * Re-importar o mesmo backup é idempotente: linhas com `id` já existente
 * são ignoradas (`skipDuplicates`).
 */

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.VITE_GRAPHQL_ENDPOINT as string | undefined)?.replace(
    /\/graphql\/?$/,
    '',
  ) ??
  '';

const ENDPOINT = `${API_BASE}/api/cash-movements`;

export interface ImportError {
  line: number;
  message: string;
}

export interface ImportResult {
  total: number;
  inserted: number;
  skipped: number;
  errors: ImportError[];
}

export interface ExportRange {
  start?: string; // ISO date
  end?: string;   // ISO date
}

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('accessToken')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQuery(range?: ExportRange): string {
  if (!range) return '';
  const params = new URLSearchParams();
  if (range.start) params.set('start', range.start);
  if (range.end) params.set('end', range.end);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Baixa o CSV de movimentações e dispara o download no navegador.
 * @returns o nome do arquivo salvo
 */
export async function exportMovements(range?: ExportRange): Promise<string> {
  const res = await fetch(`${ENDPOINT}/export${buildQuery(range)}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Falha ao exportar (${res.status})`);
  }

  const blob = await res.blob();
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = filenameFromDisposition(
    res.headers.get('Content-Disposition'),
  ) ?? `movimentacoes-${stamp}.csv`;

  triggerDownload(blob, filename);
  return filename;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function importMovements(csv: string): Promise<ImportResult> {
  const res = await fetch(`${ENDPOINT}/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ csv }),
  });

  if (!res.ok) {
    const msg = await safeReadText(res);
    throw new Error(msg || `Falha ao importar (${res.status})`);
  }

  return res.json();
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return m ? decodeURIComponent(m[1]) : null;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === 'string') return data.message;
    return JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }
}
