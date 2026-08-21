import React from 'react';
import { Cpu, HardDrive } from 'lucide-react';
import type { FileItem } from '../../types/ide';

interface StatusBarProps {
  activeFile: FileItem | null;
  language: string;
  activeModel?: string;
  onConfigureAI?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  language,
  activeModel = 'qwen2.5-coder:3b',
  onConfigureAI,
}) => {
  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        <div className="statusbar-item">
          <span className="status-indicator-dot" />
          <span>Local Engine Ready</span>
        </div>

        <div
          className="statusbar-item clickable"
          onClick={onConfigureAI}
          title="Click to change model or run Setup Wizard"
        >
          <Cpu size={12} />
          <span>{activeModel} (Ollama)</span>
        </div>

        <div className="statusbar-item">
          <HardDrive size={12} />
          <span>Offline Ready</span>
        </div>
      </div>

      <div className="statusbar-right">
        {activeFile && (
          <>
            <div className="statusbar-item clickable">
              <span>Ln 1, Col 1</span>
            </div>

            <div className="statusbar-item clickable">
              <span>UTF-8</span>
            </div>

            <div className="statusbar-item clickable" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
              {language}
            </div>
          </>
        )}
      </div>
    </footer>
  );
};
