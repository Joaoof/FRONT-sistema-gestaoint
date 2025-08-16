import { z } from 'zod';

export const payableSchema = z.object({
    supplierName: z.string().min(1, 'Fornecedor é obrigatório'),
    value: z.number().positive('Valor deve ser maior que 0'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    dueDate: z.string().refine(date => new Date(date) >= new Date(0), 'Data inválida'),
    status: z.enum(['pendente', 'pago', 'vencido']).default('pendente'),
});