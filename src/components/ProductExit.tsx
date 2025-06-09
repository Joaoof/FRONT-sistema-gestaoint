import React, { useState } from 'react';
import { Minus, ShoppingCart } from 'lucide-react';
import { ProductExit as ProductExitType, Product } from '../types';

interface ProductExitProps {
  onAddExit: (exit: Omit<ProductExitType, 'id'>) => void;
  products: Product[];
}

export function ProductExit({ onAddExit, products }: ProductExitProps) {
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    reason: 'venda' as 'venda' | 'perda' | 'devolucao' | 'transferencia',
    notes: ''
  });

  const reasons = [
    { value: 'venda', label: 'Venda' },
    { value: 'perda', label: 'Perda/Avaria' },
    { value: 'devolucao', label: 'Devolução' },
    { value: 'transferencia', label: 'Transferência' }
  ];

  const selectedProduct = products.find(p => p.id === formData.productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    onAddExit({
      productId: formData.productId,
      productName: selectedProduct.name,
      quantity: formData.quantity,
      unitPrice: selectedProduct.sellingPrice,
      reason: formData.reason,
      notes: formData.notes,
      date: new Date().toISOString()
    });

    setFormData({
      productId: '',
      quantity: 0,
      reason: 'venda',
      notes: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Saída de Produtos</h1>
        <p className="text-gray-600">Registre vendas e movimentações de saída</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <ShoppingCart className="w-6 h-6 text-red-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Registrar Saída</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                Produto *
              </label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - Estoque: {product.stock}
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
                max={selectedProduct?.stock || 999}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="0"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Saída *
              </label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              >
                {reasons.map(reason => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Total
                </label>
                <div className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-semibold">
                  R$ {(selectedProduct.sellingPrice * formData.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="Observações adicionais sobre a saída..."
            />
          </div>

          {selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Informações do Produto</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Estoque Atual:</span>
                  <p className="text-blue-900">{selectedProduct.stock} unidades</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Preço Unit.:</span>
                  <p className="text-blue-900">R$ {selectedProduct.sellingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Categoria:</span>
                  <p className="text-blue-900">{selectedProduct.category}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Estoque Após:</span>
                  <p className="text-blue-900">{selectedProduct.stock - formData.quantity} unidades</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              * Campos obrigatórios
            </div>
            <button
              type="submit"
              disabled={!selectedProduct || formData.quantity === 0}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-5 h-5 mr-2" />
              Registrar Saída
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}