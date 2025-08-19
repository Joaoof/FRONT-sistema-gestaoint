export function getGraphQLErrorMessages(error: any): string[] {
    if (!error) return ['Erro desconhecido'];

    // Caso 1: Erros do GraphQL (mais comum)
    if (error.graphQLErrors?.length > 0) {
        return error.graphQLErrors.flatMap((err: any) => {
            const issues = err.extensions?.issues;
            if (Array.isArray(issues)) return issues.map((i: any) => i.message);
            return [err.message];
        });
    }

    // Caso 2: Erro de rede com resposta parcial (ex: 200 com errors no body)
    if (error.networkError?.result?.errors) {
        return error.networkError.result.errors.flatMap((err: any) => {
            const issues = err.extensions?.issues;
            if (Array.isArray(issues)) return issues.map((i: any) => i.message);
            return [err.message];
        });
    }

    // Caso 3: Erro de rede sem GraphQL (ex: sem internet)
    if (error.networkError) {
        return ['Erro de conexão com o servidor.'];
    }

    // Caso 4: Erro genérico
    if (error.message) return [error.message];

    return ['Erro desconhecido'];
}