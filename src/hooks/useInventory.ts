import { useState, useEffect } from 'react';
import { ProductEntry, ProductExit, Product } from '../types';

export interface InventoryData {
  entries: ProductEntry[];
  exits: ProductExit[];
  products: Product[];
  addEntry: (entry: Omit<ProductEntry, 'id'>) => void;
  addExit: (exit: Omit<ProductExit, 'id'>) => void;
  getDailySpending: () => number;
  getDailyRevenue: () => number;
  getMonthlySpending: () => number;
  getMonthlyRevenue: () => number;
  getDailyProfit: () => number;
  getMonthlyProfit: () => number;
}

export function useInventory(): InventoryData {
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [exits, setExits] = useState<ProductExit[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('inventory_entries');
    const savedExits = localStorage.getItem('inventory_exits');
    const savedProducts = localStorage.getItem('inventory_products');

    if (savedEntries) setEntries(JSON.parse(savedEntries));
    if (savedExits) setExits(JSON.parse(savedExits));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('inventory_entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('inventory_exits', JSON.stringify(exits));
  }, [exits]);

  useEffect(() => {
    localStorage.setItem('inventory_products', JSON.stringify(products));
  }, [products]);

  const addEntry = (entry: Omit<ProductEntry, 'id'>) => {
    const newEntry: ProductEntry = {
      ...entry,
      id: Date.now().toString()
    };
    
    setEntries(prev => [...prev, newEntry]);

    // Update or create product
    setProducts(prev => {
      const existingProduct = prev.find(p => p.name === entry.name);
      
      if (existingProduct) {
        return prev.map(p => 
          p.name === entry.name 
            ? { ...p, stock: p.stock + entry.quantity }
            : p
        );
      } else {
        const newProduct: Product = {
          id: Date.now().toString(),
          name: entry.name,
          category: entry.category,
          stock: entry.quantity,
          costPrice: entry.costPrice,
          sellingPrice: entry.sellingPrice,
          supplier: entry.supplier || '',
          description: entry.description || ''
        };
        return [...prev, newProduct];
      }
    });
  };

  const addExit = (exit: Omit<ProductExit, 'id'>) => {
    const newExit: ProductExit = {
      ...exit,
      id: Date.now().toString()
    };
    
    setExits(prev => [...prev, newExit]);

    // Update product stock
    setProducts(prev => 
      prev.map(p => 
        p.id === exit.productId 
          ? { ...p, stock: Math.max(0, p.stock - exit.quantity) }
          : p
      )
    );
  };

  const isToday = (date: string) => {
    const today = new Date();
    const compareDate = new Date(date);
    return today.toDateString() === compareDate.toDateString();
  };

  const isThisMonth = (date: string) => {
    const today = new Date();
    const compareDate = new Date(date);
    return today.getMonth() === compareDate.getMonth() && 
           today.getFullYear() === compareDate.getFullYear();
  };

  const getDailySpending = () => {
    return entries
      .filter(entry => isToday(entry.date))
      .reduce((sum, entry) => sum + (entry.costPrice * entry.quantity), 0);
  };

  const getDailyRevenue = () => {
    return exits
      .filter(exit => isToday(exit.date) && exit.reason === 'venda')
      .reduce((sum, exit) => sum + (exit.unitPrice * exit.quantity), 0);
  };

  const getMonthlySpending = () => {
    return entries
      .filter(entry => isThisMonth(entry.date))
      .reduce((sum, entry) => sum + (entry.costPrice * entry.quantity), 0);
  };

  const getMonthlyRevenue = () => {
    return exits
      .filter(exit => isThisMonth(exit.date) && exit.reason === 'venda')
      .reduce((sum, exit) => sum + (exit.unitPrice * exit.quantity), 0);
  };

  const getDailyProfit = () => {
    const revenue = getDailyRevenue();
    const todayExits = exits.filter(exit => isToday(exit.date) && exit.reason === 'venda');
    
    const costOfSoldItems = todayExits.reduce((sum, exit) => {
      const product = products.find(p => p.id === exit.productId);
      return sum + (product ? product.costPrice * exit.quantity : 0);
    }, 0);

    return revenue - costOfSoldItems;
  };

  const getMonthlyProfit = () => {
    const revenue = getMonthlyRevenue();
    const monthExits = exits.filter(exit => isThisMonth(exit.date) && exit.reason === 'venda');
    
    const costOfSoldItems = monthExits.reduce((sum, exit) => {
      const product = products.find(p => p.id === exit.productId);
      return sum + (product ? product.costPrice * exit.quantity : 0);
    }, 0);

    return revenue - costOfSoldItems;
  };

  return {
    entries,
    exits,
    products,
    addEntry,
    addExit,
    getDailySpending,
    getDailyRevenue,
    getMonthlySpending,
    getMonthlyRevenue,
    getDailyProfit,
    getMonthlyProfit
  };
}