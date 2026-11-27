import { uploadsApi } from '../uploads'
import { apiClient } from '../client'

jest.mock('../client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}))

describe('uploadsApi configurations', () => {
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

  it('uploadsApi.chat posts to /uploads/chat with multipart/form-data, signal, and progress', async () => {
    const mockFormData = new FormData()
    mockFormData.append('file', 'audio-data')
    const controller = new AbortController()
    const onProgress = jest.fn()

    ;(apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { url: 'https://cdn.example/chat/voice.m4a', key: 'carone/chat/voice' },
    })

    await uploadsApi.chat(mockFormData, controller.signal, onProgress)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/uploads/chat',
      mockFormData,
      expect.objectContaining({
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
      })
    )

    const callConfig = (apiClient.post as jest.Mock).mock.calls[0][2]
    expect(typeof callConfig.transformRequest).toBe('function')
    expect(callConfig.transformRequest(mockFormData)).toBe(mockFormData)
    callConfig.onUploadProgress({ loaded: 50, total: 100 })
    expect(onProgress).toHaveBeenCalledWith(50)
  })
})
