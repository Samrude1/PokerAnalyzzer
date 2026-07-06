# Game Design Context

This file contains the visual and design standards for the game. Agents must reference this when creating new entities or UI elements.

## Canvas & Resolution
- **Base Resolution**: [e.g., 800x600 or 1920x1080]
- **Scaling Mode**: [e.g., Maintain aspect ratio (letterboxing) / Fill screen]

## Entity Dimensions (Hitboxes/Sprites)
| Entity Type | Dimensions (W x H) | Notes |
| :--- | :--- | :--- |
| Player | [e.g. 32x64] | [Notes] |
| Basic Enemy | [e.g. 32x32] | [Notes] |
| Projectile | [e.g. 8x8] | [Notes] |

## Color Palette
| Name | Hex/RGB | Usage |
| :--- | :--- | :--- |
| Background | #000000 | The clear color for the canvas |
| Primary Text | #ffffff | Menus and HUD text |
| Player Color | #00ff00 | Placeholder player square |
| Enemy Color | #ff0000 | Placeholder enemy square |

## Typography (UI)
- **Primary Font**: [e.g., 'Press Start 2P', monospace]
- **Size (Headers)**: [e.g., 32px]
- **Size (Body)**: [e.g., 16px]

## Camera
- **Type**: [e.g., Static single screen, Side-scrolling follow, Top-down follow]
- **Follow Rules**: [e.g., Keeps player in the center 50% of the screen]
