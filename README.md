# FiveXFive

A simple 5×5 grid mobile app built with **React Native + Expo**. Tap cells to fill them; your progress is automatically saved to the device — no internet or backend required.

---

## Mobile Development Options (VS Code)

Before diving in, here is a comparison of the most popular frameworks for VS Code mobile development with **on-device storage** (no backend needed):

| Option | Language | Platforms | Beginner-friendly | Local Storage |
|--------|----------|-----------|-------------------|---------------|
| **[React Native + Expo](https://expo.dev)** ✅ *(chosen)* | TypeScript/JavaScript | iOS, Android, Web | ⭐⭐⭐ Highest | `AsyncStorage`, `expo-file-system`, SQLite |
| **[Flutter](https://flutter.dev)** | Dart | iOS, Android, Web, Desktop | ⭐⭐ Medium | `shared_preferences`, `sqflite`, `path_provider` |
| **[Ionic + Capacitor](https://ionicframework.com)** | TypeScript + HTML/CSS | iOS, Android, Web | ⭐⭐ Medium | Capacitor `Preferences`, `Filesystem` plugins |

### Why React Native + Expo was chosen

- **No native tooling required** — runs immediately via [Expo Go](https://expo.dev/go) on your phone; no Xcode or Android Studio needed to get started.
- **Best VS Code integration** — first-class TypeScript support and a dedicated [Expo Tools extension](https://marketplace.visualstudio.com/items?itemName=expo.vscode-expo-tools).
- **On-device storage built-in** — `@react-native-async-storage/async-storage` persists data locally on the device with a simple key/value API.
- **Single codebase** — targets both iOS and Android from one TypeScript project.

If you later outgrow Expo, you can *eject* to a bare React Native project and keep all your existing code.

---

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js 18+** | <https://nodejs.org> |
| **Expo Go** (phone) | [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) · [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |
| **VS Code** | <https://code.visualstudio.com> |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm start
```

Scan the QR code with **Expo Go** on your phone (or press `a` for Android emulator / `i` for iOS simulator).

---

## VS Code Setup

When you open this folder in VS Code you will be prompted to install the recommended extensions (stored in `.vscode/extensions.json`):

| Extension | Purpose |
|-----------|---------|
| `expo.vscode-expo-tools` | Expo-specific IntelliSense & debugging |
| `msjsdiag.vscode-react-native` | React Native debugger |
| `dbaeumer.vscode-eslint` | Linting |
| `esbenp.prettier-vscode` | Auto-formatting on save |
| `ms-vscode.vscode-typescript-next` | Latest TypeScript language features |

---

## How Local Storage Works

The app uses [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) to persist the grid state directly on the device.

```ts
// Save
await AsyncStorage.setItem('@fivexfive_grid', JSON.stringify(grid));

// Load
const saved = await AsyncStorage.getItem('@fivexfive_grid');
```

All data lives **only on the device** — nothing is sent over the network.

---

## Project Structure

```
FiveXFive/
├── App.tsx          # Main app component (5×5 grid + storage logic)
├── index.ts         # Entry point
├── app.json         # Expo app configuration
├── package.json     # Dependencies
├── tsconfig.json    # TypeScript configuration
├── assets/          # Icons and splash screen images
└── .vscode/
    ├── extensions.json  # Recommended VS Code extensions
    └── settings.json    # Editor settings (format on save, etc.)
```
