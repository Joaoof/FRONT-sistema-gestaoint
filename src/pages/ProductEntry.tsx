import React, { useState } from 'react';
import { Plus, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CreateProductInput } from '../graphql/types';
import { useCategories } from '../hooks/useCategories';
import { useSuppliers } from '../hooks/useSuppliers';


interface ProductEntryProps {
  onAddEntry: (entry: Omit<ProductEntry, 'id'>) => void;
}

export function ProductEntry({ onAddEntry }: ProductEntryProps) {
  const { user } = useAuth(); // ✅ Pega o usuário logado
  const [formData, setFormData] = useState({
    nameProduct: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    supplier: '',
    description: '',
    createdAt: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { suppliers, loading: suppliersLoading, error: suppliersError } = useSuppliers();



  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'quantity' || name === 'costPrice' || name === 'sellingPrice'
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // ✅ Validação mínima
      if (!formData.nameProduct || !formData.category || !formData.quantity || !user?.id) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // ✅ Mapeia para o formato do backend
      const productData: CreateProductInput = {
        nameProduct: formData.nameProduct,
        description: formData.description || undefined,
        categoryId: formData.category, // Pode vir de um select real depois
        quantity: formData.quantity,
        costPrice: Number(formData.costPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        supplierId: formData.supplier, // Pode vir de um select real depois
      };

      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Faça login primeiro');
        return;
      }

      // ✅ Envia para o GraphQL
      const res = await fetch('http://localhost:3000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation CreateProduct($dto: CreateProductInput!) {
              createProduct(dto: $dto) {
                id
                nameProduct
                quantity
                costPrice
                salePrice
                description
              }
            }
          `,
          variables: { dto: productData },
        }),
      });

      console.log(res);


      console.log('Token usado no fetch:', token);


      const json = await res.json();

      if (json.errors) {
        throw new Error(json.errors[0].message);
      }

      // ✅ Atualiza o estado local (estoque)
      onAddEntry({
        ...formData,
        date: new Date().toISOString(),
      });

      // ✅ Reseta o formulário
      setFormData({
        nameProduct: '',
        category: '',
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        description: '',
        createdAt: new Date(),
        supplier: '',
      });

      alert('Produto criado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao criar produto:', err);
      setError(err.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-['Merriweather'] text-gray-900 mb-2">Entrada de Produtos</h1>
        <p className="text-gray-600">Registre novos produtos no seu estoque</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <Package className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold font-['Montserrat'] text-gray-900">Novo Produto</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                id="nameProduct"
                name="nameProduct"
                value={formData.nameProduct}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Ex: Smartphone Samsung Galaxy"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Selecione uma categoria</option>
                {categoriesLoading && <option>Carregando categorias...</option>}
                {categoriesError && <option>Erro ao carregar categorias</option>}
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Custo *
              </label>
              <input
                type="number"
                id="costPrice"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0,00"
              />
            </div>

            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Venda *
              </label>
              <input
                type="number"
                id="salePrice"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="0,00"
              />
            </div>

            <div>
              <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor
              </label>
              <select
                id="supplier"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Selecione um fornecedor</option>
                {suppliersLoading && <option>Carregando fornecedores...</option>}
                {suppliersError && <option>Erro ao carregar fornecedores</option>}
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>

            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Descrição detalhada do produto..."
            />
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              * Campos obrigatórios
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-6 py-3 text-white rounded-lg transition-all duration-200 ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Produto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}