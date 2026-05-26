import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Loader2, CheckCircle2, XCircle, Mail, Building2, Crown, Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/api';

type ValidateResponse = {
    valid: boolean;
    reason?: string;
    invitation?: {
        email: string;
        role: string;
        companyName?: string | null;
        planName?: string | null;
        invitedByName?: string | null;
        message?: string | null;
        expiresAt?: string | null;
    };
};

export function AcceptInvitePage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ValidateResponse | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) return;
        const validate = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/invitations/${token}`);
                const json: ValidateResponse = await res.json();
                setData(json);
            } catch (e: any) {
                setData({ valid: false, reason: 'Erro de conexão' });
            } finally {
                setLoading(false);
            }
        };
        void validate();
    }, [token]);

    const handleAccept = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error('As senhas não conferem');
            return;
        }
        if (password.length < 8) {
            toast.error('A senha deve ter ao menos 8 caracteres');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/invitations/${token}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), password }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message ?? 'Falha ao aceitar convite');
            toast.success('Conta criada! Redirecionando…');
            if (json.accessToken) {
                localStorage.setItem('accessToken', json.accessToken);
                setTimeout(() => navigate('/dashboard'), 800);
            } else {
                setTimeout(() => navigate('/'), 800);
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Validando convite…
                </div>
            </div>
        );
    }

    if (!data?.valid || !data.invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-5">
                        <XCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Convite inválido</h1>
                    <p className="text-[13.5px] text-slate-600 mt-2">
                        {data?.reason ?? 'Este convite não existe, foi revogado ou expirou.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-6 w-full py-2.5 rounded-lg bg-slate-900 text-white text-[13.5px] font-semibold hover:bg-slate-800"
                    >
                        Ir para o login
                    </button>
                </div>
            </div>
        );
    }

    const inv = data.invitation;
    const isSuper = inv.role === 'SUPER_ADMIN';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className={`p-6 text-white ${isSuper ? 'bg-gradient-to-r from-rose-600 to-orange-500' : 'bg-gradient-to-r from-slate-900 to-slate-700'}`}>
                    <div className="flex items-center gap-3">
                        {isSuper ? <Crown className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                        <div>
                            <div className="text-[12px] uppercase tracking-wider opacity-80">Você foi convidado</div>
                            <div className="text-lg font-bold">Bem-vindo ao GestãoInt</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Invitation summary */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-[13px]">
                        <div className="flex items-center gap-2 text-slate-700">
                            <Mail className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{inv.email}</span>
                        </div>
                        {inv.companyName && (
                            <div className="flex items-center gap-2 text-slate-700">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                Empresa: <span className="font-medium">{inv.companyName}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-700">
                            <Shield className="w-4 h-4 text-slate-400" />
                            Função: <span className="font-medium">{translateRole(inv.role)}</span>
                            {inv.planName && <span className="text-slate-500">• Plano {inv.planName}</span>}
                        </div>
                        {inv.message && (
                            <div className="mt-3 p-3 bg-white rounded border border-slate-200 text-[12.5px] text-slate-600 italic">
                                "{inv.message}"
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAccept} className="space-y-4">
                        <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Seu nome completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:border-slate-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Crie uma senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ao menos 8 caracteres"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:border-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                                >
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">Confirme a senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-[13.5px] focus:outline-none focus:border-slate-900"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-3 rounded-lg text-white text-[14px] font-semibold disabled:opacity-50 ${
                                isSuper
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                        >
                            {submitting ? 'Criando conta…' : 'Aceitar e criar conta'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function translateRole(role: string) {
    return {
        SUPER_ADMIN: 'Super Administrador',
        ADMIN: 'Administrador',
        MANAGER: 'Gerente',
        USER: 'Usuário',
    }[role] ?? role;
}
