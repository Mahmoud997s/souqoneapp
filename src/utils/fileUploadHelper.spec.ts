import { buildUploadFilePayload } from './fileUploadHelper'

describe('buildUploadFilePayload', () => {
  it('returns null for null, undefined or empty input', () => {
    expect(buildUploadFilePayload(null)).toBeNull()
    expect(buildUploadFilePayload('')).toBeNull()
    expect(buildUploadFilePayload({ uri: '' })).toBeNull()
  })

  it('normalizes string URI into payload with default jpg extension and image/jpeg', () => {
    const payload = buildUploadFilePayload('file:///cache/photo.jpg', 'car')
    expect(payload).not.toBeNull()
    expect(payload?.uri).toBe('file:///cache/photo.jpg')
    expect(payload?.type).toBe('image/jpeg')
    expect(payload?.name).toMatch(/^car_\d+_[a-z0-9]+\.jpg$/)
  })

  it('handles iOS HEIC filename by converting extension to jpg and type to image/jpeg', () => {
    const img = {
      uri: 'file:///var/mobile/Containers/Data/Application/123/tmp/IMG_0001.jpeg',
      fileName: 'IMG_0001.HEIC',
      mimeType: 'image/heic',
    }
    const payload = buildUploadFilePayload(img, 'car')
    expect(payload).not.toBeNull()
    expect(payload?.uri).toBe(img.uri)
    expect(payload?.type).toBe('image/jpeg')
    expect(payload?.name).toMatch(/^car_\d+_[a-z0-9]+\.jpg$/)
  })

  it('preserves valid PNG image format and filename', () => {
    const img = {
      uri: 'file:///cache/icon.png',
      fileName: 'my_icon.png',
      mimeType: 'image/png',
    }
    const payload = buildUploadFilePayload(img, 'part')
    expect(payload).not.toBeNull()
    expect(payload?.uri).toBe(img.uri)
    expect(payload?.type).toBe('image/png')
    expect(payload?.name).toBe('my_icon.png')
  })

  it('preserves valid WebP format and filename', () => {
    const img = {
      uri: 'file:///cache/banner.webp',
      fileName: 'banner.webp',
      mimeType: 'image/webp',
    }
    const payload = buildUploadFilePayload(img, 'service')
    expect(payload).not.toBeNull()
    expect(payload?.uri).toBe(img.uri)
    expect(payload?.type).toBe('image/webp')
    expect(payload?.name).toBe('banner.webp')
  })

  it('falls back to custom prefix when fileName is missing', () => {
    const img = {
      uri: 'file:///cache/some_image',
    }
    const payload = buildUploadFilePayload(img, 'bus')
    expect(payload).not.toBeNull()
    expect(payload?.name).toMatch(/^bus_\d+_[a-z0-9]+\.jpg$/)
    expect(payload?.type).toBe('image/jpeg')
  })
})
