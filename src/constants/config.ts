export const Config = {
  apiUrl:    process.env.EXPO_PUBLIC_API_URL || 'https://caroneapi-production-255b.up.railway.app/api/v1',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'https://caroneapi-production-255b.up.railway.app',
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || 'dityoyp85',
} as const
