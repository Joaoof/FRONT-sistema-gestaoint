import { FileText } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center py-10">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma conta encontrada</h3>
      <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou adicione uma nova conta.</p>
    </div>
  );
}