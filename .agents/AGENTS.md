# AI Game Engineering Agent Workspace

This `.agents` directory serves as the "brain" for the game development project. All AI code generation, entity creation, and structural changes must follow the workflows and rules defined here.

## Structure
- `context/`: Contains the ground truth for our game architecture, design context, and code standards. Agents must consult these before modifying code.
- `workflows/`: Defines the strict loops (Architect -> Review -> Imprint) for specific tasks like adding new entities or mechanics.
- `skills/`: Contains custom scripts and cognitive tools for validation and code enforcement.
- `feature-specs/`: Stores the numbered, approved implementation plans (`01-feature.md`) for permanent documentation of what the AI has built.

---

<!-- BEGIN:gamedev-agent-rules -->
## React & DOM Game Rules
1. **Performance**: Minimize unnecessary re-renders. Use `React.memo`, `useMemo`, and `useCallback` appropriately. Keep complex game logic out of the render loop.
2. **Rendering**: The game is rendered using React components and DOM/TailwindCSS styling. Canvas is NOT required for this project.
3. **State Management**: Use React Context for global state and custom hooks with LocalStorage for session persistence.
4. **Architecture**: Keep game engine logic (e.g., `PokerGame.ts`, `BotLogic.ts`) in pure TypeScript, decoupled from React UI components. The UI should merely reflect the state provided by the engine.
5. **Documentation Sync**: Whenever you create a new core file, move a file, or change the architecture/database structure, you MUST immediately update `README.md` (specifically the 'Project Structure', 'Tech Stack', and 'Architecture' sections) to reflect reality. Never leave the README out of sync with the actual codebase.
<!-- END:gamedev-agent-rules -->
