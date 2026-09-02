import React from 'react';
import { 
  Plus, 
  FileCode, 
  Sparkles, 
  Play, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Keyboard, 
  Zap
} from 'lucide-react';
import appIcon from '../../assets/AppIcon.png';

interface WelcomeTabProps {
  onNewFile: (name: string) => void;
  onOpenWizard: () => void;
}

export const WelcomeTab: React.FC<WelcomeTabProps> = ({
  onNewFile,
  onOpenWizard,
}) => {
  return (
    <div className="welcome-screen-container">
      <div className="welcome-content">
        {/* Hero Header */}
        <div className="welcome-hero">
          <div className="welcome-brand-badge">
            <img src={appIcon} alt="Waypoint IDE" className="welcome-logo-img" />
            <div className="welcome-badge-text">
              <span className="welcome-badge-title">Waypoint IDE</span>
              <span className="welcome-badge-version">v0.1.0 • Lab Edition</span>
            </div>
          </div>

          <h1 className="welcome-headline">Welcome to Waypoint IDE</h1>
          <p className="welcome-tagline">
            A fast, distraction-free desktop programming studio engineered with native local compilers and on-device AI intelligence.
          </p>
        </div>

        {/* Main Grid: Start Actions & Features */}
        <div className="welcome-grid">
          {/* Left Column: Quick Start */}
          <div className="welcome-section">
            <h3 className="welcome-section-heading">
              <Plus size={15} />
              <span>Start Programming</span>
            </h3>

            <div className="welcome-action-list">
              <button 
                className="welcome-action-card primary"
                onClick={() => onNewFile('main.cpp')}
              >
                <div className="action-card-icon cpp">
                  <FileCode size={18} />
                </div>
                <div className="action-card-info">
                  <strong>New C++ Source</strong>
                  <span>Create <code>main.cpp</code> with standard template</span>
                </div>
              </button>

              <button 
                className="welcome-action-card primary"
                onClick={() => onNewFile('solution.py')}
              >
                <div className="action-card-icon py">
                  <FileCode size={18} />
                </div>
                <div className="action-card-info">
                  <strong>New Python Script</strong>
                  <span>Create <code>solution.py</code> for algorithms & scripts</span>
                </div>
              </button>

              <button 
                className="welcome-action-card primary"
                onClick={() => onNewFile('Main.java')}
              >
                <div className="action-card-icon java">
                  <FileCode size={18} />
                </div>
                <div className="action-card-info">
                  <strong>New Java Class</strong>
                  <span>Create <code>Main.java</code> with boilerplate</span>
                </div>
              </button>

              <button 
                className="welcome-action-card primary"
                onClick={() => onNewFile('main.c')}
              >
                <div className="action-card-icon c">
                  <FileCode size={18} />
                </div>
                <div className="action-card-info">
                  <strong>New C Program</strong>
                  <span>Create <code>main.c</code> with GCC support</span>
                </div>
              </button>
            </div>

            {/* Keyboard Shortcuts summary */}
            <div className="welcome-shortcuts-card">
              <div className="shortcuts-header">
                <Keyboard size={13} />
                <span>Essential Shortcuts</span>
              </div>
              <div className="shortcuts-grid">
                <div className="shortcut-row">
                  <span>Run / Compile Active Code</span>
                  <kbd>F5</kbd>
                </div>
                <div className="shortcut-row">
                  <span>Save File to Storage / Disk</span>
                  <kbd>Ctrl</kbd> + <kbd>S</kbd>
                </div>
                <div className="shortcut-row">
                  <span>Toggle Local AI Review</span>
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features Overview */}
          <div className="welcome-section">
            <h3 className="welcome-section-heading">
              <Zap size={15} />
              <span>Studio Capabilities</span>
            </h3>

            <div className="welcome-features-list">
              <div className="welcome-feature-item">
                <div className="feature-item-icon">
                  <Play size={16} color="var(--accent-color)" />
                </div>
                <div className="feature-item-text">
                  <strong>Zero-Delay Direct Execution</strong>
                  <p>Runs your latest code changes instantly without forcing repeated manual saves.</p>
                </div>
              </div>

              <div className="welcome-feature-item">
                <div className="feature-item-icon">
                  <Layers size={16} color="var(--accent-color)" />
                </div>
                <div className="feature-item-text">
                  <strong>Native Compiler Toolchains</strong>
                  <p>Direct integration with GCC, G++, OpenJDK 17, and Python 3 configured in your system environment.</p>
                </div>
              </div>

              <div className="welcome-feature-item">
                <div className="feature-item-icon">
                  <Cpu size={16} color="var(--accent-color)" />
                </div>
                <div className="feature-item-text">
                  <strong>100% Offline Local AI Review</strong>
                  <p>Connected directly to Ollama for privacy-focused code explanation and single-issue reviews.</p>
                </div>
              </div>

              <div className="welcome-feature-item">
                <div className="feature-item-icon">
                  <ShieldCheck size={16} color="var(--accent-color)" />
                </div>
                <div className="feature-item-text">
                  <strong>Lab & Offline Ready</strong>
                  <p>All toolchains and AI inference run locally on-device without any cloud data transmission.</p>
                </div>
              </div>
            </div>

            {/* Quick Setup Wizard Trigger */}
            <div className="welcome-wizard-banner" onClick={onOpenWizard}>
              <Sparkles size={16} color="var(--accent-color)" />
              <div className="wizard-banner-text">
                <strong>Need to configure your environment?</strong>
                <span>Click here to open the Toolchain & Local AI Setup Wizard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
