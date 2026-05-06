import { gql } from '@apollo/client';

const ORDER_FIELDS = `
  id
  number
  customerId
  customerName
  customerDocument
  customerPhone
  sellerId
  sellerName
  commissionPercent
  commissionAmount
  status
  paymentMethod
  orderType
  expectedDeliveryDate
  depositAmount
  subtotal
  discount
  total
  notes
  createdAt
  updatedAt
  customer { id name document email phone address bairro cep }
  items {
    id
    productId
    productName
    itemKind
    itemUnit
    quantity
    unitPrice
    discount
    total
    description
  }
`;

export const GET_ORDERS = gql`
  query GetOrders(
    $search: String
    $status: OrderStatus
    $take: Int
    $fromDate: DateTime
    $toDate: DateTime
  ) {
    orders(
      search: $search
      status: $status
      take: $take
      fromDate: $fromDate
      toDate: $toDate
    ) {
      ${ORDER_FIELDS}
    }
  }
`;

export const GET_ORDER = gql`
  query GetOrder($id: String!) {
    order(id: $id) {
      ${ORDER_FIELDS}
    }
  }
`;

export const GET_ORDERS_SUMMARY = gql`
  query GetOrdersSummary {
    ordersSummary {
      todayCount
      todayTotal
      monthCount
      monthTotal
    }
  }
`;

export const GET_ORDER_FOR_PRINT = gql`
  query OrderForPrint($id: String!) {
    orderForPrint(id: $id) {
      empresa { nome_fantasia razao_social cnpj inscricao_estadual endereco cidade estado telefone }
      cliente { nome cpf_cnpj telefone bairro cep }
      pedido {
        numero data_emissao hora_emissao forma_pagamento
        tipo tipo_label entrega_prevista entrada saldo_a_pagar
        vencimento valor_total valor_bruto desconto itens_qtd
      }
      itens {
        codigo descricao marca unidade
        tipo tipo_label mostra_quantidade
        quantidade valor_unitario desconto valor_total
      }
      vendedor
      observacoes
    }
  }
`;

export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      number
      total
      status
      paymentMethod
      orderType
      expectedDeliveryDate
      depositAmount
      createdAt
      items { id productId productName itemKind itemUnit quantity unitPrice total description }
    }
  }
`;

export const CANCEL_ORDER = gql`
  mutation CancelOrder($id: String!) {
    cancelOrder(id: $id) {
      id status
    }
  }
`;

export const DELETE_ORDER = gql`
  mutation DeleteOrder($id: String!) {
    deleteOrder(id: $id)
  }
`;

/**
 * Atalho "recebi o pagamento" — em uma única mutation:
 *  1. Marca todos AccountReceivable pendentes do Order como PAID
 *  2. Cria automaticamente um CashMovement de entrada no caixa
 *  3. Atualiza o Order pra status=PAID
 * Permite ao usuário não passar por 3 telas (Vendas → Contas a Receber →
 * Movimentações). Aceita opcionalmente paymentMethod, bankId e receivedAmount.
 */
export const PAY_ORDER_SHORTCUT = gql`
  mutation PayOrderShortcut(
    $orderId: String!
    $paymentMethod: String
    $bankId: String
    $receivedAmount: Float
  ) {
    payOrderShortcut(
      orderId: $orderId
      paymentMethod: $paymentMethod
      bankId: $bankId
      receivedAmount: $receivedAmount
    ) {
      id
      number
      status
      paymentMethod
      total
      customerId
      customerName
    }
  }
`;
