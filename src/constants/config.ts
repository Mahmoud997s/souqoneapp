export const Config = {
  apiUrl:    process.env.EXPO_PUBLIC_API_URL!,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL!,
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD!,
} as const
