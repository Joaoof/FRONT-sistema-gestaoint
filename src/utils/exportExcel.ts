// src/utils/exportExcel.ts
import * as XLSX from 'xlsx';

export const exportToExcel = (receivables: any[], payables: any[]) => {
    const ws1 = XLSX.utils.json_to_sheet(
        receivables.map(r => ({
            Cliente: r.clientName,
            Descrição: r.description,
            Valor: r.value,
            'Vencimento': r.dueDate,
            Status: r.status
        }))
    );

    const ws2 = XLSX.utils.json_to_sheet(
        payables.map(p => ({
            Fornecedor: p.supplierName,
            Descrição: p.description,
            Valor: p.value,
            'Vencimento': p.dueDate,
            Status: p.status
        }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'A Receber');
    XLSX.utils.book_append_sheet(wb, ws2, 'A Pagar');

    XLSX.writeFile(wb, `relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.xlsx`);
};