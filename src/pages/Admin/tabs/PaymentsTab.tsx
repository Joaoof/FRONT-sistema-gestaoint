import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    CONFIRM_AI_CREDIT_PURCHASE,
    PENDING_AI_CREDIT_PURCHASES,
} from '../../../graphql/queries/ai-credits';

interface PendingPurchase {
    id: string;
    packageBrl: number;
    creditsTotal: number;
    pixKey: string;
    pixCopyPaste: string;
    pixTxid: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    companyName: string | null;
    createdByName: string | null;
}

export function PaymentsTab() {
    const { data, loading, refetch } = useQuery<{ pendingAiCreditPurchases: PendingPurchase[] }>(
        PENDING_AI_CREDIT_PURCHASES,
        { fetchPolicy: 'cache-and-network', pollInterval: 30000 },
    );
    const [confirmPurchase] = useMutation(CONFIRM_AI_CREDIT_PURCHASE);

    const pending = data?.pendingAiCreditPurchases ?? [];

    const handleConfirm = async (p: PendingPurchase) => {
        if (
            !confirm(
                `Confirmar pagamento de R$ ${p.packageBrl} de ${p.companyName ?? '—'}?\n` +
                    `Vai liberar ${p.creditsTotal} créditos. Confira no app do banco antes!`,
            )
        )
            return;
        try {
            await confirmPurchase({ variables: { purchaseId: p.id } });
            toast.success('Pagamento confirmado, créditos liberados.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div>
            <fieldset className="win98-fieldset">
                <legend>Pagamentos PIX pendentes de confirmação</legend>
                <p className="win98-helptext">
                    Quando uma empresa fizer um PIX, vai aparecer aqui. <b>Confira no app do banco</b> antes
                    de clicar em "Confirmar". Use o <b>TxID</b> ou o valor exato pra identificar.
                </p>
                <div style={{ marginTop: 6, fontSize: 11, color: '#404040' }}>
                    Atualizando automaticamente a cada 30s. {pending.length} pendente(s).
                </div>
            </fieldset>

            <table className="win98-table">
                <thead>
                    <tr>
                        <th>Quando</th>
                        <th>Empresa</th>
                        <th>Quem solicitou</th>
                        <th>Valor</th>
                        <th>Créditos</th>
                        <th>TxID</th>
                        <th>Vencimento</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {pending.map((p) => (
                        <tr key={p.id}>
                            <td>{new Date(p.createdAt).toLocaleString('pt-BR')}</td>
                            <td><b>{p.companyName ?? '—'}</b></td>
                            <td>{p.createdByName ?? '—'}</td>
                            <td>R$ {p.packageBrl},00</td>
                            <td>
                                <span className="win98-badge success">{p.creditsTotal}</span>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{p.pixTxid}</td>
                            <td>{new Date(p.expiresAt).toLocaleString('pt-BR')}</td>
                            <td>
                                <button className="win98-button primary" onClick={() => handleConfirm(p)}>
                                    ✓ Confirmar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {pending.length === 0 && (
                        <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: 20, color: '#404040' }}>
                                {loading ? 'Carregando…' : 'Nenhuma compra pendente.'}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
