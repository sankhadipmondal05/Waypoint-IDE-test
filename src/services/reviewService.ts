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
        // Construct prompt enforcing single targeted snippet constraint
        const systemPrompt = `You are Waypoint's AI Programming Mentor.
Rules:
1. NEVER generate or rewrite the whole solution file.
2. Identify ONLY the single highest-priority optimization or code cleanliness finding.
3. Return ONLY the critical targeted snippet to change (red deletion vs green insertion).
4. If the code is already optimal and clean, output "STATUS: OPTIMAL".
5. Return JSON format:
{
  "isOptimal": false,
  "title": "Short title",
  "category": "performance" | "readability" | "maintainability",
  "severity": "high" | "medium" | "low",
  "explanation": "Why this change is needed",
  "benefit": "Big-O or clarity benefit",
  "originalCode": "lines to delete",
  "suggestedCode": "replacement lines"
}`;

        const userPrompt = `File: ${file.name}
Language: ${file.language || 'cpp'}
Problem Statement: ${file.problemStatement || 'Not provided'}

Code:
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
