import * as SecureStore from 'expo-secure-store'

export const storage = {
  getToken:        ()                              => SecureStore.getItemAsync('accessToken'),
  getRefreshToken: ()                              => SecureStore.getItemAsync('refreshToken'),
  setToken:        (token: string)                 => SecureStore.setItemAsync('accessToken', token),
  setRefreshToken: (token: string)                 => SecureStore.setItemAsync('refreshToken', token),
  clearTokens:     ()                              =>
    Promise.all([
      SecureStore.deleteItemAsync('accessToken'),
      SecureStore.deleteItemAsync('refreshToken'),
    ]),
  get:    (key: string)                           => SecureStore.getItemAsync(key),
  set:    (key: string, value: string)            => SecureStore.setItemAsync(key, value),
  delete: (key: string)                           => SecureStore.deleteItemAsync(key),
}
