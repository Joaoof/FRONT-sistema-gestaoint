import { useCompany } from "../contexts/CompanyContext"
import { useAuth } from "../contexts/AuthContext"
import type { Movement } from "../types"
import { toast } from "sonner"
import { CompanyInfo, generateMovementPdfDoc } from '../utils/generatePDF';

/**
 * Hook customizado para gerar o PDF, injetando dados da empresa e do usuário
 * obtidos via React Contexts (Hooks).
 * * Este hook retorna uma função pré-configurada que aceita apenas os dados de movimento.
 */
export const usePdfGenerator = () => {
    const { company } = useCompany();
    const { user } = useAuth();

    // Mapeando dados da empresa para a interface CompanyInfo
    const companyInfo: Partial<CompanyInfo> = {
        name: company?.name || "Nome da Empresa Indefinido",
        cnpj: company?.cnpj || "CNPJ: Não Informado",
        address: company?.address || "Endereço Não Informado",
    };

    const userName = user?.name || "Usuário Padrão";

    /**
     * Função final para gerar o PDF, que é retornada pelo hook.
     * @param movements Lista de movimentos a serem incluídos.
     * @param filename Nome do arquivo para download.
     * @param reportTitle Título principal do relatório.
     */
    const generateMovementsPdf = (
        movements: Movement[],
        filename: string = "movimentacoes.pdf",
        reportTitle: string = "RELATÓRIO DE MOVIMENTAÇÕES FINANCEIRAS"
    ) => {
        if (!company || !user) {
            toast.error("Erro: Dados da empresa ou do usuário não carregados.");
            console.error("Dados da empresa ou do usuário estão faltando para gerar o PDF.");
            return;
        }

        generateMovementPdfDoc(
            movements,
            filename,
            reportTitle,
            companyInfo,
            userName
        );
    };

    return { generateMovementsPdf };
};
