// pages/NewDeliveryPage.tsx
import { useAuth } from '../contexts/AuthContext';
import { Truck, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';

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
                <Truck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Entrega cadastrada com sucesso!</h3>
            <p className="text-sm text-gray-500 mt-1">
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
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.orderId ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.driver ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.vehicle ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.category ? 'border-red-500' : 'border-gray-300'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origem</label>
                    <input
                        type="text"
                        value="Fábrica Central"
                        disabled
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.destination ? 'border-red-500' : 'border-gray-300'
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
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors.scheduledDate ? 'border-red-500' : 'border-gray-300'
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
        // Simulação de chamada à API
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log('Nova entrega cadastrada:', data);
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
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white border-b border-gray-200 px-6 py-5 rounded-xl shadow-sm"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-['Rubik']">
                            Nova Entrega
                        </h1>
                        <p className="text-sm text-gray-600 mt-1.5">
                            Cadastre uma nova saída de produto da fábrica.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-5 h-5 text-gray-500" />
                        <span>{user?.name}</span>
                    </div>
                </div>
            </motion.div>

            {/* Botão de Voltar */}
            <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition"
                aria-label="Voltar para a página anterior"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Voltar</span>
            </motion.button>

            {/* Formulário ou Mensagem de Sucesso */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
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