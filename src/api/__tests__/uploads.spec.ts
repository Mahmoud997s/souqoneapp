import { uploadsApi } from '../uploads'
import { transportApi } from '../transport'
import { apiClient } from '../client'

jest.mock('../client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}))

describe('uploadsApi and transportApi configurations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uploadsApi.single configures multipart/form-data and preserves data in transformRequest', async () => {
    const mockFormData = new FormData()
    mockFormData.append('file', 'test-data')

    ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { url: 'https://test.com/img.jpg' } })

    await uploadsApi.single(mockFormData)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads',
      mockFormData,
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )

    const callConfig = (apiClient.post as jest.Mock).mock.calls[0][2]
    expect(typeof callConfig.transformRequest).toBe('function')
    expect(callConfig.transformRequest(mockFormData)).toBe(mockFormData)
  })

  it('uploadsApi.multiple configures multipart/form-data and preserves data in transformRequest', async () => {
    const mockFormData = new FormData()
    ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: [{ url: 'https://test.com/img1.jpg' }] })

    await uploadsApi.multiple(mockFormData)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/multiple',
      mockFormData,
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )

    const callConfig = (apiClient.post as jest.Mock).mock.calls[0][2]
    expect(typeof callConfig.transformRequest).toBe('function')
    expect(callConfig.transformRequest(mockFormData)).toBe(mockFormData)
  })

  it('transportApi.uploadImages configures multipart/form-data and preserves data in transformRequest', async () => {
    const mockFormData = new FormData()
    ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } })

    await transportApi.uploadImages('req-123', mockFormData)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/transport/requests/req-123/images',
      mockFormData,
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )

    const callConfig = (apiClient.post as jest.Mock).mock.calls[0][2]
    expect(typeof callConfig.transformRequest).toBe('function')
    expect(callConfig.transformRequest(mockFormData)).toBe(mockFormData)
  })
})
