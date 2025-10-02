// src/pages/HelpPage.tsx

import React from 'react';
import {
    HelpCircle,
    MessageSquare,
    Truck,
    DollarSign,
    Box,
    Layers,
    Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Simulação de FAQ, mantendo a estrutura de "arquivos"
const FAQ_ITEMS_DATA = [
    {
        question: 'O que é o módulo Fiscal?',
        answer: 'Gestão completa das Contas a Receber e Contas a Pagar (despesas, fornecedores), centralizando o controle financeiro.',
        icon: DollarSign,
        color: 'blue',
    },
    {
        question: 'Como faço nova entrada ou saída no estoque?',
        answer: 'Registro de entradas (compras) na página "Estoque" e saídas (vendas ou perdas) na página "Vendas".',
        icon: Box,
        color: 'green',
    },
    {
        question: 'Onde vejo o histórico detalhado do meu caixa?',
        answer: 'Acesso ao histórico completo de todas as movimentações (vendas, despesas, saques, etc.) na página "Histórico de Movimentações".',
        icon: Layers,
        color: 'red',
    },
    {
        question: 'Módulo de Entregas e Rotas',
        answer: 'Permite cadastrar novas entregas, agendar rotas para motoristas e acessar relatórios de desempenho e pontualidade.',
        icon: Truck,
        color: 'purple',
    },
];

export function HelpPage() {
    const navigate = useNavigate();
    const SUPPORT_PHONE_NUMBER = '5563991021043'; // Número de suporte: 63 99102-1043

    const handleContactClick = () => {
        const message = 'Olá! Preciso de ajuda com o sistema de gestão. Meu usuário é o(a) [Seu Nome/Email].';
        const whatsappUrl = `https://wa.me/${SUPPORT_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        // Aplicando a fonte Open Sans
        <div className="space-y-10 px-4 py-6 bg-gray-50 min-h-screen font-open-sans">

            {/* Bloco de Busca e Cabeçalho (Inspirado no "How can we help?") */}
            <div className="text-center max-w-4xl mx-auto pt-10 pb-12">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-extrabold text-gray-900 mb-4"
                >
                    Como podemos ajudar?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-gray-600 mb-8"
                >
                    Procure em nossa Central de Ajuda por respostas ou entre em contato direto.
                </motion.p>

                {/* Barra de Pesquisa Simulada */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative max-w-2xl mx-auto"
                >
                    <input
                        type="text"
                        placeholder="Digite sua dúvida ou problema..."
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow shadow-md"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                </motion.div>
            </div>

            {/* Suporte Direto e Cards de FAQ */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">

                {/* Cartão de Contato Rápido (Substituindo o antigo banner) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={handleContactClick}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl cursor-pointer transition-all duration-300"
                >
                    <div className="flex items-center space-x-4 mb-4">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                        <h2 className="text-xl font-bold text-gray-900">Fale com o Suporte</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Para suporte técnico, dúvidas complexas ou problemas urgentes, clique abaixo para iniciar um chat imediato via WhatsApp.
                    </p>
                    <button className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                        Iniciar Chat Agora
                    </button>
                </motion.div>

                {/* FAQ - Cards de Perguntas Frequentes */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {FAQ_ITEMS_DATA.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + 0.1 * index }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer min-h-36 flex flex-col justify-between"
                                onClick={handleContactClick} // Todas as "coisas" direcionam para o Zap
                            >
                                <div className="flex items-start space-x-3 mb-2">
                                    <div className={`p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg flex-1">{item.question}</h3>
                                </div>
                                <p className="text-sm text-gray-600">{item.answer}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Informações da Versão */}
            <div className="text-center pt-10 text-sm text-gray-500">
                <p>Versão do Sistema: v1.0.0</p>
                <p className="mt-1">Copyright © 2025 Sistema de Gestão Integrado. Todos os direitos reservados.</p>
            </div>
        </div>
    );
}