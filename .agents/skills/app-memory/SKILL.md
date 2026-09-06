---
name: app-memory
description: >-
  Manages persistent project memory and cross-session handoffs.
  Use this skill whenever the user saves state before ending a session (/save, /checkpoint),
  or starts a new session and requests a debrief (/resume, /start-session).
---

# App Long-Term Memory & Session Handoff Skill

This skill solves LLM context window degradation and token consumption. It allows the developer to reset or switch chat sessions cleanly without losing project momentum or architectural continuity.

---

## 1. SAVE Operation (`/save` or `/checkpoint`)

Execute these steps when the developer concludes a session:

### Step 1: Session Analysis
Analyze changes made during the session:
- What features were built, refactored, or fixed?
- What files were modified?
- Is the codebase in a working, stable state?

### Step 2: Update `.agents/blueprint/SESSION_STATE.md`
Write a concise, structured handoff snapshot:
1. Timestamp.
2. Key achievements completed in this session.
3. Code stability (test status, what was verified).
4. **Immediate Next Task** for the incoming agent and files to be touched.
5. **Key Files to Read (2–4 max)** for the fresh session.

### Step 3: Append Entry to `.agents/blueprint/DEV_LOG.md`
Append a chronological diary entry summarizing architectural decisions and milestones.

### Step 4: Update `.agents/blueprint/PROJECT_STATUS.md`
Update feature matrix statuses and estimated completion percentage.

### Step 5: Developer Sign-off
Deliver a clean sign-off message:
> ✅ **Session safely saved!**
> - **Next in queue**: [Brief description of the next task]
> - You can now safely close this chat to conserve tokens. When you open a fresh session, simply type `/resume` to pick up right here!

---

## 2. RESUME Operation (`/resume` or `/start-session`)

Execute these steps when opening a fresh conversation:

### Step 1: Targeted Memory Loading
1. Read immediately:
   - `.agents/blueprint/SESSION_STATE.md`
   - `.agents/blueprint/PROJECT_STATUS.md`
2. Read **only the 2–4 key files** listed in `SESSION_STATE.md` under *Key Files to Read*.
   *(Do not read the entire codebase upfront; keep the fresh context clean and fast!)*

### Step 2: Kick-off Debrief
Deliver a crisp 3–4 sentence status briefing:

```markdown
👋 **Welcome back! Project memory and status loaded.**

- **Previous Achievements**: [What was completed last session]
- **Current Health**: [App state, stability, test results]
- **Recommended Kick-off**: 👉 [Specific task, e.g., Build the dashboard page with API integration]

Ready to proceed with this task, or would you like to focus on something else today?
```

---

## Error Handling & Fallbacks

If session state files are missing or corrupt:
1. **Missing `SESSION_STATE.md`**: Fallback to reading `.agents/blueprint/PROJECT_STATUS.md` and `git log -n 5` to reconstruct the current session baseline.
2. **Missing `DEV_LOG.md`**: Recreate the file with the current date, active task, and note the recreation.
3. **Escalate**: If branch or working directory state has unstaged changes from another session, prompt the developer before overriding.

