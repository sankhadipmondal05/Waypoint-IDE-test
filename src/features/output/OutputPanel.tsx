import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Lightbulb, Terminal as TerminalIcon, Code2, Trash2 } from 'lucide-react';
import type { ExecutionResult, FileItem } from '../../types/ide';
import { ExecutionService } from '../../services/executionService';

interface OutputPanelProps {
  activeTab: 'output' | 'terminal';
  onTabChange: (tab: 'output' | 'terminal') => void;
  result: ExecutionResult | null;
  onClearOutput: () => void;
  onRunInput?: (input: string) => void;
  activeFile?: FileItem | null;
  files?: FileItem[];
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  activeTab,
  onTabChange,
  result,
  onClearOutput,
  onRunInput,
  activeFile,
  files = [],
}) => {
  // Terminal emulator state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'input' | 'output' | 'error' | 'system'; text: string }>>([
    { type: 'system', text: 'Waypoint IDE Terminal [Ready]' },
    { type: 'system', text: 'Type standard system commands (e.g. dir, ls, python <file>, gcc <file>, help) or "run" to execute files.' },
  ]);
  const [commandInput, setCommandInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [commandList, setCommandList] = useState<string[]>([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'terminal') {
      inputRef.current?.focus();
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, terminalHistory]);

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) {
      setTerminalHistory((prev) => [...prev, { type: 'input', text: '' }]);
      return;
    }

    setCommandList((prev) => [...prev, cmd]);
    setHistoryIndex(null);
    setCommandInput('');

    const newHistory = [...terminalHistory, { type: 'input' as const, text: cmd }];

    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (mainCmd === 'clear' || mainCmd === 'cls') {
      setTerminalHistory([]);
      return;
    }

    if (mainCmd === 'help') {
      newHistory.push({
        type: 'output',
        text: `Available commands:
  run [file]         - Execute the active or specified file
  python <file>      - Run python script
  gcc / g++ <file>   - Compile C/C++ source
  ls / dir           - List files in current workspace
  cat <file>         - Display file contents
  echo <message>     - Print message
  clear              - Clear terminal window
  help               - Show this help menu`,
      });
      setTerminalHistory(newHistory);
      return;
    }

    if (mainCmd === 'run') {
      let targetFile = activeFile;
      if (args[0]) {
        const findFileByName = (items: FileItem[], name: string): FileItem | null => {
          for (const it of items) {
            if (it.name === name && !it.isFolder) return it;
            if (it.children) {
              const found = findFileByName(it.children, name);
              if (found) return found;
            }
          }
          return null;
        };
        targetFile = findFileByName(files, args[0]);
      }
      if (!targetFile) {
        newHistory.push({ type: 'error', text: `run: File not found: ${args[0] || 'No active file'}` });
        setTerminalHistory(newHistory);
        return;
      }

      newHistory.push({ type: 'system', text: `[Running ${targetFile.name}...]` });
      setTerminalHistory([...newHistory]);

      const execResult = await ExecutionService.runProgram(targetFile);
      const updatedHistory = [...newHistory];
      if (execResult.stdout) updatedHistory.push({ type: 'output', text: execResult.stdout });
      if (execResult.stderr) updatedHistory.push({ type: 'error', text: execResult.stderr });
      updatedHistory.push({
        type: 'system',
        text: `[Process completed with exit code ${execResult.exitCode} (${execResult.executionTimeMs}ms)]`,
      });
      setTerminalHistory(updatedHistory);
      return;
    }

    // Execute real system command via native Tauri backend
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const res: any = await invoke('run_terminal_command', { command: cmd });
      if (res.stdout) newHistory.push({ type: 'output', text: res.stdout });
      if (res.stderr) newHistory.push({ type: 'error', text: res.stderr });
      if (!res.stdout && !res.stderr) {
        newHistory.push({ type: 'system', text: `[Command finished with code ${res.exit_code ?? 0}]` });
      }
    } catch (err: any) {
      newHistory.push({ type: 'error', text: `Error running command: ${err?.message || String(err)}` });
    }

    setTerminalHistory([...newHistory]);
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandList.length === 0) return;
      const nextIdx = historyIndex === null ? commandList.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandList[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandList.length) {
        setHistoryIndex(null);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandList[nextIdx]);
      }
    }
  };

  return (
    <section className="output-panel">
      <div className="output-header">
        <div className="output-tabs">
          <button
            className={`output-tab-btn ${activeTab === 'output' ? 'active' : ''}`}
            onClick={() => onTabChange('output')}
          >
            <Code2 size={13} />
            <span>OUTPUT</span>
          </button>
          <button
            className={`output-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => onTabChange('terminal')}
          >
            <TerminalIcon size={13} />
            <span>TERMINAL</span>
          </button>
        </div>

        <div className="output-status-indicator">
          {activeTab === 'output' && result && (
            <>
              <span className={`status-dot ${result.state}`} />
              <span>
                {result.state === 'running' && 'Running...'}
                {result.state === 'success' && `Finished (code 0)`}
                {result.state === 'error' && `Failed (code ${result.exitCode})`}
              </span>
            </>
          )}

          <button
            className="btn-icon"
            style={{ width: 24, height: 24 }}
            onClick={activeTab === 'output' ? onClearOutput : () => setTerminalHistory([])}
            title={activeTab === 'output' ? 'Clear Output' : 'Clear Terminal'}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="output-content selectable-output">
        {activeTab === 'output' ? (
          <div>
            {!result ? (
              <div style={{ color: 'var(--text-muted)' }}>
                Press <strong>Run</strong> in the top bar to compile and execute the currently opened file. You can select and copy output, or use the <strong>TERMINAL</strong> tab to execute programs interactively.
              </div>
            ) : (
              <div>
                {result.state === 'success' && (
                  <div className="execution-banner success">
                    <div className="banner-left">
                      <CheckCircle2 size={15} />
                      <span>Program finished successfully</span>
                    </div>
                    {result.executionTimeMs !== undefined && (
                      <div className="banner-meta">
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {result.executionTimeMs} ms
                      </div>
                    )}
                  </div>
                )}

                {result.state === 'error' && (
                  <div className="execution-banner error">
                    <div className="banner-left">
                      <XCircle size={15} />
                      <span>Program execution failed</span>
                    </div>
                    {result.executionTimeMs !== undefined && (
                      <div className="banner-meta">
                        <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                        {result.executionTimeMs} ms
                      </div>
                    )}
                  </div>
                )}

                {result.stdout && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>
                      Output:
                    </div>
                    {result.inputNeeded ? (
                      <div className="interactive-prompt-row">
                        <span className="raw-prompt-text">{result.stdout}</span>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (commandInput.trim()) {
                              const inputStr = commandInput;
                              setCommandInput('');
                              if (onRunInput) {
                                onRunInput(inputStr);
                              }
                            }
                          }}
                          className="inline-prompt-form"
                        >
                          <input
                            type="text"
                            className="inline-prompt-input"
                            value={commandInput}
                            onChange={(e) => setCommandInput(e.target.value)}
                            autoFocus
                            placeholder="type here..."
                          />
                        </form>
                      </div>
                    ) : (
                      <pre className="raw-output selectable-text">{result.stdout}</pre>
                    )}
                  </div>
                )}

                {result.stderr && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ color: 'var(--error-color)', marginBottom: 4, fontWeight: 600 }}>
                      Compiler / Runtime Error:
                    </div>
                    <pre className="raw-output selectable-text" style={{ color: 'var(--error-color)' }}>
                      {result.stderr}
                    </pre>
                  </div>
                )}

                {result.errorLocation && (
                  <div
                    className="error-location-badge"
                    title="Jump to error line in editor"
                  >
                    📍 {result.errorLocation.file}:{result.errorLocation.line}:{result.errorLocation.column}
                  </div>
                )}

                {result.aiExplanation && (
                  <div className="ai-explanation-card">
                    <div className="ai-card-header">
                      <Lightbulb size={14} color="var(--warning-color)" />
                      <span>Understanding this error</span>
                    </div>
                    <div className="ai-card-body selectable-text">{result.aiExplanation}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="interactive-terminal-container selectable-output" onClick={() => inputRef.current?.focus()}>
            {terminalHistory.map((item, idx) => (
              <div key={idx} className={`terminal-history-item ${item.type}`}>
                {item.type === 'input' ? (
                  <div className="terminal-line">
                    <span className="terminal-prompt">waypoint:~/workspace$</span>
                    <span className="terminal-cmd-text">{item.text}</span>
                  </div>
                ) : (
                  <pre className={`terminal-output-text selectable-text ${item.type}`}>{item.text}</pre>
                )}
              </div>
            ))}

            <form onSubmit={handleTerminalSubmit} className="terminal-input-form">
              <span className="terminal-prompt">waypoint:~/workspace$</span>
              <input
                ref={inputRef}
                type="text"
                className="terminal-cmd-input"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </form>
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </section>
  );
};
