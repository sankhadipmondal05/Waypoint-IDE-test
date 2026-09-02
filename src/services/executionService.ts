import type { FileItem, ExecutionResult } from '../types/ide';

export interface CompilerCheckResult {
  installed: boolean;
  version?: string;
  executablePath?: string;
  guidanceMessage?: string;
}

export class ExecutionService {
  /**
   * Check environment readiness for language compilers / runtimes dynamically
   */
  static async detectToolchainsAsync(): Promise<Record<string, CompilerCheckResult>> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const scanned: any[] = await invoke('scan_system_toolchains');
      const result: Record<string, CompilerCheckResult> = {};
      
      const tcMap: Record<string, string> = {
        python: 'Python runtime not found in system PATH. Install Python 3.11+.',
        cpp: 'G++ compiler not found in system PATH. Install MinGW-w64 (GCC/G++).',
        c: 'GCC compiler not found in system PATH. Install MinGW-w64.',
        javac: 'Java compiler (javac) not found in system PATH. Install OpenJDK 17+.',
      };

      scanned.forEach((s) => {
        const key = s.id === 'javac' ? 'java' : s.id;
        result[key] = {
          installed: s.installed,
          version: s.version || '',
          guidanceMessage: s.installed ? undefined : tcMap[s.id] || `${s.id} compiler not found.`,
        };
      });

      return result;
    } catch (_) {
      return {
        python: { installed: true, version: 'Browser Evaluator' },
        cpp: { installed: false, guidanceMessage: 'G++ not found in system PATH.' },
        c: { installed: false, guidanceMessage: 'GCC not found in system PATH.' },
        java: { installed: false, guidanceMessage: 'JDK not found in system PATH.' },
      };
    }
  }

  /**
   * Execute code locally with true native compilation & execution with interactive stdin support
   */
  static async runProgram(file: FileItem, stdinInput?: string): Promise<ExecutionResult> {
    const startTime = performance.now();

    // Try native execution via Tauri backend first
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res: any = await invoke('compile_and_run_file', {
        fileName: file.name,
        content: file.content || '',
        stdinInput: stdinInput || null,
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (!res.success && res.stderr) {
        let errorLine = 1;
        let errorCol = 1;
        let rawStderr: string = res.stderr;

        // Python pattern: File "...", line 4, in ...
        const pyMatch = rawStderr.match(/File\s+["'][^"']+["'],\s+line\s+(\d+)/i);
        if (pyMatch && pyMatch[1]) {
          errorLine = parseInt(pyMatch[1], 10);
        }

        // C++/C / GCC / Clang pattern: filename.cpp:4:12: error: ...
        const gccMatch = rawStderr.match(/([^\s:]+):(\d+):(\d+):\s*(?:fatal\s+)?error:\s*(.*)/i);
        if (gccMatch && gccMatch[2]) {
          errorLine = parseInt(gccMatch[2], 10);
          if (gccMatch[3]) errorCol = parseInt(gccMatch[3], 10);
        }

        // Java pattern: Main.java:4: error: ...
        const javaMatch = rawStderr.match(/([^\s:]+):(\d+):\s*error:\s*(.*)/i);
        if (javaMatch && javaMatch[2]) {
          errorLine = parseInt(javaMatch[2], 10);
        }

        // Clean toolchain internal system paths (MinGW / crtexe / ld.exe internals)
        let cleanedStderr = rawStderr
          .replace(/[A-Za-z]:\\[^"'\n\r]+[\\/](waypoint_runner[\\/])?/gi, '')
          .replace(/File\s+["'][^"']*[\\/]([^"'\\]+)["']/gi, 'File "$1"')
          .replace(/[A-Za-z]:\/[^\s:]+\/bin\/ld\.exe:\s*/gi, '')
          .replace(/[A-Za-z]:\/[^\s:]+\/lib\/[^\s:]+:\s*/gi, '')
          .replace(/collect2\.exe:\s*error:\s*ld\s*returned\s*1\s*exit\s*status/gi, '')
          .trim();

        // Check for missing main() entry point in C/C++
        let studentExplanation = '';
        if (
          rawStderr.includes('undefined reference to `WinMain\'') ||
          rawStderr.includes('undefined reference to `main\'') ||
          cleanedStderr.includes("undefined reference to `WinMain'") ||
          cleanedStderr.includes("undefined reference to `main'")
        ) {
          cleanedStderr = `Linker Error: No 'main()' function found in ${file.name}.\nEvery runnable program in C/C++ requires a 'main()' function as the execution entry point.`;
          studentExplanation = `**Missing Entry Point in ${file.name}:**\nAdd a \`main()\` function to define where your program starts executing:\n\`\`\`cpp\nint main() {\n    // your code here\n    return 0;\n}\n\`\`\``;
        } else if (cleanedStderr.includes('IndentationError')) {
          studentExplanation = `**Python Indentation Issue on line ${errorLine}:**\nEnsure all code blocks (inside functions, loops, and if-conditions) have consistent indentation spaces.`;
        } else if (cleanedStderr.includes('SyntaxError')) {
          studentExplanation = `**Syntax Error near line ${errorLine}:**\nCheck for missing colons, mismatched parentheses/brackets, or unclosed quotation marks.`;
        } else {
          const lines = cleanedStderr.split('\n').filter((l) => l.trim().length > 0);
          const firstCause = lines.find((l) => l.toLowerCase().includes('error:')) || lines[0] || 'Execution error';
          studentExplanation = `**Issue in ${file.name} (Line ${errorLine}):**\n${firstCause}\n\n*Review line ${errorLine} in your editor.*`;
        }

        const lines = cleanedStderr.split('\n').filter((l) => l.trim().length > 0);
        const lastLine = lines[lines.length - 1] || 'Compilation or runtime error';

        return {
          state: 'error',
          stdout: res.stdout || '',
          stderr: cleanedStderr,
          exitCode: res.exit_code ?? 1,
          executionTimeMs: elapsed,
          errorLocation: {
            file: file.name,
            line: errorLine,
            column: errorCol,
            message: lastLine,
          },
          aiExplanation: studentExplanation,
        };
      }

      // Detect if source code contains interactive input statements
      const code = file.content || '';
      const hasInputStatement =
        /\b(scanf|cin\s*>>|input\s*\(|readLine|Scanner|System\.in)\b/.test(code);

      if (stdinInput === undefined && hasInputStatement && res.success) {
        // Extract prompt string (e.g. "Enter an integer: " or "Enter a string: ")
        let prompt = (res.stdout || '').trim();
        // If stdout contains garbled non-palindrome or output after empty stdin, clean it to the prompt
        const promptMatch = res.stdout?.match(/^(.*?[:\?]\s*)/);
        if (promptMatch && promptMatch[1]) {
          prompt = promptMatch[1];
        }

        return {
          state: 'running',
          stdout: prompt || res.stdout || '',
          stderr: '',
          exitCode: 0,
          executionTimeMs: elapsed,
          inputNeeded: true,
          promptText: prompt,
        };
      }

      return {
        state: res.success ? 'success' : 'error',
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        exitCode: res.exit_code ?? 0,
        executionTimeMs: elapsed,
        inputNeeded: false,
        inputProvided: stdinInput,
      };
    } catch (err: any) {
      return {
        state: 'error',
        stdout: '',
        stderr: `Execution error: ${err?.message || String(err)}`,
        exitCode: 1,
        executionTimeMs: 1,
      };
    }
  }
}
