import React from 'react';
import { X } from 'lucide-react';
import type { FileItem } from '../../types/ide';
import { FileIcon } from '../../components/common/FileIcon';

interface TabBarProps {
  openTabs: FileItem[];
  activeFileId: string | null;
  onSelectTab: (file: FileItem) => void;
  onCloseTab: (fileId: string, e: React.MouseEvent) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  openTabs,
  activeFileId,
  onSelectTab,
  onCloseTab,
}) => {
  return (
    <div className="tab-bar">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeFileId;
        return (
          <div
            key={tab.id}
            className={`editor-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab)}
          >
            <span className="tab-icon">
              <FileIcon name={tab.name} size={13} />
            </span>
            <span className="tab-title">{tab.name}</span>

            {tab.isModified && <span className="tab-unsaved" title="Unsaved changes" />}

            <button
              className="tab-close"
              onClick={(e) => onCloseTab(tab.id, e)}
              title="Close Tab"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
