// pages/NewDeliveryPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { Truck, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { saveDelivery } from '../lib/deliveries-store';
import { toast } from 'sonner';

// === Schema de validação (inline para facilitar, mas pode ir em types/DeliverySchema.ts) ===
import { z } from 'zod';

export const deliverySchema = z.object({
    orderId: z
        .string()
        .min(1, 'ID do pedido é obrigatório')
        .regex(/^ENT-\d{4,}$/, 'Formato inválido. Use: ENT-1001'),
    driver: z.string().min(1, 'Motorista é obrigatório'),
    vehicle: z.string().optional(),
    destination: z.string().min(1, 'Destino é obrigatório'),
    category: z.enum([
        'Produtos Acabados',
        'Materiais Brutos',
        'Alimentos',
        'Peças',
    ]).default('Produtos Acabados'),
    scheduledDate: z.string().refine((date) => {
        const today = new Date().toISOString().split('T')[0];
        return date >= today;
    }, 'A data não pode ser no passado'),
});

export type DeliveryFormData = z.infer<typeof deliverySchema>;

// === Componente: Mensagem de Sucesso ===
function SuccessMessage({
    orderId,
    scheduledDate,
    onReset,
}: {
    orderId: string;
    scheduledDate: string;
    onReset: () => void;
}) {
    return (
        <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entrega cadastrada com sucesso!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                Pedido <strong>{orderId}</strong> agendado para{' '}
                {new Date(scheduledDate).toLocaleDateString('pt-BR')}.
            </p>
            <button
                type="button"
                onClick={onReset}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
                Cadastrar outra
            </button>
        </div>
    );
}

// === Componente: Campo de Formulário Reutilizável ===
interface FormFieldProps {
    label: string;
    name: string;
    error?: string;
    children: React.ReactNode;
}

export function FormField({ label, name, error, children }: FormFieldProps) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                {label}
            </label>
            {children}
            {error && (
                <p
                    className="text-red-500 text-xs mt-1 flex items-center"
                    id={`${name}-error`}
                    role="alert"
                >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {error}
                </p>
            )}
        </div>
    );
}

// === Utilitário de Data ===
export function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

// === Componente: Formulário de Entrega ===
function DeliveryForm({
    onSubmit,
    isLoading,
}: {
    onSubmit: SubmitHandler<DeliveryFormData>;
    isLoading: boolean;
}) {
    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<DeliveryFormData>({
        resolver: zodResolver(deliverySchema),
        defaultValues: {
            orderId: '',
            driver: '',
            vehicle: '',
            destination: '',
            category: 'Produtos Acabados',
            scheduledDate: getToday(),
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID do Pedido */}
                <FormField label="ID do Pedido *" name="orderId" error={errors.orderId?.message}>
                    <Controller
                        name="orderId"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="EX: ENT-1001"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.orderId ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                                aria-invalid={!!errors.orderId}
                                aria-describedby={errors.orderId ? 'orderId-error' : undefined}
                            />
                        )}
                    />
                </FormField>

                {/* Motorista */}
                <FormField label="Motorista *" name="driver" error={errors.driver?.message}>
                    <Controller
                        name="driver"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Nome completo"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.driver ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                                aria-invalid={!!errors.driver}
                                aria-describedby={errors.driver ? 'driver-error' : undefined}
                            />
                        )}
                    />
                </FormField>

                {/* Veículo */}
                <FormField label="Veículo" name="vehicle" error={errors.vehicle?.message}>
                    <Controller
                        name="vehicle"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Caminhão 123"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.vehicle ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                            />
                        )}
                    />
                </FormField>

                {/* Categoria */}
                <FormField label="Categoria" name="category" error={errors.category?.message}>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <select
                                {...field}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                            >
                                <option value="Produtos Acabados">Produtos Acabados</option>
                                <option value="Materiais Brutos">Materiais Brutos</option>
                                <option value="Alimentos">Alimentos</option>
                                <option value="Peças">Peças</option>
                            </select>
                        )}
                    />
                </FormField>

                {/* Origem (fixa) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Origem</label>
                    <input
                        type="text"
                        value="Fábrica Central"
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-white/15 rounded-lg text-gray-500 dark:text-slate-400"
                    />
                </div>

                {/* Destino */}
                <FormField label="Destino *" name="destination" error={errors.destination?.message}>
                    <Controller
                        name="destination"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="text"
                                placeholder="Ex: Distribuidor SP"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.destination ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                                aria-invalid={!!errors.destination}
                                aria-describedby={errors.destination ? 'destination-error' : undefined}
                            />
                        )}
                    />
                </FormField>

                {/* Data de Saída */}
                <FormField
                    label="Data de Saída *"
                    name="scheduledDate"
                    error={errors.scheduledDate?.message}
                >
                    <Controller
                        name="scheduledDate"
                        control={control}
                        render={({ field }) => (
                            <input
                                {...field}
                                type="date"
                                min={getToday()}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300 dark:border-white/15'
                                    }`}
                                aria-invalid={!!errors.scheduledDate}
                                aria-describedby={errors.scheduledDate ? 'scheduledDate-error' : undefined}
                            />
                        )}
                    />
                </FormField>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Salvando...</span>
                        </>
                    ) : (
                        <span>Cadastrar Entrega</span>
                    )}
                </button>
            </div>
        </form>
    );
}

// === Página Principal: Nova Entrega ===
export function NewDeliveryPage() {
    const { user } = useAuth();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState<DeliveryFormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<DeliveryFormData> = async (data) => {
        setIsLoading(true);
        // Persistência local (sem backend ainda) — vai pro deliveries-store
        await new Promise((resolve) => setTimeout(resolve, 600));
        saveDelivery({
            orderId: data.orderId,
            driver: data.driver,
            vehicle: data.vehicle ?? '',
            route: '',
            category: data.category,
            status: 'pendente',
            scheduledDate: data.scheduledDate,
            origin: 'Fábrica Central',
            destination: data.destination,
            distanceKm: 0,
            estimatedTimeHours: 0,
        });
        toast.success(`Entrega ${data.orderId} cadastrada.`);
        setFormData(data);
        setIsSubmitted(true);
        setIsLoading(false);
    };

    const handleReset = () => {
        setIsSubmitted(false);
        setFormData(null);
    };

    return (
        <div className="space-y-8 px-4 lg:px-8 py-6 w-full">
            {/* Header SaaS */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                        Voltar
                    </button>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Nova entrega</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Cadastre uma nova saída de produto da fábrica</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] rounded-md shrink-0">
                    <User className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span className="truncate max-w-[160px]">{user?.name}</span>
                </div>
            </div>

            {/* Formulário ou Mensagem de Sucesso */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm"
            >
                {isSubmitted && formData ? (
                    <SuccessMessage
                        orderId={formData.orderId}
                        scheduledDate={formData.scheduledDate}
                        onReset={handleReset}
                    />
                ) : (
                    <DeliveryForm onSubmit={onSubmit} isLoading={isLoading} />
                )}
            </motion.div>
        </div>
    );
}