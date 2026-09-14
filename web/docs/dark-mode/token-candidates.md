# Portal token candidates

These are calculated candidates, not approved dark-mode aliases. Use semantic-mapping.json for proposed role-specific choices. Full definitions, literal colors, utilities and SVG values are in portal-colors.json.

Nearest uses Euclidean OKLab distance across 57 UI primitives. Opposite reflects lightness within that nearest token family, retaining its hue coordinates; no RGB hue complement. Near-white tints can match a neutral family, so preserve status/brand meaning during semantic review.

| Current token                        | Current value | Nearest Figma primitive                     | Tonal opposite                              |
| ------------------------------------ | ------------- | ------------------------------------------- | ------------------------------------------- |
| `--color-additional-blue-100`        | `#e4f2fe`     | Specialty/Blue/Secondary `#e6f0ff`          | Specialty/Blue/Primary `#005cff`            |
| `--color-additional-blue-500`        | `#4292f4`     | Primary/Info/500 `#3385ff`                  | Primary/Info/500 `#3385ff`                  |
| `--color-additional-blue-600`        | `#005cff`     | Primary/Info/600 `#005cff`                  | Primary/Info/500 `#3385ff`                  |
| `--color-additional-green-100`       | `#ebfaec`     | Primary/Success/100 `#e6f9ec`               | Primary/Success/900 `#004d13`               |
| `--color-additional-green-500`       | `#00c313`     | Primary/Success/600 `#00c230`               | Primary/Success/700 `#009b26`               |
| `--color-additional-lightOrange-100` | `#fff7f0`     | Primary/Warning/100 `#fff6e6`               | Primary/Warning/900 `#664600`               |
| `--color-additional-lightOrange-500` | `#ffa048`     | Primary/Warning/600 `#ffae00`               | Primary/Warning/800 `#996800`               |
| `--color-additional-orange-100`      | `#fff3f0`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-additional-orange-500`      | `#ff6848`     | Specialty/Carrot Orange/Primary `#ff5a00`   | Specialty/Carrot Orange/Secondary `#ffede6` |
| `--color-additional-pink-100`        | `#fff1f7`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-additional-pink-500`        | `#ff5096`     | Primary/Error/400 `#f97b6f`                 | Primary/Error/700 `#c2200a`                 |
| `--color-additional-purple-100`      | `#f7f1ff`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-additional-purple-500`      | `#9d50ff`     | Specialty/Purple/Primary `#8600ff`          | Specialty/Purple/Secondary `#f2e6ff`        |
| `--color-additional-sea-100`         | `#ebfaf9`     | Specialty/World Blue/Secondary `#ecfbfd`    | Specialty/World Blue/Primary `#3fdbed`      |
| `--color-additional-sea-500`         | `#00c3b6`     | Specialty/World Blue/Primary `#3fdbed`      | Specialty/World Blue/Secondary `#ecfbfd`    |
| `--color-additional-yellow-100`      | `#fffbeb`     | Primary/Warning/100 `#fff6e6`               | Primary/Warning/900 `#664600`               |
| `--color-additional-yellow-500`      | `#ffc700`     | Primary/Warning/500 `#ffb833`               | Primary/Warning/800 `#996800`               |
| `--color-blue-100`                   | `#f0f0fd`     | Specialty/Blue/Secondary `#e6f0ff`          | Specialty/Blue/Primary `#005cff`            |
| `--color-blue-150`                   | `#dcd9fd`     | Primary/Info/200 `#cce0ff`                  | Primary/Info/900 `#002466`                  |
| `--color-blue-50`                    | `#f9f9fe`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-blue-500`                   | `#4940e0`     | Primary/Info/700 `#004acc`                  | Primary/Info/400 `#66a3ff`                  |
| `--color-danger`                     | `#f2280d`     | Primary/Error/600 `#f2280d`                 | Primary/Error/500 `#f7503f`                 |
| `--color-grey-0`                     | `#ffffff`     | Primary/Grey/0 `#ffffff`                    | Primary/Grey/900 `#181818`                  |
| `--color-grey-100`                   | `#f3f4f5`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-grey-200`                   | `#ebecef`     | Primary/Grey/200 `#ebecef`                  | Primary/Grey/900 `#181818`                  |
| `--color-grey-25`                    | `#fbfbfc`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-grey-300`                   | `#d6d9dd`     | Primary/Grey/300 `#d6d9dd`                  | Primary/Grey/700 `#3c424b`                  |
| `--color-grey-400`                   | `#9ba3ae`     | Primary/Grey/400 `#9ba3ae`                  | Primary/Grey/500 `#717680`                  |
| `--color-grey-50`                    | `#f9fafb`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-grey-500`                   | `#657080`     | Primary/Grey/500 `#717680`                  | Primary/Grey/450 `#838d9b`                  |
| `--color-grey-70`                    | `#f5f5f7`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-grey-700`                   | `#3c424b`     | Primary/Grey/700 `#3c424b`                  | Primary/Grey/350 `#b1b8c2`                  |
| `--color-grey-900`                   | `#191c20`     | Primary/Grey/900 `#181818`                  | Primary/Grey/50 `#f9fafb`                   |
| `--color-portal-accent`              | `#e6f0ff`     | Specialty/Blue/Secondary `#e6f0ff`          | Specialty/Blue/Primary `#005cff`            |
| `--color-portal-accent-ring`         | `#b8d4ff`     | Primary/Info/200 `#cce0ff`                  | Primary/Info/800 `#003799`                  |
| `--color-portal-blue`                | `#007cfb`     | Primary/Info/500 `#3385ff`                  | Primary/Info/500 `#3385ff`                  |
| `--color-portal-border`              | `#f1f1f1`     | Primary/Grey/100 `#f3f4f5`                  | Primary/Grey/900 `#181818`                  |
| `--color-portal-canvas`              | `#f7f7f7`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-portal-faint`               | `#b8b8b8`     | Primary/Grey/350 `#b1b8c2`                  | Primary/Grey/700 `#3c424b`                  |
| `--color-portal-heading`             | `#0b1928`     | Primary/Grey/900 `#181818`                  | Primary/Grey/0 `#ffffff`                    |
| `--color-portal-ink`                 | `#1f1f1f`     | Primary/Grey/900 `#181818`                  | Primary/Grey/100 `#f3f4f5`                  |
| `--color-portal-ink-hover`           | `#333333`     | Primary/Grey/700 `#3c424b`                  | Primary/Grey/300 `#d6d9dd`                  |
| `--color-portal-muted`               | `#757575`     | Primary/Grey/500 `#717680`                  | Primary/Grey/450 `#838d9b`                  |
| `--color-portal-purple`              | `#7d00fe`     | Specialty/Purple/Primary `#8600ff`          | Specialty/Purple/Secondary `#f2e6ff`        |
| `--color-portal-subtle`              | `#9c9c9c`     | Primary/Grey/400 `#9ba3ae`                  | Primary/Grey/500 `#717680`                  |
| `--color-portal-text`                | `#181818`     | Primary/Grey/900 `#181818`                  | Primary/Grey/0 `#ffffff`                    |
| `--color-system-error-100`           | `#fff2f0`     | Specialty/Carrot Orange/Secondary `#ffede6` | Specialty/Carrot Orange/Primary `#ff5a00`   |
| `--color-system-error-200`           | `#ffe5e2`     | Primary/Error/100 `#fee9e7`                 | Primary/Error/900 `#611005`                 |
| `--color-system-error-300`           | `#ffcbc5`     | Primary/Error/200 `#fdd3cf`                 | Primary/Error/900 `#611005`                 |
| `--color-system-error-400`           | `#ff897c`     | Primary/Error/400 `#f97b6f`                 | Primary/Error/700 `#c2200a`                 |
| `--color-system-error-50`            | `#fff5f3`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-system-error-500`           | `#ff4732`     | Primary/Error/500 `#f7503f`                 | Primary/Error/600 `#f2280d`                 |
| `--color-system-error-600`           | `#db2824`     | Primary/Error/600 `#f2280d`                 | Primary/Error/500 `#f7503f`                 |
| `--color-system-error-700`           | `#ff5a76`     | Primary/Error/500 `#f7503f`                 | Primary/Error/700 `#c2200a`                 |
| `--color-system-error-800`           | `#930f22`     | Primary/Error/800 `#911808`                 | Primary/Error/300 `#fba79f`                 |
| `--color-system-error-900`           | `#7a0922`     | Primary/Error/800 `#911808`                 | Primary/Error/200 `#fdd3cf`                 |
| `--color-system-success-100`         | `#f5fdf6`     | Primary/Grey/50 `#f9fafb`                   | Primary/Grey/900 `#181818`                  |
| `--color-system-success-300`         | `#66cc66`     | Primary/Success/500 `#33d167`               | Primary/Success/700 `#009b26`               |
| `--color-system-success-400`         | `#29cc29`     | Primary/Success/600 `#00c230`               | Primary/Success/700 `#009b26`               |
| `--color-system-success-50`          | `#e9f8e9`     | Primary/Success/100 `#e6f9ec`               | Primary/Success/900 `#004d13`               |
| `--color-system-success-500`         | `#00b800`     | Primary/Success/600 `#00c230`               | Primary/Success/600 `#00c230`               |
| `--color-system-success-600`         | `#008000`     | Primary/Success/800 `#00741d`               | Primary/Success/400 `#66dc8d`               |
| `--color-system-success-700`         | `#00c313`     | Primary/Success/600 `#00c230`               | Primary/Success/700 `#009b26`               |
| `--color-system-success-800`         | `#004d00`     | Primary/Success/900 `#004d13`               | Primary/Success/200 `#ccf3d9`               |
| `--color-system-success-900`         | `#003700`     | Primary/Success/900 `#004d13`               | Primary/Success/200 `#ccf3d9`               |
| `--color-system-warning-100`         | `#fff9ef`     | Primary/Warning/100 `#fff6e6`               | Primary/Warning/900 `#664600`               |
| `--color-system-warning-200`         | `#ffe999`     | Primary/Warning/300 `#ffdb99`               | Primary/Warning/900 `#664600`               |
| `--color-system-warning-300`         | `#ffda66`     | Primary/Warning/400 `#ffc966`               | Primary/Warning/800 `#996800`               |
| `--color-system-warning-50`          | `#fffae5`     | Primary/Warning/100 `#fff6e6`               | Primary/Warning/900 `#664600`               |
| `--color-system-warning-500`         | `#ffb200`     | Primary/Warning/600 `#ffae00`               | Primary/Warning/800 `#996800`               |
| `--color-system-warning-600`         | `#db9200`     | Primary/Warning/700 `#cc8b00`               | Primary/Warning/700 `#cc8b00`               |
| `--color-system-warning-650`         | `#cc8b00`     | Primary/Warning/700 `#cc8b00`               | Primary/Warning/700 `#cc8b00`               |
| `--color-system-warning-700`         | `#ffb11b`     | Primary/Warning/600 `#ffae00`               | Primary/Warning/800 `#996800`               |
| `--color-system-warning-75`          | `#fff6e6`     | Primary/Warning/100 `#fff6e6`               | Primary/Warning/900 `#664600`               |
| `--color-system-warning-800`         | `#935900`     | Primary/Warning/800 `#996800`               | Primary/Warning/400 `#ffc966`               |

These names refer to paint styles extracted from the linked UI Kit, not existing Figma variables. Token names with similar numbers do not necessarily share the same values in the portal and Figma.
