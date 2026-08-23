import type { FileItem, ReviewResult } from '../types/ide';
import { AstAnalysisService } from './astAnalysisService';
import { OllamaService } from './ollamaService';

export class ReviewService {
  /**
   * Request targeted, single-finding iterative review for the current file
   */
  static async requestSingleIssueReview(file: FileItem): Promise<ReviewResult> {
    const activeModel = OllamaService.getActiveModel();

    // 1. Try local Ollama inference if running and model is available
    try {
      const ollamaHealth = await OllamaService.checkOllamaHealth();
      if (ollamaHealth.isRunning) {
        // Construct prompt enforcing single targeted snippet constraint and contextualizing with user's problem statement
        const systemPrompt = `You are Waypoint's AI Programming Mentor.
Rules:
1. Context: Use BOTH the user's provided Problem Statement and the current code to evaluate correctness and efficiency.
2. NEVER generate or rewrite the whole solution file.
3. Identify ONLY the single highest-priority optimization, Big-O bottleneck, or code cleanliness finding.
4. Return ONLY the critical targeted snippet to change (red deletion vs green insertion).
5. If the code is already optimal, clean, and satisfies the problem requirements, output "STATUS: OPTIMAL".
6. Return JSON format:
{
  "isOptimal": false,
  "title": "Short title (e.g. Use standard numeric algorithms)",
  "category": "performance" | "readability" | "maintainability",
  "severity": "high" | "medium" | "low",
  "explanation": "Why this change is needed based on the problem statement requirements",
  "benefit": "Time/Space complexity or clarity improvement",
  "originalCode": "lines to delete",
  "suggestedCode": "replacement lines"
}`;

        const userPrompt = `### PROBLEM STATEMENT (Context from Top Bar):
${file.problemStatement?.trim() || 'No problem statement provided.'}

### CURRENT FILE: ${file.name} (${file.language || 'code'})
\`\`\`
${file.content || ''}
\`\`\``;

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: activeModel,
            prompt: `${systemPrompt}\n\n${userPrompt}`,
            stream: false,
            format: 'json',
          }),
          signal: AbortSignal.timeout(3500),
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.response);

          if (parsed.isOptimal) {
            return {
              state: 'completed',
              isOptimal: true,
              overallAssessment: 'Review Complete. This is the best possible version to solve this problem. Well done!',
              findings: [],
            };
          }

          if (parsed.title && parsed.suggestedCode) {
            return {
              state: 'completed',
              isOptimal: false,
              overallAssessment: 'Found 1 targeted optimization for your solution:',
              findings: [
                {
                  id: `llm-${Date.now()}`,
                  category: parsed.category || 'performance',
                  severity: parsed.severity || 'medium',
                  title: parsed.title,
                  explanation: parsed.explanation || '',
                  benefit: parsed.benefit || '',
                  originalCode: parsed.originalCode,
                  suggestedCode: parsed.suggestedCode,
                },
              ],
            };
          }
        }
      }
    } catch (_) {
      // Fall through to deterministic AST/Heuristic engine
    }

    // 2. Deterministic AST / Heuristic Analyzer (Instant, Reliable, Offline-first)
    // Small artificial latency for natural review experience
    await new Promise((r) => setTimeout(r, 450));

    const analysis = AstAnalysisService.analyzeCode(file);

    if (analysis.isOptimal || !analysis.finding) {
      return {
        state: 'completed',
        isOptimal: true,
        overallAssessment: 'Review Complete. This is the best possible version to solve this problem. Well done!',
        findings: [],
      };
    }

    return {
      state: 'completed',
      isOptimal: false,
      overallAssessment: 'Found 1 targeted optimization for your solution:',
      findings: [analysis.finding],
    };
  }
}
