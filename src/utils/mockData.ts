import type { FileItem, ExecutionResult, ReviewResult } from '../types/ide';

export const INITIAL_FILES: FileItem[] = [
  {
    id: 'src-folder',
    name: 'src',
    path: '/src',
    isFolder: true,
    children: [
      {
        id: 'main-cpp',
        name: 'main.cpp',
        path: '/src/main.cpp',
        isFolder: false,
        language: 'cpp',
        problemStatement: 'Problem 1: Sum of Array Elements\nGiven an array of integers, calculate and print the sum of all elements. Ensure time complexity is O(N) and no unnecessary copies are made.',
        content: `#include <iostream>
#include <vector>

int main() {
    // Initialize list of numbers
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int num : numbers) {
        sum += num;
    }

    std::cout << "Sum: " << sum << std::endl;
    return 0;
}`,
        isModified: false,
      },
      {
        id: 'helpers-cpp',
        name: 'utils.cpp',
        path: '/src/utils.cpp',
        isFolder: false,
        language: 'cpp',
        problemStatement: 'Problem 2: Safe Average Calculator\nImplement a function that computes the arithmetic mean of a sum and count, properly guarding against division by zero.',
        content: `// Utility functions for calculation
int calculateAverage(int sum, int count) {
    if (count == 0) return 0;
    return sum / count;
}`,
        isModified: true,
      },
      {
        id: 'script-py',
        name: 'solution.py',
        path: '/src/solution.py',
        isFolder: false,
        language: 'python',
        problemStatement: 'Problem 3: Find Maximum Element\nGiven a non-empty list of integers, find and return the maximum value without using built-in max() function.',
        content: `def find_max(numbers):
    if not numbers:
        return None
    current_max = numbers[0]
    for num in numbers:
        if num > current_max:
            current_max = num
    return current_max

print(f"Max: {find_max([10, 45, 3, 89, 22])}")`,
        isModified: false,
      },
      {
        id: 'program-java',
        name: 'Main.java',
        path: '/src/Main.java',
        isFolder: false,
        language: 'java',
        problemStatement: 'Problem 4: Welcome Greeter in Java\nCreate an entrypoint Main class that prints greeting messages and demonstrates basic object-oriented execution.',
        content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Waypoint IDE!");
    }
}`,
        isModified: false,
      }
    ]
  },
  {
    id: 'readme-file',
    name: 'README.md',
    path: '/README.md',
    isFolder: false,
    language: 'markdown',
    problemStatement: 'Project Documentation:\nDescribe learning goals, instructions, and compiler requirements for C++, Python, and Java problem sets.',
    content: `# Learning Project\n\nPracticing C++ and Python fundamentals.`,
    isModified: false,
  }
];

export const MOCK_SUCCESS_RUN: ExecutionResult = {
  state: 'success',
  stdout: `1\n2\n3\nSum: 15`,
  stderr: '',
  exitCode: 0,
  executionTimeMs: 14,
};

export const MOCK_ERROR_RUN: ExecutionResult = {
  state: 'error',
  stdout: '',
  stderr: `main.cpp:8:10: error: expected ';' before 'return'\n    8 |     int sum = 0\n      |              ^\n      |              ;\n    9 |     return 0;\n`,
  exitCode: 1,
  executionTimeMs: 8,
  errorLocation: {
    file: 'main.cpp',
    line: 8,
    column: 10,
    message: "expected ';' before 'return'",
  },
  aiExplanation: "The C++ compiler encountered a missing semicolon at line 8 before reaching the return statement. In C++, every variable declaration statement must end with a semicolon (`;`). Adding `;` to `int sum = 0;` will resolve this error.",
};

export const MOCK_REVIEW_RESULT: ReviewResult = {
  state: 'completed',
  overallAssessment: 'Good solution. The logic is clean and correct, but we can improve memory efficiency and readability.',
  findings: [
    {
      id: 'f-1',
      category: 'readability',
      severity: 'low',
      title: 'Use standard numeric algorithms',
      explanation: 'Instead of manually accumulating vector elements using a for-loop, using std::accumulate conveys intent more clearly and avoids off-by-one errors.',
      originalCode: `int sum = 0;\nfor (int num : numbers) {\n    sum += num;\n}`,
      suggestedCode: `int sum = std::accumulate(numbers.begin(), numbers.end(), 0);`,
      benefit: 'Clearer intent and fewer manual loop variables.'
    },
    {
      id: 'f-2',
      category: 'performance',
      severity: 'medium',
      title: 'Pass vector by const reference',
      explanation: 'Passing vectors by value in function arguments creates full copies in memory. Pass by const reference (`const std::vector<int>&`) when only reading.',
      originalCode: `void processList(std::vector<int> nums)`,
      suggestedCode: `void processList(const std::vector<int>& nums)`,
      benefit: 'Eliminates unnecessary heap allocations.'
    }
  ]
};
