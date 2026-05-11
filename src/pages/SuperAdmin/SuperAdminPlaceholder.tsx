import { Construction } from 'lucide-react';

export function SuperAdminPlaceholder({ title, description }: { title: string; description?: string }) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                {description && <p className="text-[13px] text-slate-400 mt-1">{description}</p>}
            </div>

            <div className="rounded-xl bg-[#181b25] border border-white/5 p-16 text-center">
                <Construction className="w-10 h-10 text-slate-500 mx-auto mb-4" />
                <div className="text-slate-300 text-[14px] font-medium">Em construção</div>
                <div className="text-slate-500 text-[12.5px] mt-1">
                    Esta seção será disponibilizada em breve.
                </div>
            </div>
        </div>
    );
}
