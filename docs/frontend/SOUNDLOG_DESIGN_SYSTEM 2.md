# Soundlog Design System

## Palette

The Soundlog palette is built from the reference colors:

| Token | Hex | Role |
| --- | --- | --- |
| `brand.pulseMagenta` | `#D718F1` | Personal taste, emotional highlights, everyday music energy |
| `brand.electricViolet` | `#4F2AEC` | Selected states, primary brand surfaces, active chips |
| `brand.signalPurple` | `#872BA8` | Supporting depth, recap and memory moments |
| `brand.limeWave` | `#B7E628` | High-priority action, travel mode, focus borders |
| `brand.deepIndigo` | `#3B11C4` | Deep anchors, player and navigation depth |

## Color Roles

Use role tokens from `src/constants/colors.ts` before adding screen-local colors.

- Backgrounds use near-black violet tones so the bright palette feels musical instead of flat.
- Surfaces use glassy purple cards and chips with white borders at low opacity.
- Active selections use electric violet with lime focus where the action should feel immediate.
- Primary CTAs and travel-state highlights use lime with `text.inverse`.
- Magenta is reserved for taste, mood, and expressive music moments.

## Tailwind Tokens

NativeWind tokens live under `soundlog` in `tailwind.config.js`.

- `bg-soundlog-bg`: app background
- `bg-soundlog-card`: standard cards
- `bg-soundlog-elevated`: emphasized panels
- `bg-soundlog-chip`: unselected chips and compact controls
- `bg-soundlog-selected`: selected chips and segmented controls
- `bg-soundlog-lime`: high-priority actions
- `border-soundlog-border`: standard purple border
- `border-soundlog-focus`: focus or active emphasis
- `text-soundlog-inverse`: text on lime or bright selected surfaces

## Component Rules

- Keep the camera capture action lime so it is recognizable across tabs.
- Keep tab active state lime and inactive state muted white.
- Chips should stay compact, rounded, and role-based: selected violet, unselected purple.
- Do not use the five source colors evenly on every screen. Each screen should have one dominant role and one accent.
- Avoid adding new hex values in components unless the value is data-driven, such as track artwork fallback colors.
