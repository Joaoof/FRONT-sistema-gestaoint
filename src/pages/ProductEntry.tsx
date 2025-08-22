import React, { useState, useRef, useEffect } from 'react';
import { Plus, Package, Upload, Copy } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { CreateProductInput } from '../graphql/types';
import { useCategories } from '../hooks/useCategories';
import { useSuppliers } from '../hooks/useSuppliers';
import { ProductEntryType } from '../types';
import Papa from 'papaparse';
import Dropzone from 'react-dropzone';

// Cache local para categorias e fornecedores
const CATEGORY_CACHE_KEY = 'product-entry-categories';
const SUPPLIER_CACHE_KEY = 'product-entry-suppliers';

interface ProductEntryProps {
  onAddEntry: (entry: Omit<ProductEntryType, 'id'>) => void;
}

export function ProductEntry({ onAddEntry }: ProductEntryProps) {
  const [formData, setFormData] = useState({
    nameProduct: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    supplier: '',
    description: '',
    createdAt: new Date(),
    imageFile: null as File | null,
    imageUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0 });
  const lastProductRef = useRef<Omit<typeof formData, 'createdAt' | 'imageUrl' | 'imageFile'> | null>(null);

  // Usando cache local + fallback para hooks
  const { categories, } = useCategories();
  const { suppliers } = useSuppliers();

  // Cache local para categorias e fornecedores
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories));
    }
    if (suppliers.length > 0) {
      localStorage.setItem(SUPPLIER_CACHE_KEY, JSON.stringify(suppliers));
    }
  }, [categories, suppliers]);

  const getCachedCategories = () => {
    const cached = localStorage.getItem(CATEGORY_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  };

  const getCachedSuppliers = () => {
    const cached = localStorage.getItem(SUPPLIER_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  };

  const cachedCategories = getCachedCategories();
  const cachedSuppliers = getCachedSuppliers();

  // Validação inline
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'nameProduct':
        if (!value.trim()) {
          newErrors[name] = 'Nome é obrigatório.';
        } else if (!/^[a-zA-Z0-9À-ÿ\s\-'.()&]+$/u.test(value)) {
          newErrors[name] = 'Nome contém caracteres inválidos.';
        } else {
          delete newErrors[name];
        }
        break;

      case 'quantity':
        if (value <= 0) newErrors[name] = 'Quantidade deve ser maior que 0.';
        else delete newErrors[name];
        break;

      case 'costPrice':
        if (value < 0) newErrors[name] = 'Preço de custo não pode ser negativo.';
        else delete newErrors[name];
        break;

      case 'salePrice':
        if (value < 0) newErrors[name] = 'Preço de venda não pode ser negativo.';
        else if (value <= formData.costPrice) newErrors[name] = 'Preço de venda deve ser maior que o custo.';
        else delete newErrors[name];
        break;

      default:
        if (value === '' || value === 0) delete newErrors[name];
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue =
      name === 'quantity' || name === 'costPrice' || name === 'salePrice'
        ? parseFloat(value) || 0
        : value;

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    validateField(name, parsedValue);
  };

  const resetForm = () => {
    setFormData({
      nameProduct: '',
      category: '',
      quantity: 0,
      costPrice: 0,
      salePrice: 0,
      supplier: '',
      description: '',
      createdAt: new Date(),
      imageFile: null,
      imageUrl: '',
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent, saveAndContinue = false) => {
    e.preventDefault();
    setErrors({});

    // Validação completa
    const newErrors: Record<string, string> = {};
    if (!formData.nameProduct.trim()) newErrors.nameProduct = 'Nome é obrigatório.';
    if (!formData.category) newErrors.category = 'Selecione uma categoria.';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantidade deve ser maior que 0.';
    if (formData.costPrice < 0) newErrors.costPrice = 'Preço de custo inválido.';
    if (formData.salePrice < 0) newErrors.salePrice = 'Preço de venda inválido.';
    if (formData.salePrice <= formData.costPrice)
      newErrors.salePrice = 'Preço de venda deve ser maior que o custo.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Faça login primeiro.');

      const productData: CreateProductInput = {
        nameProduct: formData.nameProduct,
        description: formData.description || undefined,
        categoryId: formData.category,
        quantity: formData.quantity,
        costPrice: formData.costPrice,
        salePrice: formData.salePrice,
        supplierId: formData.supplier || undefined,
      };

      const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '', {
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

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      // Salva o último produto para duplicação
      lastProductRef.current = {
        nameProduct: formData.nameProduct,
        category: formData.category,
        quantity: formData.quantity,
        costPrice: formData.costPrice,
        salePrice: formData.salePrice,
        supplier: formData.supplier,
        description: formData.description,
      };

      onAddEntry({
        ...formData,
        date: new Date().toISOString(),
        sellingPrice: formData.salePrice,
      });

      toast.success('Produto criado com sucesso!');
      if (!saveAndContinue) resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e, true);
    }
  };

  const duplicateLastProduct = () => {
    if (lastProductRef.current) {
      setFormData((prev) => ({
        ...prev,
        ...lastProductRef.current!,
        createdAt: new Date(),
        imageUrl: '',
        imageFile: null,
      }));
      toast.success('Último produto duplicado!');
    } else {
      toast('Nenhum produto anterior para duplicar.', { icon: '⚠️' });
    }
  };

  // CSV Import com pré-visualização e mapeamento
  const handleCsvFile = (file: File) => {
    setCsvLoading(true);
    setCsvData([]);
    setColumnMapping({});
    setShowPreview(false);
    setErrors({});

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const [headers, ...rows] = results.data as string[][];
        const data = rows.map(row => {
          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            obj[h] = row[i] || '';
          });
          return obj;
        });

        setCsvData(data);
        setColumnMapping(
          headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {} as Record<string, string>)
        );
        setShowPreview(true);
        setCsvLoading(false);
      },
      error: (error) => {
        toast.error(`Erro ao ler CSV: ${error.message}`);
        setCsvLoading(false);
      },
    });
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) handleCsvFile(file);
  };

  const handleColumnMapChange = (csvHeader: string, appField: string) => {
    setColumnMapping((prev) => {
      const updated = { ...prev, [csvHeader]: appField };
      return updated;
    });
  };

  const processCsvImport = async () => {
    const requiredFields = ['nameProduct', 'category', 'quantity', 'costPrice', 'salePrice'];
    const mappedFields = Object.values(columnMapping);
    if (!requiredFields.every(f => mappedFields.includes(f))) {
      toast.error('Mapeie todos os campos obrigatórios.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return toast.error('Faça login primeiro.');

    const reverseMap = Object.fromEntries(
      Object.entries(columnMapping).map(([csv, app]) => [app, csv])
    );

    const productsToCreate = csvData.map(row => {
      const mapValue = (field: string) => row[reverseMap[field]]?.trim() || '';
      return {
        nameProduct: mapValue('nameProduct'),
        categoryId: mapValue('category'),
        quantity: parseInt(mapValue('quantity'), 10),
        costPrice: parseFloat(mapValue('costPrice')),
        salePrice: parseFloat(mapValue('salePrice')),
        description: mapValue('description') || undefined,
        supplierId: mapValue('supplier') || undefined,
      };
    });

    // Validação leve
    const validProducts = productsToCreate.filter(p => p.nameProduct && p.categoryId && p.quantity > 0);

    setCsvLoading(true);
    setImportProgress({ processed: 0, total: validProducts.length });

    // Enviar em lote (otimizado)
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation BatchCreateProducts($dtos: [CreateProductInput!]!) {
              batchCreateProducts(dtos: $dtos) {
                id
                nameProduct
              }
            }
          `,
          variables: { dtos: validProducts },
        }),
      });

      const json = await res.json();
      if (json.errors) throw new Error(json.errors[0].message);

      validProducts.forEach(product => {
        onAddEntry({
          nameProduct: product.nameProduct,
          category: product.categoryId,
          quantity: product.quantity,
          costPrice: product.costPrice,
          sellingPrice: product.salePrice,
          description: product.description || '',
          supplier: product.supplierId || '',
          date: new Date().toISOString(),
        });
      });

      toast.success(`✅ ${validProducts.length} produtos importados com sucesso!`);
      setShowPreview(false);
      setCsvData([]);
      setColumnMapping({});
    } catch (err: any) {
      toast.error('Erro na importação em lote.');
    } finally {
      setCsvLoading(false);
      setImportProgress({ processed: 0, total: 0 });
    }
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-3xl font-bold font-['Merriweather'] text-gray-900 mb-2">Entrada de Produtos</h1>
        <p className="text-gray-600">Registre novos produtos no seu estoque</p>
      </div>

      {/* Botão de importação CSV com drag-and-drop */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Upload className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">Importar Produtos via CSV</h3>
        </div>

        <Dropzone onDrop={handleDrop} accept={{ 'text/csv': ['.csv'] }} multiple={false}>
          {({ getRootProps, getInputProps, isDragActive }) => (
            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste e solte um CSV ou clique para selecionar'}
              </p>
            </div>
          )}
        </Dropzone>

        {csvLoading && (
          <div className="mt-4 text-center">
            <svg className="animate-spin h-5 w-5 mx-auto text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {importProgress.total > 0
              ? `Processando: ${importProgress.processed}/${importProgress.total}`
              : 'Processando...'}
          </div>
        )}

        {showPreview && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Mapeie as colunas do CSV:</h4>
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              {Object.keys(columnMapping).map((header) => (
                <div key={header} className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded">{header}</code>
                  <select
                    value={columnMapping[header]}
                    onChange={(e) => handleColumnMapChange(header, e.target.value)}
                    className="border rounded p-1 text-sm flex-1"
                  >
                    <option value="">Selecione...</option>
                    {['nameProduct', 'category', 'quantity', 'costPrice', 'salePrice', 'supplier', 'description'].map(
                      (field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      )
                    )}
                  </select>
                </div>
              ))}
            </div>

            <div className="overflow-auto max-h-60 border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(columnMapping).map((h) => (
                      <th key={h} className="px-3 py-2 text-left border-b">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Object.keys(columnMapping).map((h) => (
                        <td key={h} className="px-3 py-2 border-b text-gray-700">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {csvData.length > 5 && (
                    <tr>
                      <td colSpan={Object.keys(columnMapping).length} className="text-center py-2 text-gray-500">
                        ... e mais {csvData.length - 5} linhas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              onClick={processCsvImport}
              disabled={csvLoading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {csvLoading ? 'Importando...' : 'Confirmar Importação'}
            </button>
          </div>
        )}
      </div>

      {/* Formulário manual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold font-['Montserrat'] text-gray-900">Novo Produto</h2>
          </div>
          <button
            type="button"
            onClick={duplicateLastProduct}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
          >
            <Copy className="w-4 h-4" /> Duplicar último
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} onKeyDown={handleKeyDown} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nameProduct" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                id="nameProduct"
                name="nameProduct"
                value={formData.nameProduct}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.nameProduct ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Ex: Smartphone Samsung Galaxy"
              />
              {errors.nameProduct && <p className="mt-1 text-sm text-red-500">{errors.nameProduct}</p>}
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
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Selecione uma categoria</option>
                {(categories.length > 0 ? categories : cachedCategories).map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
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
                min="1"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
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
                min="0"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.costPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.costPrice && <p className="mt-1 text-sm text-red-500">{errors.costPrice}</p>}
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
                min="0"
                step="0.01"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.salePrice ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {errors.salePrice && <p className="mt-1 text-sm text-red-500">{errors.salePrice}</p>}
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um fornecedor</option>
                {(suppliers.length > 0 ? suppliers : cachedSuppliers).map((sup: any) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descrição detalhada do produto..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center min-h-[38px]"
            >
              Salvar e Continuar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center px-6 py-3 text-white rounded-lg min-h-[38px] ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Produto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}