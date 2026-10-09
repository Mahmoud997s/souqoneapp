# SouqOne Mobile App

Arabic-language (RTL) marketplace app for Oman and the wider GCC, built with React Native and Expo.

## Marketplace verticals

| Vertical | Routes |
|---|---|
| Cars | `app/cars` |
| Buses | `app/buses` |
| Equipment | `app/equipment` |
| Operators | `app/equipment/operators` |
| Jobs (including drivers) | `app/jobs`, `app/jobs/drivers` |
| Parts | `app/parts` |
| Services | `app/services` |
| Transport (including carriers) | `app/transport`, `app/transport/carriers` |

Shared flows: authentication, chat, listing details, the multi-step posting wizard, profile and reviews.

## Tech stack

Exact versions are pinned in `package.json`.

- **Framework:** Expo SDK 57, Expo Router, React Native 0.86, React 19, TypeScript 6
- **State and data:** Zustand, TanStack React Query, Axios, Socket.IO client
- **Styling and UI:** NativeWind (Tailwind CSS 4), React Native Reanimated 4, Gorhom Bottom Sheet, FlashList
- **Maps and location:** react-native-maps, expo-location
- **Auth and storage:** Google Sign-In, expo-secure-store, AsyncStorage
- **Notifications:** expo-notifications
- **Testing:** Jest (jest-expo), React Native Testing Library, Detox configuration

## Requirements

- Node.js 22 (the version used by CI) and npm
- Android Studio (Android) or Xcode on macOS (iOS) to run native builds
- The project uses native modules (for example Google Sign-In and react-native-maps) together with `expo-dev-client`, so it must be run as a development build.

## Getting started

```bash
npm install
cp .env.example .env
```

Fill in the variables listed in `.env.example`, then start the app:

```bash
npm start            # Metro bundler
npm run android      # build and run on Android
npm run ios          # build and run on iOS (macOS only)
```

## Environment variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the backend REST API |
| `EXPO_PUBLIC_SOCKET_URL` | WebSocket endpoint used for real-time chat |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD` | Cloudinary cloud name used for image uploads |

Variables prefixed with `EXPO_PUBLIC_` are embedded in the app bundle. Never put secrets in them.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | `expo start` |
| `npm run android` | `expo run:android` |
| `npm run ios` | `expo run:ios` |
| `npm run web` | `expo start --web` |
| `npm test` | `jest` |

## Project structure

```
app/            Expo Router screens and layouts
  (auth)/       Sign-in and account flows
  (modals)/     Modal screens
  (tabs)/       Main tab screens
  cars/ buses/ equipment/ jobs/ parts/ services/ transport/   Vertical routes
  chat/ listings/ post/ profile/ reviews/                     Shared routes
src/
  api/          Axios client and token interceptor
  components/   UI components (shared and per vertical)
  config/       Configuration
  constants/    Constants and environment config
  context/      React contexts
  hooks/        Custom hooks
  screens/      Larger screen implementations
  services/     Sockets, notifications and sign-in services
  store/        Zustand stores
  types/        TypeScript types
  utils/        Helpers
assets/         Images, fonts and icons
e2e/            Detox end-to-end tests
reports/        Historical engineering reports
.github/        GitHub Actions workflow
```

## Testing

```bash
npx tsc --noEmit   # type check
npm test           # unit and component tests (Jest)
```

Detox is configured in `.detoxrc.js` with specs in `e2e/`. There is no npm script for it; run it with the Detox CLI against a local device configuration.

## Build and release

- **EAS build profiles** (`eas.json`): `development` (development client, internal distribution), `preview` (internal distribution) and `production` (auto-incrementing build number).
- **Runtime version:** Android uses a fixed `1.0.0`; iOS uses the `appVersion` policy. Over-the-air updates only apply to builds with a matching runtime version, and changes to native modules require a new build.
- **CI:** `.github/workflows/expo-update.yml` runs on every push to `master` (or manually) and publishes an EAS update to the `preview` branch. It needs the `EXPO_TOKEN` repository secret.

## Contributing

- Run `npx tsc --noEmit` and `npm test` before opening a pull request.
- Never commit secrets, keystores or `.env` files.

## License

Proprietary. All rights reserved.
