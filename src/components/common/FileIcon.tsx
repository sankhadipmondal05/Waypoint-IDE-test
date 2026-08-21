import React from 'react';
import {
  FileCode,
  FileText,
  FileJson,
  Folder,
  FolderOpen,
  Terminal,
  Settings,
} from 'lucide-react';

interface FileIconProps {
  name: string;
  isFolder?: boolean;
  isOpen?: boolean;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({
  name,
  isFolder = false,
  isOpen = false,
  size = 14,
}) => {
  if (isFolder) {
    return isOpen ? (
      <FolderOpen size={size} color="#8A7758" />
    ) : (
      <Folder size={size} color="#8A7758" />
    );
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';

  const renderIcon = () => {
    switch (ext) {
      case 'cpp':
      case 'cxx':
      case 'cc':
        return <FileCode size={size} color="#1E6B9B" />;
      case 'c':
      case 'h':
        return <FileCode size={size} color="#5C6F84" />;
      case 'py':
      case 'pyw':
        return <FileCode size={size} color="#3572A5" />;
      case 'java':
      case 'class':
      case 'jar':
        return <FileCode size={size} color="#B07219" />;
      case 'md':
      case 'markdown':
        return <FileText size={size} color="#083fa1" />;
      case 'json':
        return <FileJson size={size} color="#CBCB41" />;
      case 'sh':
      case 'bash':
      case 'bat':
      case 'cmd':
        return <Terminal size={size} color="#4EAA25" />;
      case 'txt':
        return <FileText size={size} color="#7C7A73" />;
      case 'toml':
      case 'yaml':
      case 'yml':
      case 'conf':
        return <Settings size={size} color="#8F3B3B" />;
      default:
        return <FileCode size={size} color="#7C7A73" />;
    }
  };

  return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{renderIcon()}</span>;
};
