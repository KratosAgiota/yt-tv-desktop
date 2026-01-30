# YouTube TV Electron

The Electron app runs YouTube on TVs: fullscreen, borderless, with gamepad API navigation and volume control on the screen.

## Features
- Fullscreen + frameless
- Xbox Series X User-Agent
- Native controls: D-pad/analog sticks/buttons
- Volume OSD (vertical bar) with % (player volume)
- Works even with other HIDs connected (prioritizes gamepads with "standard" mapping)

## Controls (default)
- Navigation: D-pad + left analog stick
- Confirm: A (Enter)
- Back: B + Back (Escape)
- Play/Pause: Start + X (Space)
- Search: Y (S)
- Rewind/Forward (hold): LT (J) / RT (L)
- Previous/Next Video: LB/RB (MediaPrevious/Next)
- Volume: right analog stick (player volume) + OSD

## Requirements
- Windows 10/11
- Node.js (LTS)

## Installation (dev)
```bash
npm install
npm start