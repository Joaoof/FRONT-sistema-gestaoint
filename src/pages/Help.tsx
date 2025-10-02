import { Search } from "lucide-react"

export default function HelpPage() {
    const whatsappNumber = "5563991021043"
    const whatsappMessage = (question: string) => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(question)}`

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
                <div className="max-w-2xl">
                    <h1 className="text-5xl lg:text-6xl font-bold text-[#1a2b49] mb-6 leading-tight">Como podemos ajudar?</h1>
                    <p className="text-lg text-gray-600 mb-8">
                        Pesquise em nossa central de ajuda para encontrar respostas sobre o sistema de gestão.
                    </p>

                    {/* Search Box */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Digite sua pergunta..."
                            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* FAQ Sections */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-3 gap-12">
                    {/* Sistema Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-[#1a2b49] mb-6">Sistema</h2>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href={whatsappMessage("Como faço para acessar o sistema?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como faço para acessar o sistema?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como cadastrar novos usuários?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como cadastrar novos usuários?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Esqueci minha senha, como recuperar?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Esqueci minha senha, como recuperar?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como atualizar meus dados cadastrais?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como atualizar meus dados cadastrais?
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Gestão Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-[#1a2b49] mb-6">Gestão</h2>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href={whatsappMessage("Como gerar relatórios no sistema?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como gerar relatórios no sistema?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como fazer o controle de estoque?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como fazer o controle de estoque?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como cadastrar produtos e serviços?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como cadastrar produtos e serviços?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como gerenciar clientes e fornecedores?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como gerenciar clientes e fornecedores?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como configurar permissões de acesso?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como configurar permissões de acesso?
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Suporte Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-[#1a2b49] mb-6">Suporte</h2>
                        <ul className="space-y-4">
                            <li>
                                <a
                                    href={whatsappMessage("O sistema está apresentando erro, o que fazer?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    O sistema está apresentando erro, o que fazer?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como solicitar novas funcionalidades?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como solicitar novas funcionalidades?
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Preciso de treinamento para usar o sistema")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Preciso de treinamento para usar o sistema
                                </a>
                            </li>
                            <li>
                                <a
                                    href={whatsappMessage("Como fazer backup dos meus dados?")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:text-blue-600 hover:underline"
                                >
                                    Como fazer backup dos meus dados?
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
