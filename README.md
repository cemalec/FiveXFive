# FiveXFive — 5×5 Workout Tracker

A mobile app built with **React Native + Expo** that guides you through a classic **StrongLifts-style 5×5 strength training program**. Track your sets, check them off as you complete them, and let the built-in rest timer tell you when it's time to lift again.

---

## What is a 5×5 Workout?

The 5×5 program alternates between two workout days — **Day A** and **Day B** — every session.

### Day A
| Exercise | Sets | Reps |
|---|---|---|
| Squat | 5 | 5 |
| Bench Press | 5 | 5 |
| Barbell Row | 5 | 5 |

### Day B
| Exercise | Sets | Reps |
|---|---|---|
| Squat | 5 | 5 |
| Overhead Press | 5 | 5 |
| Deadlift | 1 | 5 |

Each working set is preceded by warm-up sets to prepare your body and reduce injury risk.

---

## Core Features

- **Day A / Day B tracking** — the app knows which day comes next and shows the right exercises.
- **Set check-off** — tap each set as you complete it so you always know where you are.
- **Rest timer** — after checking off a set, a countdown timer starts and alerts you when rest is over and it's time for the next set.
- **Warm-up sets** — warm-up sets are displayed before each working set.
- **On-device storage** — all progress is saved locally on your phone; no account or internet required.

---

## Tech Stack

This app is built with **React Native + Expo** because:

- **No native tooling required** — runs immediately via [Expo Go](https://expo.dev/go) on your phone; no Xcode or Android Studio setup needed to get started.
- **Best VS Code integration** — first-class TypeScript support with a dedicated Expo extension.
- **On-device storage built-in** — `@react-native-async-storage/async-storage` persists data locally with a simple key/value API.
- **Single codebase** — targets both iOS and Android from one TypeScript project.

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

The app uses [`@react-native-async-storage/async-storage`](https://react-native-async-storage.github.io/async-storage/) to persist workout progress directly on the device.

```ts
// Save
await AsyncStorage.setItem('@fivexfive_state', JSON.stringify(workoutState));

// Load
const saved = await AsyncStorage.getItem('@fivexfive_state');
```

All data lives **only on the device** — nothing is sent over the network.

---

## Project Structure

```
FiveXFive/
├── App.tsx          # Main app component (workout screen + logic)
├── index.ts         # Entry point
├── app.json         # Expo app configuration
├── package.json     # Dependencies
├── tsconfig.json    # TypeScript configuration
├── assets/          # Icons and splash screen images
└── .vscode/
    ├── extensions.json  # Recommended VS Code extensions
    └── settings.json    # Editor settings (format on save, etc.)
```

---

## Development Philosophy

This project is built step-by-step, one small change at a time. See [INSTRUCTIONS.md](INSTRUCTIONS.md) for the guiding philosophy and how to work on this codebase if you're new to React.
