import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AIAgentConfig {
    name: string;
    role: string; // ex: "atendente", "consultor"
    avatarUrl: string;
    welcomeMessage: string;
    personality: string; // ex: "amigável", "formal"
    tone: 'formal' | 'casual' | 'amigavel' | 'profissional';
    language: 'pt-BR' | 'en-US' | 'es-ES';
    model: string;
    temperature: number;
    maxTokens: number;
    enabled: boolean;
    workingHours: {
        enabled: boolean;
        start: string; // "08:00"
        end: string; // "18:00"
        weekendsOff: boolean;
    };
    integrations: {
        whatsapp: boolean;
        instagram: boolean;
        site: boolean;
        email: boolean;
    };
    handoffToHuman: boolean;
    knowledgeBase: string; // FAQ / contexto
    showWidget: boolean;
}

const DEFAULT_CONFIG: AIAgentConfig = {
    name: 'Sofia',
    role: 'Atendente virtual',
    avatarUrl: 'https://e7.pngegg.com/pngimages/375/108/png-clipart-robot-ico-icon-robot-electronics-computer-wallpaper.png',
    welcomeMessage: 'Olá! Eu sou a Sofia, assistente virtual da loja. Como posso te ajudar hoje?',
    personality: 'Amigável, prestativa e objetiva',
    tone: 'amigavel',
    language: 'pt-BR',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 512,
    enabled: true,
    workingHours: {
        enabled: false,
        start: '08:00',
        end: '18:00',
        weekendsOff: true,
    },
    integrations: {
        whatsapp: true,
        instagram: false,
        site: true,
        email: false,
    },
    handoffToHuman: true,
    knowledgeBase: '',
    showWidget: true,
};

const STORAGE_KEY = 'app:ai-agent-config';

interface AIAgentContextValue {
    config: AIAgentConfig;
    updateConfig: (patch: Partial<AIAgentConfig>) => void;
    resetConfig: () => void;
}

const Ctx = createContext<AIAgentContextValue | null>(null);

function load(): AIAgentConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_CONFIG;
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_CONFIG;
    }
}

function save(cfg: AIAgentConfig) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
        // noop
    }
}

export function AIAgentProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<AIAgentConfig>(() => load());

    useEffect(() => {
        save(config);
    }, [config]);

    function updateConfig(patch: Partial<AIAgentConfig>) {
        setConfig((prev) => ({ ...prev, ...patch }));
    }

    function resetConfig() {
        setConfig(DEFAULT_CONFIG);
    }

    return <Ctx.Provider value={{ config, updateConfig, resetConfig }}>{children}</Ctx.Provider>;
}

export function useAIAgent() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useAIAgent must be used within AIAgentProvider');
    return ctx;
}
