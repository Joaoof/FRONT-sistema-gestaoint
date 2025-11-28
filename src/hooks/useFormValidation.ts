import { useState } from 'react';
import { toast } from 'sonner';

type FormErrors = Record<string, string>;

interface ValidationResult {
    fieldErrors: FormErrors;
    allErrors: string[];
}

export const useFormValidation = () => {
    const [errors, setErrors] = useState<FormErrors>({});
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const processGraphQLError = (err: any): ValidationResult => {
        const fieldErrors: FormErrors = {};
        const allErrors: string[] = [];

        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
            const firstError = err.graphQLErrors[0];
            if (firstError.extensions && Array.isArray(firstError.extensions.issues)) {
                firstError.extensions.issues.forEach((issue: any) => {
                    const fieldName = issue.path; // ex: "value", "dueDate"
                    const message = issue.message; // ex: "O valor precisa ser um número positivo."

                    fieldErrors[fieldName] = message;
                    allErrors.push(message);
                });

                return { fieldErrors, allErrors };
            } else {
                const message = firstError.message || 'Erro desconhecido na API.';
                allErrors.push(message);
                return { fieldErrors, allErrors };
            }
        } else if (err.networkError) {
            const message = 'Erro de rede. Verifique sua conexão.';
            allErrors.push(message);
            return { fieldErrors, allErrors };
        } else {
            const message = err.message || 'Erro desconhecido. Tente novamente.';
            allErrors.push(message);
            return { fieldErrors, allErrors };
        }
    };

    const handleError = (err: any) => {
        const { fieldErrors, allErrors } = processGraphQLError(err);

        setErrors(fieldErrors);

        const uniqueMessages = Array.from(new Set(allErrors));
        uniqueMessages.forEach((msg) => {
            toast.error(msg);
        });

        setError(uniqueMessages.join(' • '));
    };

    const clearFieldError = (fieldName: string) => {
        setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
        setError(null);
    };
    const clearAllErrors = () => {
        setErrors({});
        setError(null);
    };

    return {
        errors,
        error,
        loading,
        setLoading,
        handleError,
        clearFieldError,
        clearAllErrors,
        processGraphQLError,
    };
};
