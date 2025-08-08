// utils/handleGraphQLError.ts
export function handleGraphQLError(error: any, notifyError: (msg: string) => void) {
    const { message, extensions } = error
    const code = extensions?.code || 'UNKNOWN_ERROR'

    switch (code) {
        case 'UnauthorizedError':
            notifyError('Email ou senha inválidos')
            break
        case 'CompanyNotLinkedError':
            notifyError('Usuário sem empresa vinculada')
            break
        case 'CompanyWithoutPlanError':
            notifyError('Empresa sem plano ativo')
            break
        default:
            notifyError(message || 'Erro desconhecido')
    }
}
