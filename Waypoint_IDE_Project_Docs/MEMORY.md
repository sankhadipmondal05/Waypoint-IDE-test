# Waypoint IDE — Project Memory

## Project Identity
**Name:** Waypoint IDE/Studio

**Type:** Desktop learning IDE

**Purpose:** Help students learn programming with a focused coding environment and local, on-demand AI assistance.

## Philosophy
> Write → Run → Understand → Review → Improve

The student remains responsible for solving problems. AI is an assistant, not an autonomous coding agent.

## Target Users
- School students.
- College students.
- Beginners learning programming.
- Students practicing C, C++, Java, and Python.

## Supported Languages
- C
- C++
- Java
- Python

## Core Interface
1. Project Explorer.
2. Code Editor.
3. AI Review Console.
4. Output Console.
5. Optional Terminal.

Top-level actions:
- Run.
- Review.
- Settings.
- Update notification.

## AI Behavior

### Error Review
Triggered by **Run** when execution/compilation fails.

```text
Compiler/runtime
      ↓
Error Parser
      ↓
AI
      ↓
Explanation
```

The AI explains what happened, what the error means, how to fix it, and the relevant location.

### Code Review
Triggered by **Review**.

The AI can suggest:
- Simpler logic.
- Better readability.
- Reduced duplication.
- Better maintainability.
- Efficiency improvements.
- Better structure.
- Language-specific improvements.

It must explain why a suggestion helps.

## Important AI Constraint
Do not automatically recommend changes.

No always-on AI autocomplete.

No automatic review while typing.

## Local AI
Runtime: **Ollama**

Model:
- Quantized coding model.
- Preferably under 7B parameters.
- Final model selected after benchmarking.

AI runs locally.

## Offline Philosophy
Waypoint is **offline-first, not offline-only**.

After setup, coding and local AI work without internet.

Internet is used for:
- Initial Ollama setup.
- Model download.
- Application update checks.
- Application downloads.

## Setup Wizard
First launch:
```text
1. System Check
2. Ollama
3. Model Download
4. Ready
```

Detect Ollama, guide installation, download the model with live progress, verify readiness, and launch.

## Update System
Waypoint has an update badge at the top-right.

When a newer version exists:
```text
↑ 1
```

Clicking opens an update dialog. Initial implementation redirects to the official Waypoint download website.

Update checking must never interfere with offline use.

## Technology Stack

### Frontend
- React.
- TypeScript.
- **Vanilla CSS.**

### Desktop
- Tauri.

### Native backend
- Rust.

### Editor
- Monaco Editor.

### AI runtime
- Ollama.

### Code analysis
- Tree-sitter or suitable AST tooling.
- Static analysis where useful.

### Language execution
- GCC/Clang.
- G++/Clang++.
- JDK.
- Python.

### Persistence
- Local configuration.
- SQLite only where genuinely useful.

## Design System
**Sand / Editorial**

```css
--bg-color: #EFECE6;
--bg-alt: #E8E6DF;
--surface-color: #F7F6F2;
--border-color: #DDD9CE;
--text-primary: #22211D;
--text-secondary: #7C7A73;
--accent-color: #1C1B18;
--accent-text: #FFFFFF;
--secondary-accent: #E2DDD2;
```

Use these consistently.

## Styling Constraint
**Vanilla CSS is mandatory for the current architecture.**

Use CSS custom properties and organized CSS files. Do not introduce a styling framework without explicitly changing this decision.

## Product Personality
Waypoint should feel:
- Calm.
- Focused.
- Educational.
- Warm.
- Minimal.
- Approachable.
- Professional enough for a college project.

It should not feel:
- Enterprise-heavy.
- Futuristic.
- AI-chat-centric.
- Overloaded.
- Like a VS Code clone.

## Development Priority
```text
1. Foundation
2. UI shell
3. File system
4. Monaco editor
5. C++ execution
6. Other language execution
7. Error parsing
8. Ollama setup
9. AI error explanation
10. AI code review
11. Diff viewer
12. Update system
13. Testing and polish
```

## Core Architecture Principle
Keep deterministic functionality independent from AI.

```text
Compiler/runtime → actual execution truth
AST/static analysis → structural information
LLM → explanation and review guidance
React → presentation
Rust → native operations
```

## Scope Reminder
Waypoint is intentionally a learning IDE.

When considering a new feature, ask:

> Does this help a student write, run, understand, review, or improve code?

If not, it probably does not belong in the initial version.



## Implemented Milestones & Progress So Far

### Phase 1 & 2 — Foundation & UI Shell
- Sand / Editorial design system with dark mode toggle switch.
- Resizable, collapsible multi-pane layout: TopBar, Project Explorer, Monaco Editor, Output/Terminal, AI Review Console, and StatusBar.
- Monaco Editor integration with custom syntax themes, line highlight, tabs, unsaved indicators, and error markers.

### Phase 3 — File Management & Explorer
- File & folder creation, inline renaming, drag-and-drop file organization (in/out of folders, to root).
- Delete confirmation modal (`"Are you sure you want to delete <filename>?"`) with safe tab cleanup.
- File-specific Problem Statement context input in TopBar with mandatory enforcement before AI review.
- Universal `Ctrl+S` / `Cmd+S` saving to localStorage tree.

### Phase 4 — Execution & Interactive Terminal
- Dynamic code execution engine (`ExecutionService`) targeting currently opened file (Python, JS/TS, C++, C, Java).
- Output console showing real stdout/stderr, execution time (ms), and status banners.
- Interactive Terminal emulator with command line prompt, history (`↑`/`↓`), and commands (`run`, `python`, `ls`, `cat`, `echo`, `clear`, `help`).

### Phase 5 — Local AI & Toolchain Setup Wizard
- Ollama AI Daemon detection with link guidance to `ollama.com`.
- Compiler & Toolchain diagnostic scanning for Python 3, C (GCC), C++ (G++), and Java (JDK/javac) with direct setup guides.
- Model selection dropdown with curated coding models (`Qwen 2.5 Coder 3B`, `1.5B`, `DeepSeek Coder 1.3B`, `Llama 3.2 3B`, `Code Llama 7B`) and hardware tier guidance.
- Live model download progress bar with simulated layer byte streaming.
- Inference latency verification and readiness state.
- Reconfiguration accessible anytime via TopBar Settings `⚙` or StatusBar model click.

### Phase 6 — AI Error Explanation Pipeline
- Compiler/runtime remains authoritative; structured line, column, and diagnostic extraction.
- Clear educational guidance cards explaining what occurred and how to fix errors without rewriting the solution.
- Line navigation badge to jump straight to the offending statement in Monaco.

### Phase 7 — Progressive Constraint-Driven AI Code Review
- **Strict Anti-Autocompletion / No Full-Code Generation**: The AI never generates or overwrites the entire program.
- **Targeted Snippet & Diff View**: Visual red/green diff box showing only the isolated bottleneck with an explicit **Copy Snippet** button.
- **Iterative Single-Finding Cycle**: Reviews highlight **one major optimization at a time** (evaluating Big-O time/space, memory management, and idioms across C, C++, Java, and Python).
- **Progressive Mastery Completion State**: Once all iterations are resolved, the console celebrates with: *"Review Complete. This is the best possible version to solve this problem. Well done!"*.


