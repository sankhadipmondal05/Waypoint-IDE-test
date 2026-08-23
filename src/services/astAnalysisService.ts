import type { FileItem, ReviewFinding, SupportedLanguage } from '../types/ide';

export interface CodeAnalysisRule {
  id: string;
  language: SupportedLanguage;
  category: 'performance' | 'readability' | 'maintainability' | 'complexity' | 'convention';
  severity: 'high' | 'medium' | 'low';
  title: string;
  check: (code: string, file: FileItem) => { matched: boolean; originalCode?: string; suggestedCode?: string; explanation?: string; benefit?: string } | null;
}

export class AstAnalysisService {
  /**
   * Catalog of AST and Heuristic rules for C++, Python, Java, and C
   */
  private static RULES: CodeAnalysisRule[] = [
    // -------------------------------------------------------------
    // C++ RULES
    // -------------------------------------------------------------
    {
      id: 'cpp-accumulate',
      language: 'cpp',
      category: 'readability',
      severity: 'medium',
      title: 'Use std::accumulate for sum aggregation',
      check: (code) => {
        // Detect manual accumulation for-loop: for (int num : numbers) sum += num;
        const loopPattern = /int\s+sum\s*=\s*0\s*;[\s\S]*?for\s*\(\s*(?:int|auto|const\s+int&)\s+([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_]+)\s*\)\s*\{[\s\S]*?sum\s*\+=\s*\1\s*;[\s\S]*?\}/;
        const match = code.match(loopPattern);
        if (match) {
          const vecName = match[2];
          return {
            matched: true,
            originalCode: match[0],
            suggestedCode: `int sum = std::accumulate(${vecName}.begin(), ${vecName}.end(), 0);`,
            explanation: `Instead of an explicit iterative for-loop with manual variable accumulation, using \`std::accumulate\` from \`<numeric>\` expresses the algorithmic intent directly and eliminates potential off-by-one errors.`,
            benefit: 'Improves readability, prevents manual loop index bugs, and allows compiler vectorization.',
          };
        }
        return null;
      },
    },
    {
      id: 'cpp-pass-by-const-ref',
      language: 'cpp',
      category: 'performance',
      severity: 'high',
      title: 'Pass vector/string container by const reference',
      check: (code) => {
        // Detect pass by value vector or string parameter: (std::vector<int> nums) or (vector<int> nums) or (std::string str)
        const paramPattern = /(?:void|int|double|bool|auto)\s+([a-zA-Z0-9_]+)\s*\(\s*(?:std::)?(vector<[a-zA-Z0-9_]+>|string)\s+([a-zA-Z0-9_]+)\s*\)/;
        const match = code.match(paramPattern);
        if (match) {
          const type = match[2];
          const varName = match[3];
          return {
            matched: true,
            originalCode: `${type} ${varName}`,
            suggestedCode: `const std::${type}& ${varName}`,
            explanation: `Passing heavy containers like \`std::vector\` or \`std::string\` by value forces a full deep copy of every element on every function call. Passing by \`const &\` passes only a pointer/reference with zero copy overhead.`,
            benefit: 'Reduces time complexity of parameter passing from O(N) memory allocation to O(1).',
          };
        }
        return null;
      },
    },
    {
      id: 'cpp-endl-performance',
      language: 'cpp',
      category: 'performance',
      severity: 'low',
      title: "Use '\\n' instead of std::endl to avoid unnecessary stream flushing",
      check: (code) => {
        if (code.includes('std::endl') || code.includes('<< endl')) {
          return {
            matched: true,
            originalCode: `std::cout << ... << std::endl;`,
            suggestedCode: `std::cout << ... << '\\n';`,
            explanation: `\`std::endl\` outputs a newline and forces a synchronous buffer flush to the operating system on every call. In tight loops or competitive programming, this causes severe I/O slowdowns.`,
            benefit: 'Significantly speeds up terminal output by allowing the I/O buffer to flush naturally.',
          };
        }
        return null;
      },
    },

    // -------------------------------------------------------------
    // PYTHON RULES
    // -------------------------------------------------------------
    {
      id: 'py-range-len-indexing',
      language: 'python',
      category: 'readability',
      severity: 'medium',
      title: 'Iterate directly over elements instead of range(len(...))',
      check: (code) => {
        const rangeLenPattern = /for\s+([a-zA-Z0-9_]+)\s+in\s+range\s*\(\s*len\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\)\s*:/;
        const match = code.match(rangeLenPattern);
        if (match) {
          const idx = match[1];
          const listName = match[2];
          return {
            matched: true,
            originalCode: `for ${idx} in range(len(${listName})):`,
            suggestedCode: `for item in ${listName}:\n# or: for ${idx}, item in enumerate(${listName}):`,
            explanation: `Using \`range(len(...))\` requires manual indexing with subscript syntax (\`${listName}[${idx}]\`). Python provides direct sequence iteration and \`enumerate()\` which are more idiomatic and prevent index error crashes.`,
            benefit: 'Cleaner Pythonic code, eliminates off-by-one and IndexError risks.',
          };
        }
        return null;
      },
    },
    {
      id: 'py-manual-max-min',
      language: 'python',
      category: 'performance',
      severity: 'low',
      title: 'Leverage built-in max() / min() aggregation',
      check: (code) => {
        // If problem statement explicitly allows or is asking for max/min logic
        if (code.includes('def find_max(') && code.includes('current_max = numbers[0]')) {
          return {
            matched: true,
            originalCode: `current_max = numbers[0]\nfor num in numbers:\n    if num > current_max:\n        current_max = num\nreturn current_max`,
            suggestedCode: `return max(numbers) if numbers else None`,
            explanation: `Python's built-in \`max()\` is implemented in optimized C runtime and executes up to 10x faster than an interpreted bytecode for-loop.`,
            benefit: 'Reduces code size, handles empty sequences gracefully, and runs at native speed.',
          };
        }
        return null;
      },
    },
    {
      id: 'py-string-join',
      language: 'python',
      category: 'performance',
      severity: 'high',
      title: "Use ''.join() instead of string concatenation in a loop",
      check: (code) => {
        const strConcatPattern = /([a-zA-Z0-9_]+)\s*=\s*["']["'][\s\S]*?for\s+[\s\S]*?\1\s*\+=\s*/;
        const match = code.match(strConcatPattern);
        if (match) {
          const varName = match[1];
          return {
            matched: true,
            originalCode: `${varName} += item`,
            suggestedCode: `${varName} = "".join(items)`,
            explanation: `In Python, strings are immutable. Using \`+=\` inside a loop allocates a new string in memory on every iteration, leading to O(N²) quadratic time complexity. \`"".join()\` computes the final length in advance and builds the string in O(N).`,
            benefit: 'Improves execution time from quadratic O(N²) to linear O(N).',
          };
        }
        return null;
      },
    },

    // -------------------------------------------------------------
    // JAVA RULES
    // -------------------------------------------------------------
    {
      id: 'java-stringbuilder',
      language: 'java',
      category: 'performance',
      severity: 'high',
      title: 'Use StringBuilder for string concatenation in loops',
      check: (code) => {
        if (code.includes('for (') && code.includes('String ') && code.includes('+= ')) {
          return {
            matched: true,
            originalCode: `String result = "";\nfor (String s : list) {\n    result += s;\n}`,
            suggestedCode: `StringBuilder sb = new StringBuilder();\nfor (String s : list) {\n    sb.append(s);\n}\nString result = sb.toString();`,
            explanation: `In Java, concatenating strings with \`+=\` inside a loop instantiates a new \`StringBuilder\` and converts it to a \`String\` on each cycle, causing massive garbage collector pressure and O(N²) overhead.`,
            benefit: 'Reduces time complexity from O(N²) to O(N) and prevents GC memory churn.',
          };
        }
        return null;
      },
    },
    {
      id: 'java-enhanced-for',
      language: 'java',
      category: 'readability',
      severity: 'medium',
      title: 'Replace indexed for-loop with enhanced for-each loop',
      check: (code) => {
        const javaForPattern = /for\s*\(\s*int\s+([a-zA-Z0-9_]+)\s*=\s*0\s*;\s*\1\s*<\s*([a-zA-Z0-9_]+)\.(?:size\(\)|length)\s*;\s*\1\+\+\s*\)/;
        const match = code.match(javaForPattern);
        if (match) {
          const idx = match[1];
          const arr = match[2];
          return {
            matched: true,
            originalCode: match[0],
            suggestedCode: `for (var item : ${arr}) { ... }`,
            explanation: `Indexed for-loops with index variables (\`int ${idx} = 0\`) add boilerplate and risk \`ArrayIndexOutOfBoundsException\`. Java's enhanced for-each loop is cleaner and more declarative.`,
            benefit: 'Eliminates index bounds errors and simplifies collection traversal.',
          };
        }
        return null;
      },
    },

    // -------------------------------------------------------------
    // C RULES
    // -------------------------------------------------------------
    {
      id: 'c-safe-input',
      language: 'c',
      category: 'maintainability',
      severity: 'high',
      title: 'Use fgets() instead of unsafe gets() or unbounded scanf()',
      check: (code) => {
        if (code.includes('gets(') || (code.includes('scanf("%s"') && !code.includes('fgets('))) {
          return {
            matched: true,
            originalCode: `gets(buffer);`,
            suggestedCode: `fgets(buffer, sizeof(buffer), stdin);`,
            explanation: `\`gets()\` and unbounded \`scanf("%s")\` do not perform buffer length boundary checks, making programs vulnerable to buffer overflow crashes and memory corruption.`,
            benefit: 'Prevents segmentation faults and buffer overflow security vulnerabilities.',
          };
        }
        return null;
      },
    },
  ];

  /**
   * Run single-finding analysis on code
   */
  static analyzeCode(file: FileItem): { finding: ReviewFinding | null; isOptimal: boolean } {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let lang: SupportedLanguage = 'text';

    if (ext === 'cpp' || ext === 'cxx' || ext === 'cc') lang = 'cpp';
    else if (ext === 'py') lang = 'python';
    else if (ext === 'java') lang = 'java';
    else if (ext === 'c' || ext === 'h') lang = 'c';

    const content = file.content || '';

    // Filter rules matching language
    const langRules = this.RULES.filter((r) => r.language === lang);

    // Evaluate matching rules
    for (const rule of langRules) {
      const result = rule.check(content, file);
      if (result && result.matched) {
        return {
          finding: {
            id: rule.id,
            category: rule.category,
            severity: rule.severity,
            title: rule.title,
            explanation: result.explanation || '',
            originalCode: result.originalCode,
            suggestedCode: result.suggestedCode,
            benefit: result.benefit,
          },
          isOptimal: false,
        };
      }
    }

    // If no findings matched, code is in optimal, clean state
    return {
      finding: null,
      isOptimal: true,
    };
  }
}
