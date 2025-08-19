// ErrorLink.ts
import { onError } from "@apollo/client/link/error";

export const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        const messages = graphQLErrors.flatMap(({ message, extensions }: any) => {
            const issues = extensions?.issues;
            if (issues && Array.isArray(issues)) {
                return issues.map((i: any) => i.message);
            }
            return [message];
        });
        const deduped = Array.from(new Set(messages));
        console.groupCollapsed(`❌ GraphQL Errors (${deduped.length})`);
        deduped.forEach(msg => console.error(msg));
        console.groupEnd();
        // ✅ Só loga. NÃO usa toast.error aqui.
    }

    if (networkError) {
        console.error("🌐 Network Error:", networkError);
        // ✅ Pode manter toast para erros de rede
        // toast.error("Erro de conexão. Sem resposta do servidor.");
    }
});