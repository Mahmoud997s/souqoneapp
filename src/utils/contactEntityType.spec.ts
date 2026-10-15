import { resolveContactEntityType } from './contactEntityType'

describe('resolveContactEntityType', () => {
  it('resolves cars category to LISTING', () => {
    expect(resolveContactEntityType('cars')).toBe('LISTING')
    expect(resolveContactEntityType('car')).toBe('LISTING')
    expect(resolveContactEntityType('listing')).toBe('LISTING')
    expect(resolveContactEntityType('listings')).toBe('LISTING')
  })

  it('resolves buses category to BUS_LISTING', () => {
    expect(resolveContactEntityType('buses')).toBe('BUS_LISTING')
    expect(resolveContactEntityType('bus')).toBe('BUS_LISTING')
  })

  it('resolves equipment category to EQUIPMENT_LISTING or OPERATOR_LISTING', () => {
    expect(resolveContactEntityType('equipment')).toBe('EQUIPMENT_LISTING')
    expect(resolveContactEntityType('equipment', { listingType: 'EQUIPMENT_SALE' })).toBe('EQUIPMENT_LISTING')
    expect(resolveContactEntityType('equipment', { listingType: 'OPERATOR' })).toBe('OPERATOR_LISTING')
  })

  it('resolves operators category to OPERATOR_LISTING', () => {
    expect(resolveContactEntityType('operators')).toBe('OPERATOR_LISTING')
    expect(resolveContactEntityType('operator')).toBe('OPERATOR_LISTING')
  })

  it('resolves parts category to SPARE_PART', () => {
    expect(resolveContactEntityType('parts')).toBe('SPARE_PART')
    expect(resolveContactEntityType('part')).toBe('SPARE_PART')
    expect(resolveContactEntityType('spare_parts')).toBe('SPARE_PART')
    expect(resolveContactEntityType('spare-parts')).toBe('SPARE_PART')
  })

  it('resolves services category to CAR_SERVICE', () => {
    expect(resolveContactEntityType('services')).toBe('CAR_SERVICE')
    expect(resolveContactEntityType('service')).toBe('CAR_SERVICE')
    expect(resolveContactEntityType('car_services')).toBe('CAR_SERVICE')
  })

  it('resolves jobs category to DRIVER_JOB or DRIVER_PROFILE or EMPLOYER_PROFILE', () => {
    expect(resolveContactEntityType('jobs')).toBe('DRIVER_JOB')
    expect(resolveContactEntityType('job')).toBe('DRIVER_JOB')
    expect(resolveContactEntityType('jobs', { listingType: 'HIRING' })).toBe('DRIVER_JOB')
    // Driver profile under jobs
    expect(resolveContactEntityType('jobs', { licenseTypes: ['HEAVY_TRUCK'] })).toBe('DRIVER_PROFILE')
    expect(resolveContactEntityType('jobs', { listingType: 'DRIVER_PROFILE' })).toBe('DRIVER_PROFILE')
    // Employer profile under jobs
    expect(resolveContactEntityType('jobs', { listingType: 'EMPLOYER_PROFILE' })).toBe('EMPLOYER_PROFILE')
  })

  it('resolves drivers category to DRIVER_PROFILE', () => {
    expect(resolveContactEntityType('drivers')).toBe('DRIVER_PROFILE')
    expect(resolveContactEntityType('driver')).toBe('DRIVER_PROFILE')
  })

  it('resolves employers category to EMPLOYER_PROFILE', () => {
    expect(resolveContactEntityType('employers')).toBe('EMPLOYER_PROFILE')
    expect(resolveContactEntityType('employer')).toBe('EMPLOYER_PROFILE')
  })

  it('resolves transport category to CARRIER_PROFILE or TRANSPORT_REQUEST', () => {
    expect(resolveContactEntityType('transport')).toBe('TRANSPORT_REQUEST')
    expect(resolveContactEntityType('transport', { listingType: 'OPEN' })).toBe('TRANSPORT_REQUEST')
    // Carrier profile under transport
    expect(resolveContactEntityType('transport', { listingType: 'CARRIER_PROFILE' })).toBe('CARRIER_PROFILE')
    expect(resolveContactEntityType('transport', { companyName: 'شركة النقل السريع' })).toBe('CARRIER_PROFILE')
    expect(resolveContactEntityType('carriers')).toBe('CARRIER_PROFILE')
    expect(resolveContactEntityType('carrier')).toBe('CARRIER_PROFILE')
  })

  it('preserves valid entityType directly passed in uppercase', () => {
    expect(resolveContactEntityType('BUS_LISTING')).toBe('BUS_LISTING')
    expect(resolveContactEntityType('SPARE_PART')).toBe('SPARE_PART')
    expect(resolveContactEntityType('OPERATOR_LISTING')).toBe('OPERATOR_LISTING')
    expect(resolveContactEntityType('CAR_SERVICE')).toBe('CAR_SERVICE')
    expect(resolveContactEntityType('DRIVER_JOB')).toBe('DRIVER_JOB')
    expect(resolveContactEntityType('DRIVER_PROFILE')).toBe('DRIVER_PROFILE')
    expect(resolveContactEntityType('EMPLOYER_PROFILE')).toBe('EMPLOYER_PROFILE')
    expect(resolveContactEntityType('CARRIER_PROFILE')).toBe('CARRIER_PROFILE')
    expect(resolveContactEntityType('TRANSPORT_REQUEST')).toBe('TRANSPORT_REQUEST')
  })

  it('defaults to LISTING for unknown category', () => {
    expect(resolveContactEntityType('')).toBe('LISTING')
    expect(resolveContactEntityType(undefined)).toBe('LISTING')
    expect(resolveContactEntityType('unknown_cat')).toBe('LISTING')
  })
})
