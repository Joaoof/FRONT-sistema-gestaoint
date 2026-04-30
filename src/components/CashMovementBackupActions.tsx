import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import Dropzone from 'react-dropzone';
import { Download, Upload, FileUp, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportMovements,
  importMovements,
  type ImportResult,
} from '../lib/cash-movement-backup';

interface Props {
  /** chamado após import bem-sucedido — útil pra refetch da listagem */
  onImported?: () => void;
}

export function CashMovementBackupActions({ onImported }: Props) {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const filename = await exportMovements();
      toast.success(`Exportado: ${filename}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao exportar movimentações',
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50 transition-colors"
        aria-label="Exportar movimentações"
      >
        <Download className="w-3.5 h-3.5" strokeWidth={2} />
        <span>{exporting ? 'Exportando…' : 'Exportar'}</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
        aria-label="Importar movimentações"
      >
        <Upload className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Importar</span>
      </button>

      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        onImported={onImported}
      />
    </>
  );
}

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

function ImportDialog({ open, onOpenChange, onImported }: DialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
    setTimeout(reset, 200);
  };

  const handleFile = async (selected: File) => {
    setFile(selected);
    setResult(null);
    const text = await selected.text();
    const lines = text.replace(/^﻿/, '').split(/\r?\n/).slice(0, 6);
    const sep = lines[0]?.includes(';') ? ';' : ',';
    setPreview(lines.filter(Boolean).map((l) => l.split(sep)));
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    try {
      const text = await file.text();
      const res = await importMovements(text);
      setResult(res);
      if (res.inserted > 0) {
        toast.success(`${res.inserted} movimentação(ões) importada(s)`);
        onImported?.();
      } else if (res.errors.length === 0) {
        toast.info('Nenhuma movimentação nova — já estavam no sistema');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Falha ao importar',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(560px,92vw)] max-h-[85vh] overflow-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
            <Dialog.Title className="text-[15px] font-semibold text-slate-900 dark:text-white">
              Importar movimentações
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 space-y-4">
            {!result && (
              <>
                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  Envie um CSV gerado pela exportação. Linhas com{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-[12px]">
                    id
                  </code>{' '}
                  já existente são ignoradas — re-importar o mesmo backup é seguro.
                </p>

                <Dropzone
                  multiple={false}
                  accept={{ 'text/csv': ['.csv'], 'text/plain': ['.csv', '.txt'] }}
                  onDrop={(files) => files[0] && handleFile(files[0])}
                >
                  {({ getRootProps, getInputProps, isDragActive }) => (
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
                          : 'border-slate-300 dark:border-white/15 hover:border-slate-400'
                      }`}
                    >
                      <input {...getInputProps()} />
                      <FileUp className="w-7 h-7 mx-auto text-slate-400 mb-2" />
                      {file ? (
                        <p className="text-[13px] text-slate-700 dark:text-slate-200">
                          <strong>{file.name}</strong>{' '}
                          <span className="text-slate-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </p>
                      ) : (
                        <p className="text-[13px] text-slate-600 dark:text-slate-400">
                          Arraste o CSV aqui ou clique para selecionar
                        </p>
                      )}
                    </div>
                  )}
                </Dropzone>

                {preview && preview.length > 0 && (
                  <div className="border border-slate-200 dark:border-white/10 rounded-lg overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead className="bg-slate-50 dark:bg-white/[0.04]">
                        <tr>
                          {preview[0].map((h, i) => (
                            <th key={i} className="px-2 py-1.5 text-left font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.slice(1, 4).map((row, ri) => (
                          <tr key={ri} className="border-t border-slate-100 dark:border-white/[0.06]">
                            {row.map((c, ci) => (
                              <td key={ci} className="px-2 py-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {c}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-2 py-1.5 text-[11px] text-slate-500 border-t border-slate-100 dark:border-white/[0.06]">
                      Pré-visualização das 3 primeiras linhas.
                    </p>
                  </div>
                )}
              </>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[14px] font-medium text-slate-900 dark:text-white">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Importação concluída
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Stat label="Total" value={result.total} />
                  <Stat label="Inseridas" value={result.inserted} tone="green" />
                  <Stat label="Ignoradas" value={result.skipped} tone="amber" />
                </div>
                {result.errors.length > 0 && (
                  <div className="border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-rose-700 dark:text-rose-300 mb-2">
                      <AlertCircle className="w-4 h-4" />
                      {result.errors.length} linha(s) com erro
                    </div>
                    <ul className="text-[12px] text-rose-700 dark:text-rose-300 max-h-40 overflow-auto space-y-0.5">
                      {result.errors.map((e, i) => (
                        <li key={i}>
                          <strong>Linha {e.line}:</strong> {e.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-b-xl">
            {!result ? (
              <>
                <button
                  onClick={handleClose}
                  disabled={submitting}
                  className="h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!file || submitting}
                  className="h-8 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-50"
                >
                  {submitting ? 'Importando…' : 'Importar'}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="h-8 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
              >
                Fechar
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Stat({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'green' | 'amber';
}) {
  const colors = {
    slate: 'text-slate-700 dark:text-slate-200',
    green: 'text-emerald-700 dark:text-emerald-400',
    amber: 'text-amber-700 dark:text-amber-400',
  } as const;
  return (
    <div className="rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-0.5 text-[18px] font-semibold tabular-nums ${colors[tone]}`}>
        {value}
      </p>
    </div>
  );
}
