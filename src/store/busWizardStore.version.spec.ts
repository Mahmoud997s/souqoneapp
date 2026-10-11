import { useBusWizardStore } from './busWizardStore'

describe('busWizardStore - editVersion (optimistic concurrency token for PATCH /buses/:id)', () => {
  beforeEach(() => {
    useBusWizardStore.getState().reset()
  })

  it('starts as null', () => {
    expect(useBusWizardStore.getState().editVersion).toBeNull()
  })

  it('setEditMode stores the version it was given', () => {
    useBusWizardStore.getState().setEditMode('bus-1', { title: 'x' }, 7)
    const s = useBusWizardStore.getState()
    expect(s.editMode).toBe(true)
    expect(s.editListingId).toBe('bus-1')
    expect(s.editVersion).toBe(7)
  })

  it.each([undefined, null, NaN, '3' as any])('setEditMode stores null for a missing/invalid version (%p)', (v) => {
    useBusWizardStore.getState().setEditMode('bus-1', {}, v as any)
    expect(useBusWizardStore.getState().editVersion).toBeNull()
  })

  it('opening a different listing replaces the version', () => {
    useBusWizardStore.getState().setEditMode('bus-1', {}, 2)
    useBusWizardStore.getState().setEditMode('bus-2', {}, 9)
    expect(useBusWizardStore.getState().editVersion).toBe(9)
  })

  it('reset clears the version', () => {
    useBusWizardStore.getState().setEditMode('bus-1', {}, 4)
    useBusWizardStore.getState().reset()
    expect(useBusWizardStore.getState().editVersion).toBeNull()
  })

  it('the version does not leak into the form data (so it is never sent as a form field)', () => {
    useBusWizardStore.getState().setEditMode('bus-1', { title: 'x' }, 5)
    expect(useBusWizardStore.getState().data).not.toHaveProperty('version')
  })
})
