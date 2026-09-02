import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { Monaco, OnMount } from '@monaco-editor/react';
import type { FileItem } from '../../types/ide';
import { TabBar } from './TabBar';
import { FileIcon } from '../../components/common/FileIcon';
import { defineMonacoThemes } from '../../styles/monacoTheme';

import { WelcomeTab } from '../welcome/WelcomeTab';

interface EditorPaneProps {
  openTabs: FileItem[];
  activeFile: FileItem | null;
  onSelectTab: (file: FileItem) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
  onChangeContent: (content: string) => void;
  onSave: () => void;
  onNewFile?: (fileName: string) => void;
  onOpenWizard?: () => void;
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
  onNewFile = () => {},
  onOpenWizard = () => {},
  theme,
  errorLine,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [fontSize, setFontSize] = React.useState<number>(() => {
    const saved = localStorage.getItem('waypoint_editor_fontsize');
    return saved ? parseInt(saved, 10) : 14;
  });

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    defineMonacoThemes(monaco);
    monaco.editor.setTheme(theme === 'dark' ? 'sand-editorial-dark' : 'sand-editorial-light');

    // Add Ctrl+S / Cmd+S save command
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Add Ctrl+= (Zoom In)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      setFontSize((prev) => {
        const next = Math.min(prev + 1, 32);
        localStorage.setItem('waypoint_editor_fontsize', next.toString());
        return next;
      });
    });

    // Add Ctrl+- (Zoom Out)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      setFontSize((prev) => {
        const next = Math.max(prev - 1, 10);
        localStorage.setItem('waypoint_editor_fontsize', next.toString());
        return next;
      });
    });

    // Add Ctrl+0 (Reset Zoom)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      setFontSize(14);
      localStorage.setItem('waypoint_editor_fontsize', '14');
    });
  };

  // Global window listener for Ctrl + / - / 0
  React.useEffect(() => {
    const handleGlobalZoom = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setFontSize((prev) => {
            const next = Math.min(prev + 1, 32);
            localStorage.setItem('waypoint_editor_fontsize', next.toString());
            return next;
          });
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          setFontSize((prev) => {
            const next = Math.max(prev - 1, 10);
            localStorage.setItem('waypoint_editor_fontsize', next.toString());
            return next;
          });
        } else if (e.key === '0') {
          e.preventDefault();
          setFontSize(14);
          localStorage.setItem('waypoint_editor_fontsize', '14');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalZoom);
    return () => window.removeEventListener('keydown', handleGlobalZoom);
  }, []);

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
        {openTabs.length > 0 && (
          <TabBar
            openTabs={openTabs}
            activeFileId={null}
            onSelectTab={onSelectTab}
            onCloseTab={onCloseTab}
          />
        )}
        <WelcomeTab
          onNewFile={onNewFile}
          onOpenWizard={onOpenWizard}
        />
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
            fontSize: fontSize,
            fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
            fontWeight: '500',
            lineHeight: Math.round(fontSize * 1.55),
            fontLigatures: true,
            mouseWheelZoom: true,
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
