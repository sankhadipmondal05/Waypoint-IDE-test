import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import type { FileItem } from '../../types/ide';
import { FileIcon } from '../../components/common/FileIcon';

interface FileTreeItemProps {
  item: FileItem;
  activeFileId: string | null;
  onSelectFile: (item: FileItem) => void;
  onDeleteItem: (itemId: string, e: React.MouseEvent) => void;
  onMoveItem: (sourceId: string, targetFolderId: string | null) => void;
  level?: number;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  item,
  activeFileId,
  onSelectFile,
  onDeleteItem,
  onMoveItem,
  level = 0,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(item);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item.isFolder) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const sourceId = e.dataTransfer.getData('text/plain');
    if (!sourceId || sourceId === item.id) return;

    if (item.isFolder) {
      onMoveItem(sourceId, item.id);
      setIsOpen(true);
    }
  };

  const isSelected = activeFileId === item.id;

  return (
    <div className="tree-node-wrapper">
      <div
        className={`tree-item ${isSelected ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${level * 14 + 8}px` }}
        onClick={handleClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {item.isFolder ? (
          <span className="tree-chevron">
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="tree-chevron" />
        )}

        <span className="tree-icon">
          <FileIcon
            name={item.name}
            isFolder={item.isFolder}
            isOpen={isOpen}
            size={14}
          />
        </span>

        <span className="tree-name">{item.name}</span>

        {item.isModified && <span className="tree-badge">●</span>}

        {/* Delete action button for active/selected or hovered item */}
        <button
          className="tree-delete-btn"
          title={`Delete ${item.name}`}
          onClick={(e) => onDeleteItem(item.id, e)}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {item.isFolder && isOpen && item.children && (
        <div className="tree-children-container">
          {item.children.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              activeFileId={activeFileId}
              onSelectFile={onSelectFile}
              onDeleteItem={onDeleteItem}
              onMoveItem={onMoveItem}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
