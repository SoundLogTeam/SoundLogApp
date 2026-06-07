# Soundlog Design System

## Palette

Soundlog keeps the original dark navy and muted violet UI, with one new highlight color:

| Token | Hex | Role |
| --- | --- | --- |
| `background.primary` | `#070B1F` | App background |
| `surface.card` | `#080D18` | Standard cards |
| `surface.chip` | `#0E1E3A` | Default chips and compact controls |
| `surface.chipSelected` | `#243A75` | Selected chips |
| `accent.purple` | `#7A2CFF` | Existing Soundlog purple accent |
| `accent.lime` | `#B7E628` | High-priority action and active focus only |

## Color Rules

- Use dark navy surfaces as the default visual language.
- Use fluorescent lime sparingly: camera action, active tab, selected/focused border, and Travel mode.
- Do not use the full reference palette across chips or cards.
- Keep chips compact and calm: default navy, selected muted blue, lime only as the selection border.
- Avoid adding new bright hex values inside components unless the color comes from content data.

## Tailwind Tokens

- `bg-soundlog-bg`: app background
- `bg-soundlog-card`: standard cards
- `bg-soundlog-elevated`: emphasized dark panels
- `bg-soundlog-chip`: unselected chips
- `bg-soundlog-selected`: selected chips
- `bg-soundlog-lime`: high-priority action only
- `border-soundlog-border`: standard chip border
- `border-soundlog-focus`: active/focused lime border
