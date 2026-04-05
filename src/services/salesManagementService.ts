import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import {
  LIST_PRODUCTS_QUERY,
  LIST_SALES_QUERY,
  LIST_SELLERS_QUERY,
  SELLER_METRICS_QUERY,
} from '../graphql/queries/salesManagement';
import {
  CREATE_PRODUCT_MUTATION,
  CREATE_SELLER_MUTATION,
  REGISTER_SALE_MUTATION,
} from '../graphql/mutations/salesManagement';
import {
  CreateProductInput,
  CreateSellerInput,
  Product,
  RegisterSaleInput,
  Sale,
  Seller,
  SellerMetrics,
} from '../features/sales-management/types';

interface SellerApi {
  id: string;
  name: string;
  email: string;
  commissionTotal: number;
  scoreTotal: number;
}

interface ProductApi {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface SaleApi {
  id: string;
  quantity: number;
  soldAt: string;
  seller: { id: string; name: string };
  product: { id: string; name: string; price: number };
}

interface SellerMetricsApi {
  sellerId: string;
  sellerName: string;
  commissionTotal: number;
  scoreTotal: number;
}

const mapSeller = (seller: SellerApi): Seller => ({ ...seller });
const mapProduct = (product: ProductApi): Product => ({ ...product });
const mapSale = (sale: SaleApi): Sale => ({ ...sale });
const mapMetrics = (metrics: SellerMetricsApi): SellerMetrics => ({ ...metrics });

export const salesManagementService = {
  listSellers: async (client: ApolloClient<NormalizedCacheObject>) => {
    const { data } = await client.query<{ sellers: SellerApi[] }>({ query: LIST_SELLERS_QUERY, fetchPolicy: 'network-only' });
    return (data.sellers ?? []).map(mapSeller);
  },

  listProducts: async (client: ApolloClient<NormalizedCacheObject>) => {
    const { data } = await client.query<{ products: ProductApi[] }>({ query: LIST_PRODUCTS_QUERY, fetchPolicy: 'network-only' });
    return (data.products ?? []).map(mapProduct);
  },

  listSales: async (client: ApolloClient<NormalizedCacheObject>) => {
    const { data } = await client.query<{ sales: SaleApi[] }>({ query: LIST_SALES_QUERY, fetchPolicy: 'network-only' });
    return (data.sales ?? []).map(mapSale);
  },

  listSellerMetrics: async (client: ApolloClient<NormalizedCacheObject>) => {
    const { data } = await client.query<{ sellerMetrics: SellerMetricsApi[] }>({ query: SELLER_METRICS_QUERY, fetchPolicy: 'network-only' });
    return (data.sellerMetrics ?? []).map(mapMetrics);
  },

  createSeller: async (client: ApolloClient<NormalizedCacheObject>, input: CreateSellerInput) => {
    const { data } = await client.mutate<{ createSeller: SellerApi }>({ mutation: CREATE_SELLER_MUTATION, variables: { input } });
    if (!data?.createSeller) throw new Error('Falha ao cadastrar vendedor.');
    return mapSeller(data.createSeller);
  },

  createProduct: async (client: ApolloClient<NormalizedCacheObject>, input: CreateProductInput) => {
    const { data } = await client.mutate<{ createProduct: ProductApi }>({ mutation: CREATE_PRODUCT_MUTATION, variables: { input } });
    if (!data?.createProduct) throw new Error('Falha ao cadastrar produto.');
    return mapProduct(data.createProduct);
  },

  registerSale: async (client: ApolloClient<NormalizedCacheObject>, input: RegisterSaleInput) => {
    const { data } = await client.mutate<{ registerSale: SaleApi }>({ mutation: REGISTER_SALE_MUTATION, variables: { input } });
    if (!data?.registerSale) throw new Error('Falha ao registrar venda.');
    return mapSale(data.registerSale);
  },
};
