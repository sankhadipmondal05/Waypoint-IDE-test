export type SupportedLanguage = 'cpp' | 'c' | 'java' | 'python' | 'markdown' | 'json' | 'text';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  language?: SupportedLanguage;
  children?: FileItem[];
  content?: string;
  problemStatement?: string;
  isModified?: boolean;
}

export interface TabItem {
  id: string;
  name: string;
  path: string;
  language: SupportedLanguage;
  isModified: boolean;
}

export type ExecutionState = 'idle' | 'running' | 'success' | 'error';

export interface ExecutionResult {
  state: ExecutionState;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs?: number;
  errorLocation?: {
    file: string;
    line: number;
    column: number;
    message: string;
  };
  aiExplanation?: string;
}

export type ReviewState = 'idle' | 'reviewing' | 'completed';

export type FindingSeverity = 'low' | 'medium' | 'high';
export type FindingCategory = 'readability' | 'maintainability' | 'complexity' | 'performance' | 'convention';

export interface ReviewFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  explanation: string;
  originalCode?: string;
  suggestedCode?: string;
  benefit?: string;
}

export interface ReviewResult {
  state: ReviewState;
  overallAssessment?: string;
  isOptimal?: boolean;
  findings: ReviewFinding[];
}
