# Waypoint IDE — Setup & Compilation Guide

**Waypoint IDE** (also known as *Waypoint Studio / Lab Edition*) is a lightweight, student-focused, offline-first desktop Integrated Development Environment engineered for learning **C, C++, Java, and Python**. It features a modern Sand / Editorial user interface built with React 19, TypeScript, and Microsoft Monaco Editor, powered by a high-performance native core built on Tauri v2 and Rust, with local on-device AI mentoring powered by Ollama.

---

## Table of Contents
1. [Core Philosophy & Features](#core-philosophy--features)
2. [Architecture Overview](#architecture-overview)
3. [System Requirements & Prerequisites](#system-requirements--prerequisites)
4. [Repository Setup & Dependency Installation](#repository-setup--dependency-installation)
5. [Running in Development Mode](#running-in-development-mode)
6. [Compiling the Standalone Executable (`waypoint-ide.exe`)](#compiling-the-standalone-executable-waypoint-ideexe)
7. [Compiling the Full Windows Setup Installer (`Waypoint-IDE-Setup-0.1.0.exe`)](#compiling-the-full-windows-setup-installer-waypoint-ide-setup-010exe)
8. [Configuring Local AI (Ollama)](#configuring-local-ai-ollama)
9. [Setting Up System Language Toolchains](#setting-up-system-language-toolchains)
10. [Project Structure](#project-structure)
11. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Core Philosophy & Features

> **Write → Run → Understand → Review → Improve**

Waypoint IDE is engineered specifically to eliminate cognitive friction and prevent the passive-learning trap common with cloud-based AI code generators:
- **Zero Configuration Out of the Box:** Built-in 5-step Setup Wizard detects local compilers and AI runtimes.
- **Native Host Execution:** Compiles C, C++, Java, and Python directly via system toolchains (GCC, G++, JDK, Python 3) with real stdout/stderr capture, process timing, and interactive stdin support.
- **Pedagogical Diagnostic Sanitizer:** Strips cryptic compiler/linker internals (e.g., MinGW `ld.exe`, `WinMain` linker errors) and automatically highlights the offending code line in Monaco Editor.
- **On-Demand AI Code Review:** Local SLM (Small Language Model) inference via Ollama. AI assistance only runs when explicitly requested, requires a student Problem Statement context, and provides targeted, single-issue diffs rather than rewriting entire files.
- **100% Offline-First:** Core editing, execution, error sanitization, and deterministic heuristic reviews work without internet access.

---

## Architecture Overview

```text
React 19 + TypeScript (Monaco Editor, Editorial Theme)
                  │
                  │ Tauri IPC Commands
                  ▼
         Tauri v2 / Rust Core (Process Manager, Stderr Sanitizer)
                  │
       ┌──────────┼───────────────┐
       ▼          ▼               ▼
   Virtual/OS   Native System    Ollama Localhost Daemon
   File I/O     Compilers        (Port 11434 / Quantized SLMs)
                (GCC, G++, JDK)           │
                                          ▼
                                   On-Device AI Review
```

---

## System Requirements & Prerequisites

### 1. Operating System
- **Windows 10 / 11 (64-bit)** *(Primary target)*
- *Note:* Also builds on Linux and macOS with their respective platform dependencies.

### 2. Node.js & Package Manager
- **Node.js:** `v18.0.0` or higher (v20+ recommended)
- **npm:** `v9.0.0` or higher
- Verify installation:
  ```powershell
  node --version
  npm --version
  ```

### 3. Rust Toolchain
- **Rust:** `1.77.2` or newer (Edition 2021)
- Install via [rustup.rs](https://rustup.rs/):
  ```powershell
  winget install Rustlang.Rustup
  # or download and run rustup-init.exe
  ```
- Set default host target to MSVC:
  ```powershell
  rustup default stable-x86_64-pc-windows-msvc
  ```
- Verify installation:
  ```powershell
  rustc --version
  cargo --version
  ```

### 4. C++ Build Tools (Required by Tauri on Windows)
- Microsoft C++ Build Tools or Visual Studio Community with the **"Desktop development with C++"** workload installed.
- **Microsoft Edge WebView2:** Pre-installed on Windows 10/11 (or install via [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)).

### 5. Inno Setup (Required only for building the Installer `.exe`)
- **Inno Setup 6.7+:** Download from [jrsoftware.org](https://jrsoftware.org/isinfo.php) or install via winget:
  ```powershell
  winget install JRSoftware.InnoSetup
  ```

---

## Repository Setup & Dependency Installation

1. **Clone the Repository:**
   ```powershell
   git clone https://github.com/sankhadipmondal05/Waypoint-IDE-test.git
   cd "Waypoint-IDE-test"
   ```

2. **Install Frontend Dependencies:**
   ```powershell
   npm install
   ```

3. **Verify Tauri CLI:**
   ```powershell
   npx tauri --version
   ```

---

## Running in Development Mode

To launch the desktop application in development mode with Hot Module Replacement (HMR):

```powershell
npm run tauri dev
```
*(Or alternatively: `npx tauri dev`)*

This command automatically:
1. Spawns the Vite development server on `http://localhost:5173`.
2. Compiles and launches the native Rust Tauri desktop window.

### Running Only the Web Frontend (Browser Mode)
If you only want to inspect or test UI components in your browser without the native backend:
```powershell
npm run dev
```
*Note: Native compilation and terminal execution commands require running through the desktop Tauri shell (`npm run tauri dev`).*

---

## Compiling the Standalone Executable (`waypoint-ide.exe`)

To compile the optimized, production-ready standalone Windows executable:

### Method A: Single Command via Tauri CLI (Recommended)

Run the release build command from the root directory:
```powershell
npx tauri build
```

This single command automatically:
1. Runs `npm run build` (`tsc -b && vite build`) to bundle the React frontend into `dist/`.
2. Compiles all Rust native crates with release optimizations (`--release`).
3. Produces the standalone binary:
   ```text
   src-tauri\target\release\waypoint-ide.exe
   ```

### Method B: Manual Two-Step Build

1. **Build the Web Frontend:**
   ```powershell
   npm run build
   ```
2. **Build the Rust Release Binary:**
   ```powershell
   cd src-tauri
   cargo build --release
   cd ..
   ```
3. **Locate Binary:**
   The output executable will be located at:
   ```text
   d:\Projects\Waypoint IDE\src-tauri\target\release\waypoint-ide.exe
   ```
   *(File size is typically ~10.2 MB)*

You can launch and distribute `waypoint-ide.exe` directly on any 64-bit Windows PC.

---

## Compiling the Full Windows Setup Installer (`Waypoint-IDE-Setup-0.1.0.exe`)

Waypoint IDE includes an enterprise-grade Inno Setup production script (`src-tauri/setup.iss`) that builds a standalone installer. The installer:
- Packages `waypoint-ide.exe`, support DLLs, assets, and icons.
- Creates Start Menu and Desktop shortcuts.
- Provides a component checklist to install MinGW GCC, OpenJDK 17, Python 3.11, and Ollama.
- Registers system environment PATH variables automatically.

### Step-by-Step Installer Compilation:

1. **Ensure the Release Executable is Compiled:**
   ```powershell
   npx tauri build
   ```
   *(Verify that `src-tauri\target\release\waypoint-ide.exe` exists)*

2. **Compile with Inno Setup Compiler (`ISCC`):**
   - **Via Command Line:**
     ```powershell
     & "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" src-tauri\setup.iss
     ```
   - **Or via Inno Setup GUI:**
     1. Open **Inno Setup Compiler**.
     2. Open `src-tauri/setup.iss`.
     3. Select **Build → Compile** (or press `Ctrl+F9`).

3. **Installer Output:**
   The installer package will be generated at:
   ```text
   dist-installer\Waypoint-IDE-Setup-0.1.0.exe
   ```
   *(File size is typically ~6.3 MB)*

---

## Configuring Local AI (Ollama)

Waypoint IDE connects to an on-device [Ollama](https://ollama.com/) daemon over localhost HTTP and raw TCP (`http://localhost:11434`).

1. **Install Ollama:**
   - Download and run the installer from [ollama.com/download](https://ollama.com/download), or install via winget:
     ```powershell
     winget install Ollama.Ollama
     ```

2. **Pull a Recommended Model:**
   Open a terminal and download your preferred model:
   - **Qwen 2.5 Coder 1.5B (Default / Fast):**
     ```powershell
     ollama pull qwen2.5-coder:1.5b
     ```
     *Ultra-fast, ~0.98 GB. Runs smoothly on standard laptops with 4GB - 8GB RAM.*
   - **Llama 3.2 3B (Balanced):**
     ```powershell
     ollama pull llama3.2:3b
     ```
   - **DeepSeek R1 1.5B (Reasoning / Math):**
     ```powershell
     ollama pull deepseek-r1:1.5b
     ```

3. **Automatic IDE Detection:**
   When Waypoint IDE launches, the status bar will display `Local Engine Connected` with a green indicator, and the active model will show as `Active`.

---

## Setting Up System Language Toolchains

To run student programs locally inside Waypoint IDE, install the compilers for the languages you want to teach or practice:

### 1. C & C++ (MinGW-w64 GCC / G++)
- Install via winget:
  ```powershell
  winget install MinGW.MinGW-w64
  ```
- Or download MSYS2 from [msys2.org](https://www.msys2.org/).
- Verify in terminal: `g++ --version` and `gcc --version`

### 2. Python 3
- Install via winget:
  ```powershell
  winget install Python.Python.3.12
  ```
- Verify in terminal: `python --version`

### 3. Java (JDK 17 LTS or 21)
- Install Adoptium Temurin OpenJDK:
  ```powershell
  winget install EclipseAdoptium.Temurin.17.JDK
  ```
- Verify in terminal: `javac --version` and `java --version`

---

## Project Structure

```text
Waypoint IDE/
├── src/                          # React + TypeScript Frontend
│   ├── assets/                   # AppIcon, branding logos, icons
│   ├── components/               # Common layout & UI widgets
│   │   ├── common/               # ConfirmModal, FileIcon, Resizer
│   │   └── layout/               # TopBar, StatusBar
│   ├── features/                 # Modular feature domains
│   │   ├── editor/               # Monaco EditorPane, TabBar
│   │   ├── explorer/             # ProjectExplorer, FileTreeItem
│   │   ├── output/               # OutputPanel (stdout, stderr, terminal)
│   │   ├── review/               # ReviewConsole (diff cards, awards)
│   │   ├── welcome/              # WelcomeTab (quick actions & shortcuts)
│   │   └── wizard/               # SetupWizardModal (5-step onboarding)
│   ├── services/                 # Business logic & IPC bridges
│   │   ├── astAnalysisService.ts # Deterministic heuristic/AST rule catalog
│   │   ├── executionService.ts   # Process runner & regex error parsers
│   │   ├── fileService.ts        # Virtual tree & localStorage cache
│   │   ├── ollamaService.ts      # Model pull stream & latency tests
│   │   └── reviewService.ts      # Prompt injector & single-issue diffs
│   ├── styles/                   # Sand / Editorial Vanilla CSS design system
│   └── types/                    # Core TypeScript interfaces (ide.ts)
├── src-tauri/                    # Native Desktop Backend (Rust)
│   ├── capabilities/             # Tauri v2 security ACL permissions
│   ├── icons/                    # Multi-resolution application icons
│   ├── src/                      # Rust source code
│   │   ├── lib.rs                # IPC command handlers & process manager
│   │   └── main.rs               # Windows entry point
│   ├── Cargo.toml                # Rust crate dependencies
│   ├── setup.iss                 # Inno Setup 6.7+ installer build script
│   └── tauri.conf.json           # Tauri desktop app configuration
├── Waypoint_IDE_Project_Docs/    # Architectural specifications & PRDs
├── dist/                         # Compiled frontend distribution
├── dist-installer/               # Generated Windows setup installer .exe
├── FINAL_YEAR_PROJECT_MIDTERM_REPORT.txt # Comprehensive technical audit
├── package.json                  # Node dependencies & npm scripts
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite build configuration
```

---

## Troubleshooting & FAQ

### 1. `error: linking with link.exe failed: exit code: 1181` or missing C++ Build Tools
- **Cause:** Rust requires the MSVC linker on Windows.
- **Fix:** Install Visual Studio Build Tools with the "Desktop development with C++" workload selected.

### 2. `error: G++ compiler not found in system PATH`
- **Cause:** MinGW is not installed or its `bin` directory is missing from the system environment variable `PATH`.
- **Fix:** Add `C:\MinGW\bin` (or `C:\msys64\ucrt64\bin`) to your user or system `PATH` and restart Waypoint IDE.

### 3. Ollama shows `Offline / Standby` in Status Bar
- **Cause:** Ollama service is not running on port 11434.
- **Fix:** Click the active model in the status bar or the Settings gear (`⚙`) in the TopBar to open the Setup Wizard, which will automatically attempt to launch `ollama serve`. Alternatively, run `ollama serve` in a terminal.

### 4. How to perform a completely clean rebuild
```powershell
# Clean frontend build
rmdir /s /q dist node_modules
npm install

# Clean Rust build
cd src-tauri
cargo clean
cd ..

# Rebuild release executable
npx tauri build
```

---

## License & Attribution

Waypoint IDE is developed as an academic software engineering project for computer science education.
- **Frontend:** React 19 (MIT), Monaco Editor (MIT), Lucide Icons (ISC)
- **Desktop Runtime:** Tauri v2 (MIT / Apache-2.0)
- **Native Core:** Rust (MIT / Apache-2.0)
- **Local AI:** Powered by [Ollama](https://ollama.com/) (MIT)
