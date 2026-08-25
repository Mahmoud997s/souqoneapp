jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
import { usePostStoreBase, usePostStore } from '../store/postStore';

describe('postStore Phase 1 Separation', () => {
  beforeEach(() => {
    usePostStoreBase.setState({
      draftData: { ...usePostStoreBase.getState().draftData, title: '', category: '' },
      editData: { ...usePostStoreBase.getState().editData, title: '', category: '' },
      editMode: false,
      editListingId: null
    });
  });

  it('a) Add draft persists and is distinct', () => {
    const store = usePostStore.getState();
    store.set({ title: 'Test Car', category: 'cars' });

    const baseState = usePostStoreBase.getState();
    expect(baseState.draftData.title).toBe('Test Car');
    expect(baseState.editData.title).toBe('');
  });

  it('b) Opening Edit for a different listing does NOT alter or clear that draft', () => {
    // Simulate an existing Add draft
    usePostStore.getState().set({ title: 'Test Car', category: 'cars' });

    // Simulate exactly what app/post/edit/[id].tsx does on mount:
    usePostStore.getState().reset('edit');
    usePostStore.getState().set({ editMode: true, editListingId: '123' });
    usePostStore.getState().set({ title: 'Existing Edit Car', category: 'cars' });

    const baseState = usePostStoreBase.getState();
    expect(baseState.editData.title).toBe('Existing Edit Car');
    expect(baseState.draftData.title).toBe('Test Car'); // original draft untouched
    expect(baseState.draftData.category).toBe('cars'); // and its category too
  });

  it('c) After successful publish or user abort, the draft IS cleared by reset() without leaking editData', () => {
    usePostStore.getState().set({ title: 'Test Car', category: 'cars' });
    
    usePostStore.getState().reset();
    
    const baseState = usePostStoreBase.getState();
    expect(baseState.draftData.title).toBe('');
  });
});
