# YouTube TV for Desktop

A simple Electron-based desktop app that runs **YouTube TV** in a **living-room / couch-friendly mode** on Windows.

This project focuses on **fullscreen usage, controller-first navigation (XInput)** and a clean TV-like experience, instead of being a full-featured YouTube client.

> ⚠️ **Important note about video quality:**  
> Due to DRM and platform restrictions of **YouTube TV (TVHTML5)**, higher resolutions (1080p / 4K) may be unavailable.  
> At the moment, I **don’t have a reliable way to bypass or solve these limitations**, and it’s unclear if this will ever be fully possible in Electron.

---

## ✨ What is this project?

This app is essentially:
- A **lightweight Electron wrapper** around YouTube TV
- Optimized for **TV screens**
- Designed to be used **entirely with a controller** (no mouse required)

It is intentionally **simple**, with minimal UI changes, and tries to behave more like a **console app** than a traditional desktop application.

---

## 🎮 Features

- Fullscreen + frameless window (TV mode)
- Xbox Series X–like User-Agent
- Native **Gamepad API** support (XInput-style controllers)
- Controller-first navigation (D-pad, analog sticks, buttons)
- On-screen **Volume OSD** (vertical bar + percentage)
- Player volume control (independent from Windows volume)
- Automatically prioritizes gamepads with `mapping: "standard"`
  - Prevents conflicts with other HID devices (e.g. Arduino, wheels, shifters)

---

## 🕹️ Default Controller Mapping (XInput)

| Action | Control |
|------|--------|
| Navigation | D-pad + Left Analog Stick |
| Confirm | **A** (Enter) |
| Back / Cancel | **B** + **Back** (Escape) |
| Play / Pause | **Start** + **X** (Space) |
| Search | **Y** (S) |
| Rewind (hold) | **LT** (J) |
| Fast Forward (hold) | **RT** (L) |
| Previous / Next Video | **LB / RB** |
| Volume Up / Down | Right Analog Stick (vertical) |

> The mapping is designed to feel natural for Xbox-compatible controllers, but may also work with other XInput devices.

---

## 📉 About Video Quality & DRM

YouTube TV uses a **TVHTML5 + DRM-based delivery pipeline**.

Because this app runs inside **Electron (Chromium)**:
- The environment is **not considered a certified TV or browser platform**
- YouTube may limit playback to **720p**
- In rare cases, 1080p or 1080p Premium may work, but it is **not consistent**

At this moment:
- ❌ Widevine injection does **not** reliably fix this
- ❌ User-Agent spoofing alone is **not sufficient**
- ❓ It is unknown if these limitations can ever be fully bypassed in Electron

This project **does not attempt to hack DRM** and respects YouTube’s platform restrictions.

---

## 🧪 Project Status

- 🚧 **In active development**
- 🧩 Core features are stable
- 🎮 Controller support is the main focus
- 🔬 DRM / quality limitations are still under investigation

Future improvements may include:
- Configurable controller profiles
- Supports controller vibration
- General stability and performance improvements

---

## 🖥️ Requirements

- Windows 10 / 11
- Node.js (LTS)
- An XInput-compatible controller (Xbox, GameSir, etc.)

---

## 🚀 Running the app (development)

```bash
npm install
npm start
```

## 📦 Building the installer (Windows)
```bash
npm run dist
```

The installer and portable builds will be generated in the `dist/` folder.

## ❤️ Motivation

This project started as a personal experiment to create a better YouTube TV experience on PC, focused on comfort, controllers and living-room usage.

It is not meant to replace official apps, but to explore what’s possible with Electron and modern web APIs in a TV-like context.

Contributions, ideas and feedback are welcome.
