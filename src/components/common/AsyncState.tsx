import { ReactNode } from 'react';

interface AsyncStateProps {
  loading: boolean;
  error?: Error;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
}

export function AsyncState({ loading, error, isEmpty, emptyMessage, children }: AsyncStateProps) {
  if (loading) {
    return <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">Carregando...</div>;
  }

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>;
  }

  if (isEmpty) {
    return <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{emptyMessage}</div>;
  }

  return <>{children}</>;
}
