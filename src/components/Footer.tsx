// src/components/Footer.tsx
import { Heart, Github } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();
    const systemVersion = "v1.0.0";

    return (
        <footer className="w-full border-t border-slate-200 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-slate-600 dark:text-slate-400">

                <div className="flex items-center gap-1.5 text-[13px]">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        © {currentYear} Sistema de Gestão Integrado
                    </span>
                    <span className="hidden sm:inline text-slate-400 dark:text-slate-500">·</span>
                    <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">{systemVersion}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[13px]">
                    <span className="inline-flex items-center">
                        Feito com <Heart className="w-3.5 h-3.5 mx-1 text-rose-500" fill="currentColor" /> por
                        <a
                            href="https://github.com/Joaoof"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-1 text-brand-700 dark:text-brand-300 hover:underline underline-offset-4"
                        >
                            João <Github className="w-3 h-3" />
                        </a>
                    </span>

                    <nav>
                        <a
                            href="/help"
                            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            Ajuda &amp; Suporte
                        </a>
                    </nav>
                </div>
            </div>
        </footer>
    );
}
