# Waypoint IDE — Product Requirements Document

## Product Overview
Waypoint IDE/Studio is a lightweight, student-focused desktop IDE for learning C, C++, Java, and Python. It intentionally avoids the complexity of professional IDEs such as VS Code.

Core philosophy:

> Write → Run → Understand → Review → Improve

The student remains in control. AI assistance is explicit and on-demand.

## Goals
- Provide a simple desktop learning IDE.
- Support C, C++, Java, and Python.
- Open files and folders.
- Provide a focused code editor.
- Provide an optional terminal and output console.
- Compile/run programs locally.
- Explain compiler/runtime errors with a local LLM.
- Provide explicit AI code review.
- Show meaningful before/after code comparisons.
- Work offline after local setup.
- Support OTA/update notifications with an official download redirect.
- Provide a first-launch local AI Setup Wizard.

## Non-Goals
Waypoint is not:
- A replacement for VS Code or a professional production IDE.
- An AI coding agent.
- An always-on autocomplete assistant.
- A cloud-based code-review platform.
- A collaboration platform.
- A full Git client.
- A general-purpose AI chatbot.

## Target Users
- School students learning programming.
- College students learning C/C++, Java, and Python.
- Beginners practicing programming problems.

## Supported Languages
| Language | Execution |
|---|---|
| C | GCC/Clang |
| C++ | G++/Clang++ |
| Java | JDK |
| Python | Python runtime |

## Core Features

### Project Explorer
Open folder, list files/folders, create, rename, delete, and open files.

### Code Editor
Use Monaco Editor with syntax highlighting, line numbers, tabs, code folding, search, save, and error markers.

### Run
Run detects the language, invokes the appropriate compiler/runtime through Rust, captures stdout/stderr, exit code, and execution information, then displays the result in Output.

### Error Review
Error review occurs after Run produces an error. Compiler/runtime output is the source of truth. The local AI explains what happened and how the student can fix it.

### Code Review
Code Review occurs only when the student clicks Review. The AI can assess readability, maintainability, complexity, duplication, performance, conventions, potential bugs, and structure.

### Code Comparison
Show the student's original code and a suggested version with an explanation and benefits/trade-offs. If there is no meaningful improvement, say so.

### Local AI
Use Ollama as the local AI runtime. Prefer a quantized coding model below 7B parameters where quality is sufficient. The final model must be selected through benchmarking.

### Setup Wizard
First launch:
1. System Check
2. Ollama Setup
3. Model Download
4. Ready

The wizard detects Ollama, guides installation, downloads the selected model with live progress, verifies readiness, and launches the IDE.

### Offline-First
After setup, editing, saving, compilation, execution, terminal use, error explanation, and code review should work without internet when the local dependencies are available.

Internet is needed for initial AI setup/model download, update checks, and application downloads.

### Updates
A lightweight update manager checks for a newer Waypoint version when internet is available. An update badge appears at the top-right. The initial implementation redirects the user to the official Waypoint download website.

## Product Principles
1. Student writes first.
2. AI is explicit, not intrusive.
3. Compiler/runtime is the source of truth.
4. AI explains rather than blindly fixes.
5. Shorter code is not automatically better.
6. Good code should be recognized as good.
7. Local AI is preferred.
8. Core IDE functionality should not depend on internet.
9. Simplicity is a feature.
10. Waypoint should teach rather than replace student reasoning.

## Success Criteria
A student can open a folder, edit supported code, run it, understand an error through local AI, complete a solution, explicitly request a review, compare suggestions, and continue core development offline.
