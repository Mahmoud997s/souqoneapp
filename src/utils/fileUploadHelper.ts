/**
 * Utility helper to build normalized file payloads for FormData uploads.
 * Handles iOS HEIC images, Expo cache paths, and ensures correct filename and mimeType.
 */
export function buildUploadFilePayload(img: any, prefix = 'upload') {
  const uri = typeof img === 'string' ? img : img?.uri || ''
  if (!uri) return null

  const uriExt = uri.split('.').pop()?.split('?')[0]?.toLowerCase()
  let mimeType = (typeof img === 'object' && img?.mimeType) || ''
  let fileName = (typeof img === 'object' && img?.fileName) || ''

  if (uriExt === 'jpg' || uriExt === 'jpeg') {
    mimeType = 'image/jpeg'
  } else if (uriExt === 'png') {
    mimeType = 'image/png'
  } else if (uriExt === 'webp') {
    mimeType = 'image/webp'
  } else if (!mimeType || mimeType === 'image/heic' || mimeType === 'image/heif') {
    mimeType = 'image/jpeg'
  }

  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  if (
    !fileName ||
    fileName.toLowerCase().endsWith('.heic') ||
    fileName.toLowerCase().endsWith('.heif') ||
    !fileName.includes('.')
  ) {
    fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`
  }

  return { uri, name: fileName, type: mimeType }
}
