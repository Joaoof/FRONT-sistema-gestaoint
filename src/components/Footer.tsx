// src/components/Footer.tsx
import { Heart, Github } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();
    // A versão é um placeholder, na prática ela seria lida do package.json ou de uma variável de ambiente.
    const systemVersion = "v1.0.0";

    return (
        <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">

                {/* Marca & Direitos Autorais */}
                <div className="flex items-center space-x-1 mb-2 md:mb-0">
                    <span className="font-semibold text-gray-800 dark:text-gray-300">
                        © {currentYear} Sistema de Gestão Integrado
                    </span>
                    <span className="hidden sm:inline text-xs text-gray-400"> | {systemVersion}</span>
                </div>

                {/* Desenvolvedor & Links */}
                <div className="flex flex-wrap items-center justify-center space-x-4">
                    <span className="flex items-center mb-1 md:mb-0">
                        Feito com <Heart className="w-4 h-4 mx-1 text-red-500" fill="currentColor" /> por
                        <a
                            href="https://github.com/Joaoof"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center transition-colors"
                        >
                            João <Github className="w-3 h-3 ml-1" />
                        </a>
                    </span>

                    {/* Links de Navegação */}
                    <nav className="space-x-3">
                        <a
                            href="/help"
                            className="hover:underline text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            Ajuda & Suporte
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}