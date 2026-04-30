/**
 * Upload de arquivos para o bucket Cloudflare R2 (gestao-int).
 *
 * Padrão presigned URL (recomendado para R2):
 *   1. Frontend pede ao backend uma URL assinada (PUT) curta-vida.
 *   2. Frontend faz PUT direto no R2 sem passar pelo servidor —
 *      preserva banda do backend e escala bem.
 *   3. Backend retorna a URL pública persistente do objeto.
 *
 * O backend deve expor:
 *   POST /api/storage/sign
 *     body: { filename, contentType, folder }
 *     resp: { uploadUrl, publicUrl, key, expiresIn }
 *
 * Endpoint do bucket: https://a252dc75a2305508290f0658d1fb21b2.r2.cloudflarestorage.com/gestao-int
 *
 * Para domínio público customizado (ex: cdn.dominio.com.br) o backend
 * deve retornar a URL pública correta em `publicUrl`.
 */

import { API_BASE, authHeaders as sharedAuthHeaders } from './api';

const STORAGE_API =
  (import.meta.env.VITE_STORAGE_API as string | undefined) ??
  `${API_BASE}/api/storage`;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

export interface UploadedAsset {
  url: string;            // URL pública persistente
  key: string;            // chave no bucket (folder/filename-hash.ext)
  filename: string;       // nome original
  size: number;           // bytes
  contentType: string;
}

export class UploadError extends Error {
  constructor(message: string, readonly code: 'invalid-type' | 'too-large' | 'sign-failed' | 'upload-failed' = 'upload-failed') {
    super(message);
    this.name = 'UploadError';
  }
}

export function validateImage(file: File): void {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new UploadError(
      `Formato não suportado. Use JPG, PNG, WebP, AVIF ou GIF.`,
      'invalid-type',
    );
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite de 5 MB.`,
      'too-large',
    );
  }
}

interface SignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn?: number;
}

const authHeaders = sharedAuthHeaders;

async function getSignedUploadUrl(file: File, folder: string): Promise<SignedUrlResponse> {
  const res = await fetch(`${STORAGE_API}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder,
    }),
  });

  if (!res.ok) {
    throw new UploadError(`Falha ao obter URL de upload (${res.status})`, 'sign-failed');
  }

  return res.json();
}

/**
 * Faz upload de uma imagem para o bucket.
 * @param file imagem do produto
 * @param folder pasta lógica no bucket (default: "products")
 * @param onProgress callback opcional com progresso 0..1
 */
export async function uploadProductImage(
  file: File,
  folder: string = 'products',
  onProgress?: (progress: number) => void,
): Promise<UploadedAsset> {
  validateImage(file);

  const signed = await getSignedUploadUrl(file, folder);

  // PUT direto pro R2 com XMLHttpRequest (suporta progress events)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signed.uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`Falha no upload (${xhr.status})`, 'upload-failed'));
    };
    xhr.onerror = () => reject(new UploadError('Erro de rede no upload', 'upload-failed'));
    xhr.onabort = () => reject(new UploadError('Upload cancelado', 'upload-failed'));

    xhr.send(file);
  });

  return {
    url: signed.publicUrl,
    key: signed.key,
    filename: file.name,
    size: file.size,
    contentType: file.type,
  };
}

/**
 * Remove um asset previamente carregado.
 * Backend deve expor: DELETE /api/storage/{key} — usar key retornado por upload.
 */
export async function deleteAsset(key: string): Promise<void> {
  const res = await fetch(`${STORAGE_API}/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    throw new UploadError(`Falha ao remover (${res.status})`);
  }
}
