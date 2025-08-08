export const GET_ALL_MOVEMENTS = `
  query EntryMovement {
    entryMovement {
      id
      type
      category
      value
      description
      date
    }
  }
`;