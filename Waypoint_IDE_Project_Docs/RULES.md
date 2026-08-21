# Waypoint IDE — Development Rules

## Product
1. Waypoint is a learning IDE.
2. Do not turn it into a VS Code clone.
3. Keep the interface focused and minimal.
4. Every feature should support learning, coding, execution, understanding, or review.

## AI
1. Never automatically interrupt coding.
2. No always-on AI autocomplete.
3. No automatic review while typing.
4. Review only after clicking Review.
5. Error explanation follows an execution error.
6. Compiler/runtime is the source of truth.
7. AI explains rather than pretending to be the compiler.
8. Do not manufacture problems to provide suggestions.
9. Shorter is not automatically better.
10. If no meaningful improvement exists, say so.
11. Prefer educational explanations over full code replacement.
12. Use local Ollama inference.

## Offline
1. Core IDE functions must work offline after setup.
2. Editing and saving work offline.
3. Compilation/execution work offline when runtimes are installed.
4. Local AI works offline when Ollama/model are available.
5. Internet is for setup, model downloads, update checks, and downloads.
6. Losing internet must not crash or disable the IDE.

## Architecture
1. React handles UI.
2. Rust handles native/OS operations.
3. React must not directly execute arbitrary system commands.
4. Use explicit Tauri IPC.
5. Return structured IPC data.
6. Keep files, execution, AI, setup, and updates separated.
7. Do not tightly couple AI to the editor.
8. Deterministic systems remain independent from the LLM.

## Styling
1. **Use Vanilla CSS for all styling.**
2. No Tailwind CSS.
3. No Bootstrap.
4. No Material UI.
5. No styled-components.
6. Use CSS custom properties.
7. Reuse Sand / Editorial tokens.
8. Avoid unnecessary inline styles.
9. Avoid excessive visual effects.
10. Keep the UI warm, minimal, and editorial.

## Design
1. Avoid excessive rounded cards.
2. Avoid neon colors.
3. Avoid futuristic AI visuals.
4. Avoid giant AI icons.
5. Avoid chatbot-style AI panels.
6. Keep editor focus.
7. Use whitespace intentionally.
8. Use subtle borders.
9. Use restrained shadows.
10. Do not communicate status by color alone.

## Execution
1. Detect language before execution.
2. Use the correct compiler/runtime.
3. Capture stdout and stderr separately.
4. Capture exit code.
5. Capture execution time where practical.
6. Implement timeout/termination.
7. Limit excessive output.
8. Clean temporary files where applicable.
9. Do not claim sandboxing unless it exists.

## Errors
1. Parse compiler/runtime errors before AI.
2. Preserve original compiler messages.
3. Highlight relevant lines.
4. AI explanations must reference actual errors.
5. Never replace original errors with AI text.
6. Give actionable guidance.
7. Never automatically modify source code.

## Code Review
1. Review only when explicitly requested.
2. Use source as primary input.
3. Use AST/static analysis where useful.
4. Separate meaningful improvements from optional style.
5. Show original code.
6. Show suggested code only when justified.
7. Explain why suggestions help.
8. Mention trade-offs where appropriate.
9. Preserve unchanged code in diffs.
10. Allow a no-significant-improvement result.

## Models
1. Prefer quantized coding models.
2. Prefer below 7B where quality is sufficient.
3. Do not choose only by parameter count.
4. Benchmark candidates locally.
5. Evaluate latency, RAM, and review quality.
6. Keep the model configurable.
7. Do not hard-code architecture around one model.

## Updates
1. Update checks never block startup.
2. Offline update checks fail gracefully.
3. Show a badge when a newer version exists.
4. Show current/latest versions.
5. Redirect to the official Waypoint download website.
6. Initial implementation does not require silent in-app installation.

## Code Quality
1. Prefer strong TypeScript types.
2. Keep React components focused.
3. Keep Rust modules focused.
4. Avoid giant components.
5. Avoid duplicated logic.
6. Keep IPC interfaces explicit.
7. Handle native errors.
8. Test incrementally.
9. Keep the main branch buildable.

## Scope Control
Do not add initially:
- Chat during coding.
- Cloud AI.
- Collaboration.
- Folder synchronization.
- Full Git client.
- Plugin marketplace.
- AI agents.
- Automatic code rewriting.
- Complex debugging suite.
- Project management features.
