import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco, OnMount } from '@monaco-editor/react';
import { FileCode } from 'lucide-react';
import type { FileItem } from '../../types/ide';
import { TabBar } from './TabBar';
import { FileIcon } from '../../components/common/FileIcon';
import { defineMonacoThemes } from '../../styles/monacoTheme';

interface EditorPaneProps {
  openTabs: FileItem[];
  activeFile: FileItem | null;
  onSelectTab: (file: FileItem) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onChangeContent: (content: string) => void;
  onSave: () => void;
  theme: 'light' | 'dark';
  errorLine?: number;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  openTabs,
  activeFile,
  onSelectTab,
  onCloseTab,
  onChangeContent,
  onSave,
  theme,
  errorLine,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    defineMonacoThemes(monaco);
    monaco.editor.setTheme(theme === 'dark' ? 'sand-editorial-dark' : 'sand-editorial-light');

    // Add Ctrl+S / Cmd+S save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });
  };

  React.useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(
        theme === 'dark' ? 'sand-editorial-dark' : 'sand-editorial-light'
      );
    }
  }, [theme]);

  // Set line error decorations in Monaco if an errorLine is present
  React.useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    if (errorLine && errorLine > 0) {
      editorRef.current.revealLineInCenter(errorLine);
      editorRef.current.deltaDecorations(
        [],
        [
          {
            range: new monacoRef.current.Range(errorLine, 1, errorLine, 1),
            options: {
              isWholeLine: true,
              className: 'monaco-error-line-highlight',
              glyphMarginClassName: 'monaco-error-glyph',
            },
          },
        ]
      );
    }
  }, [errorLine, activeFile?.id]);

  if (!activeFile) {
    return (
      <div className="editor-container">
        <div className="editor-empty-state">
          <FileCode size={36} color="var(--border-color)" />
          <h3 className="empty-state-title">No File Open</h3>
          <p className="empty-state-subtitle">
            Select a file from the Project Explorer on the left to start coding and learning.
          </p>
        </div>
      </div>
    );
  }

  const getMonacoLanguage = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'cpp':
      case 'cxx':
      case 'cc':
      case 'c':
      case 'h':
        return 'cpp';
      case 'py':
      case 'pyw':
        return 'python';
      case 'java':
        return 'java';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'json':
        return 'json';
      case 'sh':
      case 'bash':
        return 'shell';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="editor-container">
      <TabBar
        openTabs={openTabs}
        activeFileId={activeFile.id}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />

      <div className="editor-breadcrumb">
        <span className="breadcrumb-item">
          <FileIcon name={activeFile.name} size={12} />
          <span>workspace</span>
        </span>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-item">{activeFile.path.replace(/^\//, '')}</span>
      </div>

      <div className="editor-monaco-wrapper" style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={getMonacoLanguage(activeFile.name)}
          value={activeFile.content || ''}
          theme={theme === 'dark' ? 'sand-editorial-dark' : 'sand-editorial-light'}
          beforeMount={(monaco) => defineMonacoThemes(monaco)}
          onMount={handleEditorDidMount}
          onChange={(value) => onChangeContent(value || '')}
          options={{
            fontSize: 13,
            fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 21,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
            padding: { top: 10, bottom: 10 },
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    </div>
  );
};
