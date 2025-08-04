import { useEffect, useState } from 'react';

interface Supplier {
    id: string;
    name: string;
}

export function useSuppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Usuário não autenticado');
            setLoading(false);
            return;
        }

        fetch('http://localhost:3000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: `
          query GetAllSuppliers {
            suppliers {
              id
              name
            }
          }
        `,
            }),
        })
            .then(async (res) => {
                const json = await res.json();
                if (json.errors) {
                    throw new Error(json.errors[0].message);
                }
                if (!json.data || !json.data.suppliers) {
                    throw new Error('Dados inválidos retornados da API');
                }
                setSuppliers(json.data.suppliers);
            })
            .catch((err) => {
                console.error('Erro ao buscar fornecedores:', err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    return { suppliers, loading, error };
}
