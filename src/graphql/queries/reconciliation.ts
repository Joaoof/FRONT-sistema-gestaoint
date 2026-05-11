import { gql } from '@apollo/client';

const ITEM_FIELDS = `
  id importId bankId fitId trnType postedAt amount memo
  matchedStatus cashMovementId
`;
const IMPORT_FIELDS = `
  id bankId fileName format rangeStart rangeEnd totalItems matchedItems createdAt
`;

export const STATEMENT_IMPORTS = gql`
  query StatementImports {
    statementImports { ${IMPORT_FIELDS} }
  }
`;

export const STATEMENT_IMPORT = gql`
  query StatementImport($id: String!) {
    statementImport(id: $id) {
      ${IMPORT_FIELDS}
      items { ${ITEM_FIELDS} }
    }
  }
`;

export const IMPORT_OFX = gql`
  mutation ImportOfxStatement($bankId: String!, $fileName: String!, $content: String!) {
    importOfxStatement(bankId: $bankId, fileName: $fileName, content: $content) {
      import { ${IMPORT_FIELDS} }
      itemsCreated duplicatesSkipped
    }
  }
`;

export const AUTO_MATCH = gql`
  mutation AutoMatchStatement($importId: String!) {
    autoMatchStatement(importId: $importId) { matched total }
  }
`;

export const MANUAL_MATCH = gql`
  mutation ManualMatchStatementItem($itemId: String!, $cashMovementId: String!) {
    manualMatchStatementItem(itemId: $itemId, cashMovementId: $cashMovementId) {
      ${ITEM_FIELDS}
    }
  }
`;

export const CREATE_MOVEMENT_FROM_ITEM = gql`
  mutation CreateMovementFromStatementItem($itemId: String!) {
    createMovementFromStatementItem(itemId: $itemId)
  }
`;

export const IGNORE_ITEM = gql`
  mutation IgnoreStatementItem($itemId: String!) {
    ignoreStatementItem(itemId: $itemId)
  }
`;
