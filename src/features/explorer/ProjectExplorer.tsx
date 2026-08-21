import React, { useState } from 'react';
import { Plus, FolderPlus, RefreshCw } from 'lucide-react';
import type { FileItem } from '../../types/ide';
import { FileTreeItem } from './FileTreeItem';

interface ProjectExplorerProps {
  files: FileItem[];
  activeFileId: string | null;
  onSelectFile: (file: FileItem) => void;
  onNewFile: (fileName: string) => void;
  onNewFolder: (folderName: string) => void;
  onRefresh: () => void;
  onDeleteItem: (itemId: string, e: React.MouseEvent) => void;
  onMoveItem: (sourceId: string, targetFolderId: string | null) => void;
}

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onNewFile,
  onNewFolder,
  onRefresh,
  onDeleteItem,
  onMoveItem,
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [itemNameInput, setItemNameInput] = useState('');
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = itemNameInput.trim();
    if (!trimmed) {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      return;
    }

    if (isCreatingFile) {
      onNewFile(trimmed);
      setIsCreatingFile(false);
    } else if (isCreatingFolder) {
      onNewFolder(trimmed);
      setIsCreatingFolder(false);
    }
    setItemNameInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
      setItemNameInput('');
    }
  };

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsRootDragOver(true);
  };

  const handleRootDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId) {
      onMoveItem(sourceId, null);
    }
  };

  return (
    <aside
      className={`explorer-panel ${isRootDragOver ? 'root-drag-over' : ''}`}
      onDragOver={handleRootDragOver}
      onDragLeave={handleRootDragLeave}
      onDrop={handleRootDrop}
    >
      <div className="explorer-header">
        <span className="explorer-title">Project</span>

        <div className="explorer-actions">
          <button
            className="explorer-action-btn"
            onClick={() => {
              setIsCreatingFile(true);
              setIsCreatingFolder(false);
              setItemNameInput('');
            }}
            title="New File (e.g. solution.cpp, main.py)"
          >
            <Plus size={14} />
          </button>
          <button
            className="explorer-action-btn"
            onClick={() => {
              setIsCreatingFolder(true);
              setIsCreatingFile(false);
              setItemNameInput('');
            }}
            title="New Folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            className="explorer-action-btn"
            onClick={onRefresh}
            title="Refresh Explorer"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Inline Creation Input */}
      {(isCreatingFile || isCreatingFolder) && (
        <form
          onSubmit={handleCreateSubmit}
          style={{ padding: '6px 8px', background: 'var(--surface-hover)' }}
        >
          <input
            autoFocus
            type="text"
            className="explorer-create-input"
            value={itemNameInput}
            onChange={(e) => setItemNameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!itemNameInput.trim()) {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
              }
            }}
            placeholder={isCreatingFile ? 'filename.cpp, test.py...' : 'folder name...'}
            style={{
              width: '100%',
              padding: '3px 6px',
              fontSize: '12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--accent-color)',
              background: 'var(--surface-color)',
              color: 'var(--text-primary)',
            }}
          />
        </form>
      )}

      <div className="explorer-tree">
        {files.map((file) => (
          <FileTreeItem
            key={file.id}
            item={file}
            activeFileId={activeFileId}
            onSelectFile={onSelectFile}
            onDeleteItem={onDeleteItem}
            onMoveItem={onMoveItem}
          />
        ))}
      </div>
    </aside>
  );
};
