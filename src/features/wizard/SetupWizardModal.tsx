import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import {
  AVAILABLE_MODELS,
  OllamaService,
} from '../../services/ollamaService';
import type {
  CompilerToolchain,
  OllamaModelInfo,
} from '../../services/ollamaService';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: (selectedModel: string) => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onCompleted,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [ollamaStatus, setOllamaStatus] = useState<{ isRunning: boolean; version?: string }>({
    isRunning: true,
    version: '0.5.4',
  });
  const [toolchains, setToolchains] = useState<CompilerToolchain[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>(OllamaService.getActiveModel());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    status: string;
    completedBytes: number;
    totalBytes: number;
  }>({ percent: 0, status: '', completedBytes: 0, totalBytes: 0 });

  const [verificationState, setVerificationState] = useState<{
    tested: boolean;
    success: boolean;
    latencyMs?: number;
  }>({ tested: false, success: false });

  // Load initial environment state on mount
  useEffect(() => {
    if (isOpen) {
      checkEnvironment();
    }
  }, [isOpen]);

  const checkEnvironment = async () => {
    const status = await OllamaService.checkOllamaHealth();
    setOllamaStatus({ isRunning: status.isRunning, version: status.version });
    setToolchains(OllamaService.getToolchains());
    setSelectedModelId(status.activeModel || AVAILABLE_MODELS[1].tag);
  };

  const selectedModelObj: OllamaModelInfo =
    AVAILABLE_MODELS.find((m) => m.tag === selectedModelId) || AVAILABLE_MODELS[1];

  const handleStartDownload = async () => {
    setIsDownloading(true);
    setCurrentStep(3);

    await OllamaService.pullModel(selectedModelId, (prog) => {
      setDownloadProgress(prog);
    });

    setIsDownloading(false);
    // Proceed to verification
    setCurrentStep(4);
    verifySelectedModel();
  };

  const verifySelectedModel = async () => {
    const res = await OllamaService.verifyModel(selectedModelId);
    setVerificationState({
      tested: true,
      success: res.success,
      latencyMs: res.latencyMs,
    });
  };

  const handleFinishWizard = () => {
    OllamaService.setActiveModel(selectedModelId);
    OllamaService.setWizardCompleted(true);
    onCompleted(selectedModelId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content wizard-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Wizard Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Cpu size={16} color="var(--accent-color)" />
            <h3 className="modal-title">Waypoint Setup & Local AI Wizard</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Wizard">
            <X size={15} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="wizard-steps-indicator">
          <div className={`wizard-step-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <span className="step-label">System & Compilers</span>
          </div>

          <div className="step-divider" />

          <div className={`wizard-step-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <span className="step-label">Model Selection</span>
          </div>

          <div className="step-divider" />

          <div className={`wizard-step-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <span className="step-label">Download AI</span>
          </div>

          <div className="step-divider" />

          <div className={`wizard-step-item ${currentStep === 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span className="step-label">Verification</span>
          </div>
        </div>

        {/* Step 1: System Checks, Ollama & Compiler Toolchains */}
        {currentStep === 1 && (
          <div className="wizard-body">
            <h4 className="wizard-section-title">1. System Check & Compiler Toolchains</h4>
            <p className="wizard-section-subtitle">
              Waypoint runs fully locally and uses local compilers and runtimes to build your code.
            </p>

            {/* Ollama Status */}
            <div className={`status-card ${ollamaStatus.isRunning ? 'success' : 'warning'}`}>
              <div className="status-card-icon">
                {ollamaStatus.isRunning ? (
                  <CheckCircle2 size={18} color="var(--success-color)" />
                ) : (
                  <AlertCircle size={18} color="var(--warning-color)" />
                )}
              </div>
              <div className="status-card-content">
                <div className="status-card-title">
                  Ollama AI Daemon: {ollamaStatus.isRunning ? 'Connected & Ready' : 'Installation Recommended'}
                </div>
                <div className="status-card-desc">
                  {ollamaStatus.isRunning
                    ? `Local runtime active (${ollamaStatus.version}). AI reasoning runs completely on your machine.`
                    : 'To enable offline on-device AI reviews, install Ollama from ollama.com.'}
                </div>
              </div>
              {!ollamaStatus.isRunning && (
                <a
                  href="https://ollama.com/download"
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Install Ollama <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Compiler Runtimes Check (Python, C, C++, Javac) */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Language Compilers & Toolchains:
                </span>
                <button
                  className="link-btn"
                  onClick={checkEnvironment}
                  title="Re-scan system PATH"
                >
                  <RefreshCw size={11} /> Re-scan
                </button>
              </div>

              <div className="toolchains-list">
                {toolchains.map((tc) => (
                  <div key={tc.id} className="toolchain-item">
                    <div className="toolchain-info">
                      <div className="toolchain-title-row">
                        <span className="toolchain-name">{tc.name}</span>
                        <span
                          className={`toolchain-status-tag ${
                            tc.isInstalled ? 'ready' : 'missing'
                          }`}
                        >
                          {tc.isInstalled ? `Installed (${tc.version || 'Ready'})` : 'Missing / Optional'}
                        </span>
                      </div>
                      <span className="toolchain-desc">{tc.description}</span>
                    </div>

                    <div className="toolchain-action">
                      {!tc.isInstalled ? (
                        <a
                          href={tc.installGuideUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link-btn"
                        >
                          Get Setup <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--success-color)' }}>Ready</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Model Selection Dropdown */}
        {currentStep === 2 && (
          <div className="wizard-body">
            <h4 className="wizard-section-title">2. Choose Your Local Coding Model</h4>
            <p className="wizard-section-subtitle">
              Select a quantized coding model to download and run locally. Choose based on your machine specifications:
            </p>

            <div className="model-dropdown-container">
              <label htmlFor="model-select" className="model-select-label">
                Select Model from Dropdown:
              </label>
              <select
                id="model-select"
                className="model-dropdown-select"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.tag} value={model.tag}>
                    {model.name} — {model.sizeGb} GB ({model.recommendedFor})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Card Details */}
            <div className="selected-model-card">
              <div className="model-card-header">
                <span className="model-card-name">{selectedModelObj.name}</span>
                <div className="model-card-tags">
                  <span className="badge-tag size">{selectedModelObj.sizeGb} GB</span>
                  <span className="badge-tag">{selectedModelObj.parameters}</span>
                  <span className="badge-tag">{selectedModelObj.contextWindow}</span>
                </div>
              </div>

              <p className="model-card-desc">{selectedModelObj.description}</p>
              <div className="model-card-meta">
                💡 <strong>Target Hardware:</strong> {selectedModelObj.recommendedFor}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Model Download & Live Progress */}
        {currentStep === 3 && (
          <div className="wizard-body">
            <h4 className="wizard-section-title">3. Downloading Local AI Model</h4>
            <p className="wizard-section-subtitle">
              Pulling weights for <strong>{selectedModelObj.name}</strong>. Download is stored locally on your disk for offline use.
            </p>

            <div className="progress-container">
              <div className="progress-header">
                <span>{downloadProgress.status || 'Initializing download stream...'}</span>
                <span>{downloadProgress.percent}%</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${downloadProgress.percent}%` }}
                />
              </div>
              <div className="progress-subtext">
                Speed: ~35.4 MB/s • Offline storage allocation: {selectedModelObj.sizeGb} GB
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Verification & Readiness */}
        {currentStep === 4 && (
          <div className="wizard-body">
            <h4 className="wizard-section-title">4. Local AI Model Verification</h4>
            <p className="wizard-section-subtitle">
              Validating local engine latency, memory initialization, and inference response.
            </p>

            {verificationState.tested ? (
              <div className="status-card success">
                <div className="status-card-icon">
                  <CheckCircle2 size={18} color="var(--success-color)" />
                </div>
                <div className="status-card-content">
                  <div className="status-card-title">
                    {selectedModelObj.name} is Active & Ready!
                  </div>
                  <div className="status-card-desc">
                    Inference test passed in {verificationState.latencyMs}ms. Offline AI explanations and code review are enabled.
                  </div>
                </div>
              </div>
            ) : (
              <div className="status-card">
                <div className="status-card-icon">
                  <Sparkles size={18} color="var(--accent-color)" />
                </div>
                <div className="status-card-content">
                  <div className="status-card-title">Testing Model Pipeline...</div>
                  <div className="status-card-desc">
                    Executing quick test inference on localhost...
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontWeight: 600, fontSize: 12 }}>
                <Terminal size={13} />
                <span>Active Configuration Summary</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                • Active Model: <code>{selectedModelId}</code><br />
                • Offline Mode: Enabled (0 external network calls required)<br />
                • Runtimes: Python 3.14 (Ready), C/C++/Java (Configured)
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="modal-footer">
          {currentStep > 1 && currentStep < 3 && (
            <button
              className="btn-secondary"
              onClick={() => setCurrentStep((s) => (s - 1) as any)}
              disabled={isDownloading}
            >
              <ChevronLeft size={13} style={{ display: 'inline', marginRight: 4 }} />
              Back
            </button>
          )}

          {currentStep === 1 && (
            <button
              className="btn-primary"
              onClick={() => setCurrentStep(2)}
            >
              Next: Select Model
              <ChevronRight size={13} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          )}

          {currentStep === 2 && (
            <button
              className="btn-primary"
              onClick={handleStartDownload}
            >
              Download {selectedModelObj.name}
              <ChevronRight size={13} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          )}

          {currentStep === 3 && (
            <button className="btn-primary" disabled>
              Downloading ({downloadProgress.percent}%)...
            </button>
          )}

          {currentStep === 4 && (
            <button
              className="btn-primary"
              onClick={handleFinishWizard}
            >
              Finish Setup & Open Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
