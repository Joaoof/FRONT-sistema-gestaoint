import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Category = {
    id: string;
    name: string;
    status: string;
};

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchCategories() {
            setLoading(true);
            setError(null);

            try {
                const token = localStorage.getItem('accessToken');

                const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
                if (!endpoint) {
                    toast.error("env nullo. Contactar o desenvolvedo");
                    return;
                }

                const res = await fetch(endpoint ?? '', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        query: `
              query CategoriesActive {
                categoriesActive {
                  id
                  name
                  status
                }
              }
            `,
                    }),
                });

                const json = await res.json();

                if (json.errors) {
                    throw new Error(json.errors[0].message);
                }

                setCategories(json.data.categoriesActive);
            } catch (err: any) {
                setError(err.message || 'Erro ao buscar categorias');
            } finally {
                setLoading(false);
            }
        }

        fetchCategories();
    }, []);

    return { categories, loading, error };
}
