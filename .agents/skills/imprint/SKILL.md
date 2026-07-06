---
name: imprint
description: After building any game entity, extract the core patterns that matter for consistency and save them to game-registry.md. So every entity built after this one aligns with the game's design parameters.
---

Game consistency does not happen by accident. It happens because every entity is built with awareness of what already exists.

The problem with AI-built games is that each entity gets built in isolation. The agent does not remember the speed of the first enemy it built when making the third. So speeds drift. Hitboxes vary slightly. Movement patterns are inconsistent.

This skill fixes that. Run it after building any game entity. It reads what was just built, extracts the patterns that matter for gameplay balance and visual consistency, and saves them so every future entity can match.

---

## How to Invoke

After building any game entity, run:

```
/imprint
```

To target a specific file:

```
/imprint [filepath]
```

To audit an existing codebase for inconsistencies:

```
/imprint audit
```

If no filepath is given, the skill identifies recently created or modified entity files automatically and captures from those.

---

## Step 1 — Find What Was Just Built

If a filepath was provided — read that file directly.

If no filepath was provided — identify which entity files were most recently created or modified in this session.

If it is unclear which files to capture from, ask the developer:

```
Which entity should I capture patterns from?
```

---

## Step 2 — Extract What Matters for Consistency

Read the entity code. Extract only the properties and values that affect game balance and visual consistency.

**Extract these:**

- Hitbox Dimensions (width, height, radius)
- Sprite Source Size (width, height in the spritesheet)
- Movement Speed (horizontal, vertical, acceleration, friction)
- Health/Damage values
- Animation Speeds (frames per second for animations)
- State Enums (e.g., IDLE, RUN, JUMP)

**Do not extract these:**

- Current position (x, y) — completely dynamic
- Current health — track the max or base health instead
- Velocity at a given frame

---

## Step 3 — Write to game-registry.md

Open `game-registry.md`. If it does not exist, create it.

Add a new entry for the entity that was captured. Do not overwrite existing entries — append to the registry.

If an entry for this entity type already exists — update it rather than duplicating.

### Entry format

```markdown
### [Entity Name]

File: [filepath]
Last updated: [date]

| Property         | Value           |
| ---------------- | --------------- |
| Hitbox (W x H)   | [value]         |
| Sprite (W x H)   | [value]         |
| Base Speed       | [value]         |
| Max Health       | [value]         |
| Damage Dealt     | [value]         |
| Animation FPS    | [value]         |

**Pattern notes:**
[Any important pattern decisions worth noting —
why a specific speed was chosen, what this entity
should always match, what variations are allowed]
```

---

## Step 4 — Confirm What Was Captured

After writing to game-registry.md, confirm to the developer:

```
Imprinted [Entity Name] → game-registry.md

Captured:
- Hitbox: [value]
- Speed: [value]
- Health: [value]

Any future entity of this type should refer to these parameters.
```

---

## How game-registry.md Gets Used

The registry is not just a record. It is the consistency enforcer for every future session.

At the start of any session that involves entity work, Claude reads `game-registry.md` before writing any entity code. When building a new enemy, it checks how existing enemies were balanced.

Consistency is a habit, not a feature.

---

## The Rule

Build a game entity. Run `/imprint`. Move on.

Every time. Without exception.
