import React from 'react';
import { Play, Sparkles, Settings, FolderTree, Terminal, PanelsRightBottom, ArrowUpRight, FileQuestion, Sun, Moon } from 'lucide-react';
import appIcon from '../../assets/AppIcon.png';

interface TopBarProps {
  problemStatement: string;
  onProblemStatementChange: (newStatement: string) => void;
  activeFileName?: string;
  isRunning: boolean;
  isReviewing: boolean;
  onRun: () => void;
  onReview: () => void;
  showExplorer: boolean;
  onToggleExplorer: () => void;
  showOutput: boolean;
  onToggleOutput: () => void;
  showReview: boolean;
  onToggleReview: () => void;
  hasUpdate?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isProblemEmptyWarning?: boolean;
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  problemStatement,
  onProblemStatementChange,
  activeFileName,
  isRunning,
  isReviewing,
  onRun,
  onReview,
  showExplorer,
  onToggleExplorer,
  showOutput,
  onToggleOutput,
  showReview,
  onToggleReview,
  hasUpdate = true,
  theme,
  onToggleTheme,
  isProblemEmptyWarning = false,
  onOpenSettings,
}) => {
  return (
    <header className="topbar">
      {/* Left section: App Brand + File-specific Problem Statement Area */}
      <div className="topbar-left">
        <div className="app-brand" title="Waypoint IDE">
          <img src={appIcon} alt="Waypoint IDE" className="brand-icon-img" />
        </div>

        {/* Problem Statement input area per opened file */}
        <div
          className={`problem-statement-container ${isProblemEmptyWarning ? 'required-warning' : ''}`}
          title="Problem statement / prompt context for this file for AI Review & Explanation"
        >
          <label className="problem-label" htmlFor="problem-statement-input">
            <FileQuestion size={13} />
            <span>Problem:</span>
          </label>
          <input
            id="problem-statement-input"
            className="problem-input"
            type="text"
            value={problemStatement}
            onChange={(e) => onProblemStatementChange(e.target.value)}
            placeholder={
              isProblemEmptyWarning
                ? '⚠️ Problem statement is required for AI review!'
                : activeFileName
                  ? `Enter problem description for ${activeFileName}...`
                  : 'Open a file to enter problem description...'
            }
            disabled={!activeFileName}
            autoFocus={isProblemEmptyWarning}
          />
        </div>
      </div>

      {/* Center section: Primary Actions (Run, Review) */}
      <div className="topbar-center">
        <button
          className="btn-run"
          onClick={onRun}
          disabled={isRunning}
          title="Compile and run current file (F5)"
        >
          <Play size={13} fill="currentColor" />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>

        <button
          className="btn-review"
          onClick={onReview}
          disabled={isReviewing}
          title="Request AI Code Review on demand"
        >
          <Sparkles size={13} />
          <span>{isReviewing ? 'Analyzing...' : 'Review'}</span>
        </button>
      </div>

      {/* Right section: Leftmost Update Badge, Sliding Theme Switch, Panel Toggles, Settings */}
      <div className="topbar-right">
        {/* Update badge positioned at the left-most in right section */}
        {hasUpdate && (
          <button
            className="update-badge-btn"
            title="Waypoint IDE 1.1.0 update available"
            onClick={() => alert("Waypoint IDE 1.1.0 is available.\n\nClicking 'Download' opens the official download website.")}
          >
            <ArrowUpRight size={12} />
            <span>Update 1.1</span>
          </button>
        )}

        {/* Sliding toggle switch for Dark Mode / Light Mode */}
        <div
          className={`theme-switch ${theme === 'dark' ? 'dark' : 'light'}`}
          onClick={onToggleTheme}
          role="switch"
          aria-checked={theme === 'dark'}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          <span className="switch-icon-bg">
            <Sun size={11} />
            <Moon size={11} />
          </span>
          <div className="switch-thumb">
            {theme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
          </div>
        </div>

        {/* Panel toggle icons */}
        <button
          className={`btn-icon ${showExplorer ? 'active' : ''}`}
          onClick={onToggleExplorer}
          title="Toggle Project Explorer"
        >
          <FolderTree size={16} />
        </button>

        <button
          className={`btn-icon ${showOutput ? 'active' : ''}`}
          onClick={onToggleOutput}
          title="Toggle Output / Terminal Panel"
        >
          <Terminal size={16} />
        </button>

        <button
          className={`btn-icon ${showReview ? 'active' : ''}`}
          onClick={onToggleReview}
          title="Toggle AI Review Panel"
        >
          <PanelsRightBottom size={16} />
        </button>

        <button
          className="btn-icon"
          onClick={onOpenSettings}
          title="Settings & Setup Wizard (Configure Local AI / Compilers)"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
};
