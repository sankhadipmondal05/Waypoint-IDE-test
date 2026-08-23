import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, FileQuestion, Copy, Check, Award, ArrowRight } from 'lucide-react';
import type { ReviewResult, ReviewFinding } from '../../types/ide';

interface ReviewConsoleProps {
  reviewResult: ReviewResult;
  onRequestReview: () => void;
  isReviewing: boolean;
  problemStatementRequired?: boolean;
}

export const ReviewConsole: React.FC<ReviewConsoleProps> = ({
  reviewResult,
  onRequestReview,
  isReviewing,
  problemStatementRequired = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopySnippet = (snippet: string, findingId: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedId(findingId);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <aside className="review-panel">
      <div className="review-header">
        <span className="review-title">AI Code Review</span>
        <button
          className="btn-icon"
          onClick={onRequestReview}
          disabled={isReviewing}
          title="Re-run review on current code"
        >
          <Sparkles size={14} />
        </button>
      </div>

      <div className="review-content">
        {problemStatementRequired && (
          <div className="review-warning-card">
            <div className="warning-title">
              <AlertCircle size={15} color="var(--error-color)" />
              <span>Problem Statement Required</span>
            </div>
            <p className="warning-desc">
              Please enter the problem statement or requirements for this file in the top bar before requesting an AI code review.
            </p>
            <button
              className="focus-problem-btn"
              onClick={() => {
                const el = document.getElementById('problem-statement-input');
                el?.focus();
              }}
            >
              <FileQuestion size={13} />
              <span>Enter Problem Statement</span>
            </button>
          </div>
        )}

        {reviewResult.state === 'idle' && (
          <div className="review-state-card">
            <Sparkles size={24} color="var(--text-secondary)" />
            <div className="review-state-title">Ready to review your solution</div>
            <p className="review-state-desc">
              Click <strong>Review</strong> in the top bar to get targeted, single-issue feedback focusing on algorithm performance and clean code.
            </p>
          </div>
        )}

        {reviewResult.state === 'reviewing' && (
          <div className="review-state-card">
            <div className="status-dot running" style={{ width: 12, height: 12 }} />
            <div className="review-state-title">Analyzing your solution...</div>
            <p className="review-state-desc">
              Examining AST, loop structures, and algorithmic complexity constraint rules.
            </p>
          </div>
        )}

        {reviewResult.state === 'completed' && (
          <>
            {/* 1. Optimal Solution Completed State */}
            {reviewResult.isOptimal || reviewResult.findings.length === 0 ? (
              <div className="optimal-review-card">
                <div className="optimal-icon-badge">
                  <Award size={28} color="var(--success-color)" />
                </div>
                <div className="optimal-title">Review Complete</div>
                <p className="optimal-desc">
                  This is the best possible version to solve this problem. Well done!
                </p>
                <div className="optimal-checks">
                  <div className="check-line">
                    <CheckCircle2 size={13} color="var(--success-color)" />
                    <span>Algorithmic complexity is optimal</span>
                  </div>
                  <div className="check-line">
                    <CheckCircle2 size={13} color="var(--success-color)" />
                    <span>Memory allocations & references are clean</span>
                  </div>
                  <div className="check-line">
                    <CheckCircle2 size={13} color="var(--success-color)" />
                    <span>Language idioms and safety guidelines met</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 2. Single Targeted Finding Iteration Card */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="iteration-badge-header">
                  <span className="iteration-badge-tag">Targeted Optimization</span>
                  <span className="iteration-badge-sub">Step 1 of progressive review</span>
                </div>

                {reviewResult.findings.map((finding: ReviewFinding) => (
                  <div key={finding.id} className="finding-card">
                    <div className="finding-header">
                      <div className="finding-meta">
                        <span className={`severity-tag severity-${finding.severity}`}>
                          {finding.severity}
                        </span>
                        <span className="category-tag">{finding.category}</span>
                      </div>
                      <span className="finding-priority">High Priority</span>
                    </div>

                    <div className="finding-body">
                      <div className="finding-title">{finding.title}</div>
                      <div className="finding-explanation">{finding.explanation}</div>

                      {finding.originalCode && finding.suggestedCode && (
                        <div className="diff-container">
                          <div className="diff-header-bar">
                            <span className="diff-header-title">Targeted Logic Diff</span>
                            <button
                              className="copy-snippet-btn"
                              onClick={() => handleCopySnippet(finding.suggestedCode || '', finding.id)}
                              title="Copy replacement snippet only"
                            >
                              {copiedId === finding.id ? (
                                <>
                                  <Check size={11} color="var(--success-color)" />
                                  <span style={{ color: 'var(--success-color)' }}>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy Snippet</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="code-diff-mini">
                            <div className="diff-original">
                              <span className="diff-marker">-</span>
                              <pre className="diff-code-text">{finding.originalCode}</pre>
                            </div>
                            <div className="diff-suggested">
                              <span className="diff-marker">+</span>
                              <pre className="diff-code-text">{finding.suggestedCode}</pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {finding.benefit && (
                        <div className="finding-benefit">
                          💡 <strong>Impact:</strong> {finding.benefit}
                        </div>
                      )}

                      <div className="integration-hint">
                        <ArrowRight size={13} />
                        <span>Apply this snippet to your code and click <strong>Review</strong> again to verify.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
