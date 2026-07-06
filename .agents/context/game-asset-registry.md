# Game Asset Registry

This document catalogs all visual, audio, and configuration assets used in the game. AI agents must consult this registry to reuse existing assets before requesting new ones or duplicating loaded resources.

## Graphics & Sprites

| Asset Name | File Path | Dimensions / Type | Description / Usage |
| :--- | :--- | :--- | :--- |
| `[e.g. player_idle]` | `[e.g. assets/sprites/player_idle.png]` | `[e.g. 32x32]` | `[e.g. Player idle animation frame]` |
| `[Asset Name]` | `[Path]` | `[Type]` | `[Description]` |

## Audio (BGM & SFX)

| Asset Name | File Path | Type (BGM/SFX) | Description / Usage |
| :--- | :--- | :--- | :--- |
| `[e.g. jump_sound]` | `[e.g. assets/sfx/jump.wav]` | `[e.g. SFX]` | `[e.g. Played when player jumps]` |
| `[Asset Name]` | `[Path]` | `[Type]` | `[Description]` |

## Levels & Maps

| Level Name | File Path | Description |
| :--- | :--- | :--- |
| `[e.g. level_1]` | `[e.g. assets/maps/level1.json]` | `[e.g. First tutorial level]` |

---

*(Note: When adding a new asset to the project, update this registry so that all agents know it exists.)*
