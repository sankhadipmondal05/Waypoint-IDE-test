# Waypoint IDE — Architecture

## 1. Architecture Philosophy
Waypoint is an offline-first desktop application separating:
- React/TypeScript presentation.
- Tauri/Rust native operations.
- Local compiler/runtime execution.
- Ollama/local LLM inference.
- Optional internet-based setup and updates.

Deterministic systems remain separate from AI interpretation.

## 2. High-Level Architecture

```text
React + TypeScript
        │
        │ Tauri IPC
        ▼
Tauri / Rust Core
        │
 ┌──────┼───────────────┐
 │      │               │
Files  Execution       AI
 │      │               │
 │   Compilers       Ollama
 │   Runtimes           │
 │                      ▼
 │                 Local LLM
 │
 └────────────── Update Manager
                       │
                    Internet
```

## 3. Frontend
React + TypeScript manages:
- Application layout.
- Project Explorer.
- Monaco Editor.
- Output Console.
- Terminal UI.
- Review Console.
- Diff viewer.
- Setup Wizard.
- Settings.
- Update UI.
- Application state.

### Styling
**Use Vanilla CSS for all application styling.**

Do not introduce Tailwind CSS, Bootstrap, Material UI, styled-components, or another CSS framework unless the project decision is explicitly changed.

Use CSS custom properties and organized CSS files.

## 4. Tauri/Rust Core
Rust handles:
- File system access.
- Process management.
- Compiler/runtime invocation.
- Terminal processes.
- Ollama detection.
- Model management.
- AI orchestration.
- Setup operations.
- Update checking.
- Local configuration.
- Process timeouts/output limits.

React must not directly execute arbitrary OS commands.

## 5. Tauri IPC
Use explicit commands/events.

```text
React
  │
  │ run_program(...)
  ▼
Tauri IPC
  │
  ▼
Rust ExecutionManager
```

Return structured data across IPC.

## 6. File System
```text
Explorer → React service → Tauri IPC → Rust FileManager → OS
```

Operations: read, write, create, rename, delete, directory listing.

## 7. Execution
```text
Run
 ↓
ExecutionManager
 ↓
LanguageDetector
 ├── C
 ├── C++
 ├── Java
 └── Python
 ↓
Compiler/Runtime
 ↓
stdout / stderr / exit code / execution time
 ↓
React Output Console
```

C: `.c → gcc/clang → executable → run`

C++: `.cpp → g++/clang++ → executable → run`

Java: `.java → javac → .class → java`

Python: `.py → python → run`

## 8. Error Pipeline
```text
Compiler/runtime
 ↓
Error Parser
 ↓
Structured Error
 ↓
Output Console
 ↓
AI Manager
 ↓
Ollama
 ↓
Explanation
```

Example:
```json
{
  "language": "cpp",
  "file": "main.cpp",
  "line": 8,
  "column": 10,
  "type": "syntax_error",
  "message": "expected ';' before 'return'"
}
```

## 9. AI Architecture
```text
AI Manager
 ├── Check Ollama
 ├── Check model
 ├── Error explanation
 └── Code review
        ↓
      Ollama
        ↓
     Local LLM
```

## 10. Error Explanation
Run → compiler/runtime error → parser → structured error + relevant code → AI Manager → Ollama → explanation → Output Console.

## 11. Code Review
```text
Review
 ↓
Source Code
 ↓
AST / Static Analysis
 ↓
Review Context
 ↓
AI Manager
 ↓
Ollama
 ↓
Structured Review
 ↓
Review Console
 ↓
Diff Viewer
```

Tree-sitter or equivalent AST tooling may be used.

## 12. Structured AI Output
Prefer structured responses for UI-critical information.

```json
{
  "overall": "good",
  "findings": [
    {
      "category": "readability",
      "severity": "low",
      "title": "Repeated logic can be simplified",
      "original": "...",
      "suggested": "...",
      "explanation": "...",
      "benefit": "..."
    }
  ]
}
```

## 13. Setup Wizard
```text
React Setup Wizard
        ↓
Tauri IPC
        ↓
Rust SetupManager
        ↓
Detect Ollama → Install guidance → Model download → Verify → Launch
```

Ollama availability can be checked through its local API. If missing, the app can open the official Ollama download page. Model download progress is streamed back to React.

## 14. Update Architecture
```text
Application
 ↓
UpdateManager
 ↓
Internet available?
 ↓
Version manifest
 ↓
Compare versions
 ↓
Update available?
 ↓
Top-right badge
 ↓
Update dialog
 ↓
Official Waypoint download website
```

Update checks must never block normal offline use.

## 15. Persistence
Persist locally:
- Theme.
- Editor settings.
- Runtime paths.
- AI model selection.
- AI setup status.
- Last workspace where appropriate.
- Last successful update check.

Start with simple local configuration. Use SQLite only when structured persistent data genuinely requires it.

## 16. Process Safety
Account for:
- Timeouts.
- Process termination.
- stdout/stderr limits.
- Cleanup.
- Working-directory boundaries.

Do not claim full sandbox security unless actual isolation is implemented.

## 17. Suggested Structure
```text
waypoint/
├── src/
│   ├── components/
│   ├── features/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
├── src-tauri/
│   └── src/
│       ├── commands/
│       ├── execution/
│       ├── files/
│       ├── ai/
│       ├── setup/
│       ├── updates/
│       └── main.rs
└── README.md
```
