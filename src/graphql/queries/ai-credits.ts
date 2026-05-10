import { gql } from '@apollo/client';

export const MY_AI_CREDIT_ACCOUNT = gql`
  query MyAiCreditAccount {
    myAiCreditAccount {
      id companyId balance lowThreshold totalPurchased totalConsumed isLow isEmpty
    }
  }
`;

export const AI_CREDIT_PACKAGES = gql`
  query AiCreditPackages {
    aiCreditPackages { brl base bonus total badge }
  }
`;

export const REQUEST_AI_CREDIT_PURCHASE = gql`
  mutation RequestAiCreditPurchase($packageBrl: Int!) {
    requestAiCreditPurchase(packageBrl: $packageBrl) {
      id packageBrl creditsTotal pixKey pixCopyPaste pixTxid status
      createdAt expiresAt
    }
  }
`;

export const CANCEL_AI_CREDIT_PURCHASE = gql`
  mutation CancelAiCreditPurchase($purchaseId: String!) {
    cancelAiCreditPurchase(purchaseId: $purchaseId)
  }
`;

export const MY_AI_CREDIT_PURCHASES = gql`
  query MyAiCreditPurchases {
    myAiCreditPurchases {
      id packageBrl creditsTotal pixKey pixCopyPaste pixTxid status
      paidAt createdAt expiresAt
    }
  }
`;

export const MY_AI_CREDIT_TRANSACTIONS = gql`
  query MyAiCreditTransactions($limit: Int) {
    myAiCreditTransactions(limit: $limit) {
      id kind amount balanceAfter description refType refId createdAt
    }
  }
`;

// ============ super-admin ============
export const PENDING_AI_CREDIT_PURCHASES = gql`
  query PendingAiCreditPurchases {
    pendingAiCreditPurchases {
      id packageBrl creditsTotal pixKey pixCopyPaste pixTxid status
      createdAt expiresAt companyName createdByName
    }
  }
`;

export const CONFIRM_AI_CREDIT_PURCHASE = gql`
  mutation ConfirmAiCreditPurchase($purchaseId: String!) {
    confirmAiCreditPurchase(purchaseId: $purchaseId) {
      id status paidAt creditsTotal
    }
  }
`;
