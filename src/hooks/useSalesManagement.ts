import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { toast } from 'sonner';
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
import { salesManagementService } from '../services/salesManagementService';
import { CreateProductInput, CreateSellerInput, RegisterSaleInput } from '../features/sales-management/types';

export const useSalesManagement = () => {
  const client = useApolloClient();

  const sellersQuery = useQuery(LIST_SELLERS_QUERY);
  const productsQuery = useQuery(LIST_PRODUCTS_QUERY);
  const salesQuery = useQuery(LIST_SALES_QUERY);
  const metricsQuery = useQuery(SELLER_METRICS_QUERY);

  const [createSellerMutation, createSellerState] = useMutation(CREATE_SELLER_MUTATION);
  const [createProductMutation, createProductState] = useMutation(CREATE_PRODUCT_MUTATION);
  const [registerSaleMutation, registerSaleState] = useMutation(REGISTER_SALE_MUTATION);

  const createSeller = async (input: CreateSellerInput) => {
    await createSellerMutation({
      variables: { input },
      refetchQueries: [{ query: LIST_SELLERS_QUERY }, { query: SELLER_METRICS_QUERY }],
      awaitRefetchQueries: true,
    });
    toast.success('Vendedor cadastrado com sucesso.');
  };

  const createProduct = async (input: CreateProductInput) => {
    await createProductMutation({
      variables: { input },
      refetchQueries: [{ query: LIST_PRODUCTS_QUERY }],
      awaitRefetchQueries: true,
    });
    toast.success('Produto cadastrado com sucesso.');
  };

  const registerSale = async (input: RegisterSaleInput) => {
    await registerSaleMutation({
      variables: { input },
      refetchQueries: [
        { query: LIST_SALES_QUERY },
        { query: LIST_SELLERS_QUERY },
        { query: SELLER_METRICS_QUERY },
      ],
      awaitRefetchQueries: true,
    });
    toast.success('Venda registrada com sucesso.');
  };

  const sellers = useMemo(() => sellersQuery.data?.sellers ?? [], [sellersQuery.data]);
  const products = useMemo(() => productsQuery.data?.products ?? [], [productsQuery.data]);
  const sales = useMemo(() => salesQuery.data?.sales ?? [], [salesQuery.data]);
  const metrics = useMemo(() => metricsQuery.data?.sellerMetrics ?? [], [metricsQuery.data]);

  const loading = sellersQuery.loading || productsQuery.loading || salesQuery.loading || metricsQuery.loading;
  const mutationLoading = createSellerState.loading || createProductState.loading || registerSaleState.loading;
  const error = sellersQuery.error || productsQuery.error || salesQuery.error || metricsQuery.error;

  const refreshAll = async () => {
    await Promise.all([
      salesManagementService.listSellers(client),
      salesManagementService.listProducts(client),
      salesManagementService.listSales(client),
      salesManagementService.listSellerMetrics(client),
    ]);
    await Promise.all([
      sellersQuery.refetch(),
      productsQuery.refetch(),
      salesQuery.refetch(),
      metricsQuery.refetch(),
    ]);
  };

  return {
    sellers,
    products,
    sales,
    metrics,
    loading,
    mutationLoading,
    error,
    createSeller,
    createProduct,
    registerSale,
    refreshAll,
  };
};
