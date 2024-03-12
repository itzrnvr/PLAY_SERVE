import create from 'zustand';
import immer from 'zustand/middleware/immer';

const useStore = create(
  immer(set => ({
    items: [],
    addItem: newItem =>
      set(draft => {
        draft.items.push(newItem);
      }),
    removeItem: index =>
      set(draft => {
        draft.items.splice(index, 1);
      }),
  })),
);

export default useStore;
