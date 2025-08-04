// src/utils/exportPDF.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (receivables: any[], payables: any[]) => {
    const doc = new jsPDF();

    // Contas a Receber
    doc.text('Contas a Receber', 14, 16);
    (doc as any).autoTable({
        head: [['Cliente', 'Descrição', 'Valor', 'Vencimento', 'Status']],
        body: receivables.map(r => [
            r.clientName,
            r.description,
            `R$ ${r.value.toFixed(2)}`,
            new Date(r.dueDate).toLocaleDateString('pt-BR'),
            r.status
        ]),
        startY: 20
    });

    // Contas a Pagar
    doc.addPage();
    doc.text('Contas a Pagar', 14, 16);
    (doc as any).autoTable({
        head: [['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status']],
        body: payables.map(p => [
            p.supplierName,
            p.description,
            `R$ ${p.value.toFixed(2)}`,
            new Date(p.dueDate).toLocaleDateString('pt-BR'),
            p.status
        ]),
        startY: 20
    });

    doc.save(`relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.pdf`);
};