import React from 'react';
import { Sparkles, CheckCircle2, ChevronRight, AlertCircle, FileQuestion } from 'lucide-react';
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
  return (
    <aside className="review-panel">
      <div className="review-header">
        <span className="review-title">AI Code Review</span>
        <button
          className="btn-icon"
          onClick={onRequestReview}
          disabled={isReviewing}
          title="Re-run review"
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
              Click <strong>Review</strong> in the top bar to get targeted feedback on readability, performance, and best practices.
            </p>
          </div>
        )}

        {reviewResult.state === 'reviewing' && (
          <div className="review-state-card">
            <div className="status-dot running" style={{ width: 12, height: 12 }} />
            <div className="review-state-title">Analyzing your solution...</div>
            <p className="review-state-desc">
              Examining AST, syntax structure, and performance metrics locally via Ollama.
            </p>
          </div>
        )}

        {reviewResult.state === 'completed' && (
          <>
            <div className="review-summary-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="var(--success-color)" />
                <span className="review-summary-text">Review Complete</span>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                {reviewResult.findings.length} findings
              </span>
            </div>

            {reviewResult.overallAssessment && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {reviewResult.overallAssessment}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviewResult.findings.map((finding: ReviewFinding) => (
                <div key={finding.id} className="finding-card">
                  <div className="finding-header">
                    <div className="finding-meta">
                      <span className={`severity-tag severity-${finding.severity}`}>
                        {finding.severity}
                      </span>
                      <span className="category-tag">{finding.category}</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>

                  <div className="finding-body">
                    <div className="finding-title">{finding.title}</div>
                    <div className="finding-explanation">{finding.explanation}</div>

                    {finding.originalCode && finding.suggestedCode && (
                      <div className="code-diff-mini">
                        <div className="diff-original">
                          - {finding.originalCode}
                        </div>
                        <div className="diff-suggested">
                          + {finding.suggestedCode}
                        </div>
                      </div>
                    )}

                    {finding.benefit && (
                      <div className="finding-benefit">
                        💡 <strong>Benefit:</strong> {finding.benefit}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
