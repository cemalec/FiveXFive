# How We Build This App — A Guide for React Beginners

This document explains the philosophy behind how we develop this project and what to expect from each coding session. **You do not need to know React to work on this.** The whole point is to learn by doing, with careful, explained steps.

---

## The Core Philosophy: One Small Change at a Time

The single most important rule is: **one change, one purpose, one test.**

Every change we make will:
1. Do exactly one thing.
2. Be fully explained before we touch any code.
3. Be tested on your phone before we move to the next thing.

This might feel slow at first, but it is the fastest path to a working app. Large batches of changes mean large, mysterious bugs that are hard to diagnose. Small changes mean small, obvious problems that are easy to fix.

---

## What "Small" Means in Practice

Here are examples of what counts as a single change:

| Too Big — Split It Up | Just Right |
|---|---|
| "Add the workout screen with all exercises and a timer" | "Display the name of today's workout (Day A or Day B)" |
| "Make the app save progress and load it on startup" | "Save the current workout day to the device when it changes" |
| "Add warm-up sets to all exercises" | "Add warm-up sets for the Squat only, then we'll copy the pattern" |

If a task sounds like it has the word "and" in it, it is probably two tasks.

---

## How a Typical Session Works

1. **We agree on the single goal** for this change. Example: "Show a list of the three exercises for Day A."
2. **I explain what we're going to do** and why, in plain English, before writing any code.
3. **I make the code change** — usually editing just one file, sometimes two.
4. **You run the app** (`npm start`) and scan the QR code with Expo Go to see the result on your phone.
5. **We confirm it works**, then move on to the next small step.

---

## How to Run the App

Every time you want to see your changes:

```bash
# From the FiveXFive folder in your terminal
npm start
```

This starts a development server. A QR code will appear in the terminal. Open **Expo Go** on your phone and scan it. The app will load. Any time you save a file, the app will automatically reload on your phone.

To stop the server, press `Ctrl + C` in the terminal.

---

## Key Concepts You'll Encounter (Plain English)

You don't need to memorize these — just refer back here when something unfamiliar comes up.

### Component
A **component** is a reusable building block of the UI. Think of it like a LEGO brick. `App.tsx` is a component. A "Set Checkbox" will be a component. A "Rest Timer" will be a component. Each component is responsible for one thing.

### State
**State** is data that can change and that the app needs to remember — like "how many sets have been checked off" or "how many seconds are left on the rest timer." When state changes, React automatically redraws the part of the screen that depends on it.

### Props
**Props** are how you pass information from one component to another. Like a function argument. If a `SetRow` component needs to know whether it's been completed, you pass that in as a prop.

### `useState`
A React built-in that lets a component remember a value. Example: `const [secondsLeft, setSecondsLeft] = useState(90)` creates a timer counter starting at 90. When you call `setSecondsLeft(89)`, React redraws the timer display automatically.

### `useEffect`
A React built-in that lets you run code when something changes or when a component first appears on screen. This is how we'll run the countdown timer — every second, decrement the counter.

### AsyncStorage
The library we use to save data to the phone's local storage. Think of it like a tiny notepad that persists even when the app is closed. We'll use it to remember which day comes next and which weights you were using.

---

## File Map

| File | What It Does |
|---|---|
| `App.tsx` | The main screen of the app. This is where most of our work will happen at first. |
| `index.ts` | The entry point — tells Expo which component to show first. You will rarely touch this. |
| `app.json` | App configuration (name, icon, colors). Touch this only when changing app-level settings. |
| `package.json` | Lists all the libraries the app depends on. We add new libraries here via `npm install`. |
| `assets/` | Images used for the app icon and loading screen. |

---

## When Things Go Wrong

- **Red error screen on your phone?** Read the error message — it almost always tells you exactly which file and line number caused the problem. Copy it and bring it here.
- **App won't start?** Run `npm install` first, then `npm start` again.
- **Change doesn't show up?** Save the file (Cmd+S), and the app should reload automatically. If not, shake your phone in Expo Go and tap "Reload".
- **Everything is broken and you want to go back?** We use `git` to save snapshots of the working code. You can always roll back to the last working state.

---

## The Golden Rule

> **Never let the app get into a broken state and then pile more changes on top.**

Before moving to the next feature, the current feature must work. Every step forward is on solid ground.
