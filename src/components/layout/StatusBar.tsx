import React from 'react';
import { Cpu, Loader2, CheckCircle2, RotateCw } from 'lucide-react';
import type { FileItem } from '../../types/ide';

interface StatusBarProps {
  activeFile: FileItem | null;
  language: string;
  activeModel?: string;
  isOllamaConnected?: boolean;
  isModelReady?: boolean;
  isModelDownloading?: boolean;
  onConfigureAI?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  language,
  activeModel = 'qwen2.5-coder:1.5b',
  isOllamaConnected = false,
  isModelReady = false,
  isModelDownloading = false,
  onConfigureAI,
}) => {
  return (
    <footer className="statusbar">
      <div className="statusbar-left">
        {/* Local Engine connection indicator */}
        <div className="statusbar-item" title={isOllamaConnected ? 'Local Ollama Engine Connected' : 'Spawning Ollama engine in background...'}>
          {isOllamaConnected ? (
            <span
              className="status-indicator-dot"
              style={{
                backgroundColor: 'var(--success-color, #10b981)',
              }}
            />
          ) : (
            <RotateCw size={11} className="spin-icon engine-connecting-icon" />
          )}
          <span>{isOllamaConnected ? 'Local Engine Connected' : 'Engine Offline / Standby'}</span>
        </div>

        {/* Active / Downloading Model status */}
        <div
          className="statusbar-item clickable"
          onClick={onConfigureAI}
          title={
            isModelDownloading
              ? `Downloading ${activeModel} in background...`
              : isModelReady
              ? `Model ${activeModel} is active and ready`
              : `Click to configure ${activeModel}`
          }
        >
          <Cpu size={12} />
          <span>{activeModel}</span>
          
          {isModelDownloading ? (
            <span className="statusbar-model-badge downloading">
              <Loader2 size={10} className="spin-icon" />
              <span>Downloading...</span>
            </span>
          ) : isModelReady ? (
            <span className="statusbar-model-badge active">
              <CheckCircle2 size={10} />
              <span>Active</span>
            </span>
          ) : isOllamaConnected ? (
            <span className="statusbar-model-badge pending">
              <span>Standby</span>
            </span>
          ) : (
            <span className="statusbar-model-badge offline">
              <span>Offline</span>
            </span>
          )}
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
