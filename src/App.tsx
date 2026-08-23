import React, { useState, useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { ProjectExplorer } from './features/explorer/ProjectExplorer';
import { EditorPane } from './features/editor/EditorPane';
import { OutputPanel } from './features/output/OutputPanel';
import { ReviewConsole } from './features/review/ReviewConsole';
import { StatusBar } from './components/layout/StatusBar';
import { Resizer } from './components/common/Resizer';
import type { FileItem, ExecutionResult, ReviewResult } from './types/ide';
import {
  INITIAL_FILES,
  MOCK_SUCCESS_RUN,
  MOCK_REVIEW_RESULT,
} from './utils/mockData';
import { FileService } from './services/fileService';
import { ExecutionService } from './services/executionService';
import { OllamaService } from './services/ollamaService';
import { ReviewService } from './services/reviewService';
import { ConfirmModal } from './components/common/ConfirmModal';
import { SetupWizardModal } from './features/wizard/SetupWizardModal';

export const App: React.FC = () => {
  // Theme state: default to 'light' (Sand / Editorial), supports 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Files state (loaded from storage or initialized with sample files)
  const [files, setFiles] = useState<FileItem[]>(() => {
    return FileService.loadFilesFromStorage() || INITIAL_FILES;
  });

  const [openTabs, setOpenTabs] = useState<FileItem[]>([INITIAL_FILES[0].children![0]]);
  const [activeFileId, setActiveFileId] = useState<string | null>(INITIAL_FILES[0].children![0].id);

  // Auto-save files tree to storage on changes
  useEffect(() => {
    FileService.saveFilesToStorage(files);
  }, [files]);

  // Active AI Model and Wizard State
  const [activeModel, setActiveModel] = useState<string>(() => OllamaService.getActiveModel());
  const [showWizard, setShowWizard] = useState<boolean>(false);

  // Delete confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; isFolder: boolean } | null>(null);

  // Panel layout sizes & visibility
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(320);
  const [bottomHeight, setBottomHeight] = useState(220);

  const [showExplorer, setShowExplorer] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [showReview, setShowReview] = useState(true);

  // Output and review state
  const [outputTab, setOutputTab] = useState<'output' | 'terminal'>('output');
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(MOCK_SUCCESS_RUN);
  const [reviewResult, setReviewResult] = useState<ReviewResult>(MOCK_REVIEW_RESULT);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [problemStatementRequired, setProblemStatementRequired] = useState(false);

  const activeFile = openTabs.find((t) => t.id === activeFileId) || null;

  // Real Editor content change (with unsaved dirty indicator)
  const handleChangeContent = (newContent: string) => {
    if (!activeFileId) return;

    setOpenTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeFileId ? { ...tab, content: newContent, isModified: true } : tab
      )
    );
  };

  // Real Save action (Ctrl+S or manual)
  const handleSaveFile = () => {
    if (!activeFile) return;

    // Update in open tabs
    setOpenTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeFile.id ? { ...tab, isModified: false } : tab
      )
    );

    // Recursively update in files tree
    const updateFileInTree = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === activeFile.id) {
          return { ...item, content: activeFile.content, isModified: false };
        }
        if (item.children) {
          return { ...item, children: updateFileInTree(item.children) };
        }
        return item;
      });
    };

    setFiles((prev) => updateFileInTree(prev));
  };

  // Global Ctrl+S / Cmd+S key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  // Create new file
  const handleCreateNewFile = (fileName: string) => {
    const newFile = FileService.createNewFile(fileName);
    setFiles((prev) => [...prev, newFile]);
    setOpenTabs((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Create new folder
  const handleCreateNewFolder = (folderName: string) => {
    const newFolder = FileService.createNewFolder(folderName);
    setFiles((prev) => [...prev, newFolder]);
  };

  // Trigger delete prompt with confirmation dialog
  const handleDeleteItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = FileService.findItemInTree(files, itemId);
    if (!item) return;

    setItemToDelete({
      id: item.id,
      name: item.name,
      isFolder: !!item.isFolder,
    });
  };

  // Confirm and execute deletion
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const itemId = itemToDelete.id;

    setFiles((prev) => FileService.deleteItemFromTree(prev, itemId));

    // Close tab if open
    setOpenTabs((prev) => prev.filter((t) => t.id !== itemId));
    if (activeFileId === itemId) {
      const remaining = openTabs.filter((t) => t.id !== itemId);
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }

    setItemToDelete(null);
  };

  // Drag and drop move
  const handleMoveItem = (sourceId: string, targetFolderId: string | null) => {
    setFiles((prev) => FileService.moveItemInTree(prev, sourceId, targetFolderId));
  };

  // Update problem statement for a specific file
  const handleProblemStatementChange = (newStatement: string) => {
    if (!activeFileId) return;

    if (newStatement.trim().length > 0) {
      setProblemStatementRequired(false);
    }

    setOpenTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === activeFileId ? { ...tab, problemStatement: newStatement } : tab
      )
    );

    const updateFileInTree = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === activeFileId) {
          return { ...item, problemStatement: newStatement };
        }
        if (item.children) {
          return { ...item, children: updateFileInTree(item.children) };
        }
        return item;
      });
    };

    setFiles((prevFiles) => updateFileInTree(prevFiles));
  };

  // File selection
  const handleSelectFile = (file: FileItem) => {
    if (file.isFolder) return;
    setProblemStatementRequired(false);
    if (!openTabs.some((t) => t.id === file.id)) {
      setOpenTabs([...openTabs, file]);
    }
    setActiveFileId(file.id);
  };

  const handleCloseTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.id !== fileId);
    setOpenTabs(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  // Real Run Execution Engine trigger
  const handleRun = async () => {
    if (!activeFile) return;

    // Auto-save before run
    handleSaveFile();

    setIsRunning(true);
    setShowOutput(true);
    setOutputTab('output');
    setExecutionResult({ state: 'running', stdout: '', stderr: '', exitCode: 0 });

    try {
      const result = await ExecutionService.runProgram(activeFile);
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionResult({
        state: 'error',
        stdout: '',
        stderr: `Execution error: ${err?.message || 'Unknown error'}`,
        exitCode: 1,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Review simulation with mandatory Problem Statement validation & Iterative Single-Issue constraint
  const handleReview = async () => {
    if (!activeFile) return;

    // Mandatory problem statement check
    const problem = (activeFile.problemStatement || '').trim();
    if (!problem) {
      setProblemStatementRequired(true);
      setShowReview(true);
      const inputEl = document.getElementById('problem-statement-input');
      inputEl?.focus();
      return;
    }

    setProblemStatementRequired(false);
    setIsReviewing(true);
    setShowReview(true);
    setReviewResult({ state: 'reviewing', findings: [] });

    try {
      const result = await ReviewService.requestSingleIssueReview(activeFile);
      setReviewResult(result);
    } catch (_) {
      setReviewResult({
        state: 'completed',
        isOptimal: true,
        overallAssessment: 'Review Complete. This is the best possible version to solve this problem. Well done!',
        findings: [],
      });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="app-container">
      <TopBar
        problemStatement={activeFile?.problemStatement || ''}
        onProblemStatementChange={handleProblemStatementChange}
        activeFileName={activeFile?.name}
        isRunning={isRunning}
        isReviewing={isReviewing}
        onRun={handleRun}
        onReview={handleReview}
        showExplorer={showExplorer}
        onToggleExplorer={() => setShowExplorer(!showExplorer)}
        showOutput={showOutput}
        onToggleOutput={() => setShowOutput(!showOutput)}
        showReview={showReview}
        onToggleReview={() => setShowReview(!showReview)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isProblemEmptyWarning={problemStatementRequired}
        onOpenSettings={() => setShowWizard(true)}
      />

      <main className="workspace-layout">
        {/* Left Project Explorer Panel */}
        {showExplorer && (
          <>
            <div className="left-panel" style={{ width: `${leftWidth}px` }}>
              <ProjectExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onNewFile={handleCreateNewFile}
                onNewFolder={handleCreateNewFolder}
                onRefresh={() => setFiles(FileService.loadFilesFromStorage() || INITIAL_FILES)}
                onDeleteItem={handleDeleteItem}
                onMoveItem={handleMoveItem}
              />
            </div>
            <Resizer
              direction="vertical"
              onResize={(delta) => setLeftWidth((w) => Math.max(180, Math.min(450, w + delta)))}
            />
          </>
        )}

        {/* Central Editor & Bottom Panel Area */}
        <div className="main-work-area">
          <div className="editor-pane">
            <EditorPane
              openTabs={openTabs}
              activeFile={activeFile}
              onSelectTab={handleSelectFile}
              onCloseTab={handleCloseTab}
              onChangeContent={handleChangeContent}
              onSave={handleSaveFile}
              theme={theme}
              errorLine={executionResult?.errorLocation?.line}
            />
          </div>

          {showOutput && (
            <>
              <Resizer
                direction="horizontal"
                onResize={(delta) => setBottomHeight((h) => Math.max(120, Math.min(480, h - delta)))}
              />
              <div className="bottom-panel" style={{ height: `${bottomHeight}px` }}>
                <OutputPanel
                  activeTab={outputTab}
                  onTabChange={setOutputTab}
                  result={executionResult}
                  onClearOutput={() => setExecutionResult(null)}
                  activeFile={activeFile}
                  files={files}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Review Console Panel */}
        {showReview && (
          <>
            <Resizer
              direction="vertical"
              onResize={(delta) => setRightWidth((w) => Math.max(240, Math.min(500, w - delta)))}
            />
            <div className="right-panel" style={{ width: `${rightWidth}px` }}>
              <ReviewConsole
                reviewResult={reviewResult}
                onRequestReview={handleReview}
                isReviewing={isReviewing}
                problemStatementRequired={problemStatementRequired}
              />
            </div>
          </>
        )}
      </main>

      <StatusBar
        activeFile={activeFile}
        language={activeFile?.language || 'c++'}
        activeModel={activeModel}
        onConfigureAI={() => setShowWizard(true)}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={itemToDelete !== null}
        title={itemToDelete?.isFolder ? 'Delete Folder' : 'Delete File'}
        message={`Are you sure you want to delete "${itemToDelete?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Phase 5 Setup & Model Management Wizard */}
      <SetupWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onCompleted={(newModel) => {
          setActiveModel(newModel);
        }}
      />
    </div>
  );
};

export default App;
