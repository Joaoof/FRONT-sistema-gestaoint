import React from 'react';
import {
    HelpCircle,
    MessageSquare,
    Truck,
    DollarSign,
    Box,
    ArrowLeft,
    Layers, // Usando Layers para representar Fiscal/Financeiro
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simulação de carregamento de arquivos JSON por módulo:
// Conteúdo que viria de src/data/help/faq_fiscal.json, src/data/help/faq_estoque.json, etc.
const FAQ_ITEMS_DATA = [
    {
        question: 'O que é o módulo Fiscal?',
        answer: 'O módulo Fiscal permite a gestão completa das Contas a Receber e Contas a Pagar (despesas, fornecedores) da sua empresa, centralizando o controle financeiro.',
        icon: DollarSign, // LucideIcon Component
        color: 'blue',
        path: '/fiscal-receber',
    },
    {
        question: 'Como faço uma nova entrada ou saída de produto no estoque?',
        answer: 'Você registra entradas (compras) na página "Estoque" (Entrada de Produtos) e saídas (vendas ou perdas) na página "Vendas" (Saída de Produtos).',
        icon: Box,
        color: 'green',
        path: '/estoque',
    },
    {
        question: 'Onde vejo o histórico detalhado do meu caixa?',
        answer: 'O histórico detalhado de todas as movimentações (vendas, despesas, saques, etc.) pode ser acessado na página "Histórico de Movimentações".',
        icon: Layers,
        color: 'red',
        path: '/historico-movimentacao',
    },
    {
        question: 'Como funciona o Módulo de Entregas e Rotas?',
        answer: 'Este módulo permite cadastrar novas entregas, agendar rotas para motoristas e veículos, e acessar relatórios de desempenho e pontualidade.',
        icon: Truck,
        color: 'purple',
        path: '/entregas',
    },
];

export function HelpPage() {
    const navigate = useNavigate();

    const handleContactClick = () => {
        // <<<<<<<<<<<<<<<<< LINHA ATUALIZADA >>>>>>>>>>>>>>>>>>>
        const SUPPORT_PHONE_NUMBER = '5563991021043'; // Novo número: +55 63 99102-1043

        const message = 'Olá! Preciso de ajuda com o sistema de gestão. Meu usuário é o(a) [Seu Nome/Email].';
        const whatsappUrl = `https://wa.me/${SUPPORT_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-8 px-4 py-6 bg-gray-50 min-h-screen">
            {/* Botão Voltar */}
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Voltar</span>
            </button>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center space-x-3">
                    <HelpCircle className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-serif font-bold text-gray-900">Central de Ajuda</h1>
                </div>
                <p className="text-gray-600 mt-1">Encontre respostas rápidas para suas dúvidas e suporte técnico.</p>
            </motion.div>

            {/* Suporte Rápido - WhatsApp */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleContactClick}
                className="bg-green-600 text-white rounded-2xl p-6 shadow-xl hover:bg-green-700 cursor-pointer transition-all duration-300 transform hover:scale-[1.02]"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <MessageSquare className="w-8 h-8 flex-shrink-0" />
                        <div>
                            <h2 className="text-xl font-bold">Suporte Prioritário</h2>
                            <p className="text-sm opacity-90">Fale com nossa equipe técnica via WhatsApp.</p>
                        </div>
                    </div>
                    <span className="font-semibold text-sm bg-white text-green-600 px-3 py-1.5 rounded-full shadow-md">
                        Fale Conosco
                    </span>
                </div>
            </motion.div>

            {/* FAQ - Perguntas Frequentes (Carregadas dos "Arquivos") */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                    Perguntas Frequentes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {FAQ_ITEMS_DATA.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(item.path)}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-1">{item.question}</h3>
                                        <p className="text-sm text-gray-600">{item.answer}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Informações da Versão */}
            <div className="text-center pt-8 text-sm text-gray-500">
                <p>Versão do Sistema: v1.0.0</p>
                <p className="mt-1">Copyright © 2025 Sistema de Gestão Integrado. Todos os direitos reservados.</p>
            </div>
        </div>
    );
}