import type { FileItem } from '../types/ide';

export class FileService {
  private static STORAGE_KEY = 'waypoint_project_files';

  /**
   * Save files tree to persistent local storage / cache
   */
  static saveFilesToStorage(files: FileItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.error('Failed to save files to storage', e);
    }
  }

  /**
   * Load files tree from persistent local storage
   */
  static loadFilesFromStorage(): FileItem[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load files from storage', e);
    }
    return null;
  }

  /**
   * Default starter files for newly opened workspaces (clean empty workspace)
   */
  static getDefaultProjectFiles(): FileItem[] {
    return [];
  }

  /**
   * Create a new file item helper
   */
  static createNewFile(name: string, content: string = ''): FileItem {
    const ext = name.split('.').pop()?.toLowerCase();
    let language: any = 'text';
    let defaultTemplate = content;

    if (ext === 'cpp' || ext === 'cxx' || ext === 'cc') {
      language = 'cpp';
      if (!defaultTemplate) {
        defaultTemplate = `#include <iostream>

int main() {
    std::cout << "Hello, Waypoint!" << std::endl;
    return 0;
}`;
      }
    } else if (ext === 'c' || ext === 'h') {
      language = 'c';
      if (!defaultTemplate) {
        defaultTemplate = `#include <stdio.h>

int main() {
    printf("Hello, Waypoint!\\n");
    return 0;
}`;
      }
    } else if (ext === 'py') {
      language = 'python';
      if (!defaultTemplate) {
        defaultTemplate = `def main():
    print("Hello, Waypoint!")

if __name__ == "__main__":
    main()`;
      }
    } else if (ext === 'java') {
      language = 'java';
      const className = name.split('.')[0] || 'Main';
      if (!defaultTemplate) {
        defaultTemplate = `public class ${className} {
    public static void main(String[] args) {
        System.out.println("Hello, Waypoint!");
    }
}`;
      }
    } else if (ext === 'md') language = 'markdown';
    else if (ext === 'json') language = 'json';

    return {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      path: `/${name}`,
      isFolder: false,
      language,
      content: defaultTemplate,
      problemStatement: '',
      isModified: false,
    };
  }

  /**
   * Create a new folder item helper
   */
  static createNewFolder(name: string): FileItem {
    return {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name,
      path: `/${name}`,
      isFolder: true,
      children: [],
    };
  }

  /**
   * Delete an item (file or folder) from the tree recursively
   */
  static deleteItemFromTree(items: FileItem[], targetId: string): FileItem[] {
    return items
      .filter((item) => item.id !== targetId)
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: this.deleteItemFromTree(item.children, targetId),
          };
        }
        return item;
      });
  }

  /**
   * Find an item by ID in the tree
   */
  static findItemInTree(items: FileItem[], targetId: string): FileItem | null {
    for (const item of items) {
      if (item.id === targetId) return item;
      if (item.children) {
        const found = this.findItemInTree(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Move an item to a target folder (or root if targetFolderId is null)
   */
  static moveItemInTree(
    items: FileItem[],
    sourceId: string,
    targetFolderId: string | null
  ): FileItem[] {
    // 1. Find the item
    const itemToMove = this.findItemInTree(items, sourceId);
    if (!itemToMove) return items;

    // Avoid moving folder into itself or its own descendants
    if (itemToMove.isFolder && targetFolderId) {
      if (sourceId === targetFolderId) return items;
      const isDescendant = (folder: FileItem, childId: string): boolean => {
        if (!folder.children) return false;
        for (const c of folder.children) {
          if (c.id === childId) return true;
          if (c.children && isDescendant(c, childId)) return true;
        }
        return false;
      };
      if (isDescendant(itemToMove, targetFolderId)) return items;
    }

    // 2. Remove source item from tree
    const treeWithoutSource = this.deleteItemFromTree(items, sourceId);

    // Update path prefix based on target
    const updatedItem: FileItem = {
      ...itemToMove,
      path: targetFolderId ? `/${itemToMove.name}` : `/${itemToMove.name}`,
    };

    // 3. Insert into target folder or root
    if (!targetFolderId) {
      return [...treeWithoutSource, updatedItem];
    }

    const insertIntoFolder = (list: FileItem[]): FileItem[] => {
      return list.map((item) => {
        if (item.id === targetFolderId && item.isFolder) {
          const children = item.children || [];
          return {
            ...item,
            children: [...children, { ...updatedItem, path: `${item.path}/${updatedItem.name}` }],
          };
        }
        if (item.children) {
          return {
            ...item,
            children: insertIntoFolder(item.children),
          };
        }
        return item;
      });
    };

    return insertIntoFolder(treeWithoutSource);
  }
}
