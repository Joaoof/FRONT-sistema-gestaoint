"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

type Category = {
    id: string;
    name: string;
};

interface CategoryContextType {
    categories: Category[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType>({
    categories: [],
    loading: false,
    error: null,
    refetch: async () => { },
});

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) throw new Error("Sem token");

            const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
            if (!endpoint) {
                toast.error("env nullo. Contactar o desenvolvedor");
                return;
            }

            const res = await fetch(endpoint ?? '', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
            query GetActiveCategories {
              categories(where: { status: ACTIVE }) {
                id
                name
              }
            }
          `,
                }),
            });

            const json = await res.json();

            if (json.errors) throw new Error(json.errors[0].message);

            setCategories(json.data.categories);
        } catch (err: any) {
            setError(err.message || "Erro ao buscar categorias");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <CategoryContext.Provider value={{ categories, loading, error, refetch: fetchCategories }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategory = () => {
    const context = useContext(CategoryContext);
    if (!context) throw new Error("useCategory deve ser usado dentro de CategoryProvider");
    return context;
};
