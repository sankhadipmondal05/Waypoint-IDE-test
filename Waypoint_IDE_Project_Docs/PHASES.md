# Waypoint IDE — Development Phases

## Strategy
Build incrementally. Do not start with AI.

```text
Phase 0 → Foundation
Phase 1 → IDE Shell
Phase 2 → Editor + Files
Phase 3 → Execution
Phase 4 → Error Handling
Phase 5 → Local AI + Setup
Phase 6 → AI Error Explanation
Phase 7 → AI Code Review
Phase 8 → Updates + Polish
```

## Phase 0 — Foundation
- Create repository.
- Initialize Tauri + React + TypeScript.
- Configure development environment.
- Establish Git workflow.
- Establish Vanilla CSS design system.
- Create initial project structure.

**Deliverable:** Waypoint opens as a desktop app.

## Phase 1 — IDE Shell
Build:
- Top bar.
- Project Explorer.
- Editor area.
- Review Console.
- Output Console.
- Terminal panel.
- Resizing/collapsing.
- Sand / Editorial theme.

**Deliverable:** High-fidelity static Waypoint interface.

## Phase 2 — File System + Monaco
Build:
- Open folder.
- List files.
- Open files.
- Create file/folder.
- Rename/delete.
- Save.
- Multiple tabs.
- Unsaved indicator.
- Monaco integration.

**Deliverable:** Real folders/files can be edited and saved.

## Phase 3 — Execution Engine
Recommended order:
1. C++
2. C
3. Python
4. Java

Build:
- Language detection.
- Compiler/runtime discovery.
- Compilation.
- Execution.
- stdout/stderr.
- Exit codes.
- Execution timing.
- Timeouts/termination.

**Deliverable:** Run executes real student programs.

## Phase 4 — Output + Error Handling
Build:
- Output console.
- Terminal.
- Error parser.
- File/line/column extraction.
- Editor error markers.
- Go-to-line.
- Success/failure states.

**Deliverable:** Errors are useful and navigable without AI.

## Phase 5 — Local AI + Setup Wizard
Build:
- Ollama detection.
- Installation guidance.
- Model selection.
- Model download.
- Live progress.
- Model verification.
- AI availability state.
- Reconfiguration.

**Deliverable:** A fresh installation can configure local AI.

## Phase 6 — AI Error Explanation
Pipeline:
`Run → Error → Parser → Structured Error → Ollama → Explanation → Output`

Rules:
- Compiler/runtime remains authoritative.
- AI explains the error.
- Guidance should be educational.
- Do not blindly rewrite the whole program.

**Deliverable:** Local AI explains real errors.

## Phase 7 — AI Code Review
Pipeline:
`Review → Source → AST/Static Analysis → Context → Local LLM → Findings → Review Console`

Build:
- Overall assessment.
- Findings.
- Severity.
- Categories.
- Original/suggested code.
- Explanation.
- Benefits/trade-offs.
- Diff viewer.
- Already-good state.

**Deliverable:** Explicit student-triggered code review.

## Phase 8 — Updates + Polish
Build:
- Version manifest.
- Update checker.
- Top-right badge.
- Update dialog.
- Official download redirect.
- About page.
- Settings.
- Offline handling.
- Performance.
- Accessibility.
- Installer/build pipeline.

**Deliverable:** Polished offline-first desktop application.

## Milestones
1. Complete UI.
2. Real file editing.
3. C++ execution.
4. All four language execution.
5. Ollama works.
6. AI explains errors.
7. AI reviews code.
8. Updates and final polish.

## Development Rule
Every phase should end with a working build. Avoid accumulating multiple untested infrastructure changes.
