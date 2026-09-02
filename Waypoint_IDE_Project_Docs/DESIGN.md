# Waypoint IDE — Design System

## 1. Design Direction
Waypoint uses a **Sand / Editorial** design language.

The visual identity should feel calm, warm, focused, academic, modern, minimal, sophisticated, and approachable.

It should not look like a futuristic AI product or a direct VS Code clone.

## 2. Color Tokens

```css

Light Mode
:root {
  --bg-color: #EFECE6;
  --bg-alt: #E8E6DF;
  --surface-color: #F7F6F2;
  --border-color: #DDD9CE;
  --text-primary: #22211D;
  --text-secondary: #7C7A73;
  --accent-color: #1C1B18;
  --accent-text: #FFFFFF;
  --secondary-accent: #E2DDD2;
}

Dark Mode
:root {
--bg-color: #181715;
--bg-alt: #1F1E1B;
--surface-color: #262421;
--border-color: #383530;
--text-primary: #EFECE6;
--text-secondary: #9B988E;
--accent-color: #F7F6F2;
--accent-text: #181715;
--secondary-accent: #2E2C27;
}
```

## 3. Styling Technology
**Use Vanilla CSS for styling.**

Do not use Tailwind CSS, Bootstrap, Material UI, Chakra UI, styled-components, or Emotion unless explicitly approved later.

Use CSS custom properties and organized `.css` files.

## 4. Main Layout
Desktop targets: 1440×900 and 1920×1080.

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Bar                                                     │
├───────────────┬─────────────────────────────┬───────────────┤
│ Project       │ Code Editor                 │ Review        │
│ Explorer      │                             │ Console       │
├───────────────┴─────────────────────────────┴───────────────┤
│ Output / Terminal                                           │
└─────────────────────────────────────────────────────────────┘
```

Panels should be collapsible and resizable where appropriate.

## 5. Top Bar
Include:
- Waypoint logo/name.
- Current workspace/project.
- Run.
- Review.
- Settings.
- Update badge when available.

Run is the primary action. Review should not look like a chatbot.

## 6. Project Explorer
Approx. 240–260px wide.

Keep hierarchy restrained and avoid unnecessary professional IDE clutter.

## 7. Editor
Use Monaco Editor with:
- Readable monospace font.
- Comfortable line height.
- Line numbers.
- Syntax highlighting.
- Current-line highlight.
- Code folding.
- Tabs.
- Unsaved-state indicator.

## 8. Output
Tabs:
`OUTPUT` and `TERMINAL`.

Success example:
```text
✓ Program finished successfully

Output:
1
2
3

Execution time: 12 ms
```

Error example:
```text
✕ Program failed

main.cpp:8:10
error: expected ';' before 'return'
```

AI explanation should be an educational information block, not a chat interface.

## 9. Review Console
States:
- Not started.
- Reviewing.
- Completed.

Not started:
> Ready to review your solution.

Reviewing:
> Analyzing your solution...

Completed:
> ✓ Review complete

Findings should be grouped by category and severity.

## 10. Diff Design
Show:
`YOUR CODE` | `SUGGESTED`

Use subtle red/green highlighting only for changed lines. Keep unchanged code neutral.

## 11. AI Visual Language
Avoid:
- Robot heads.
- Giant sparkles.
- Chat bubbles everywhere.
- Neon AI gradients.
- Futuristic graphics.

AI should feel integrated into the IDE.

## 12. Buttons
Primary:
```css
background: var(--accent-color);
color: var(--accent-text);
```

Secondary:
```css
background: var(--secondary-accent);
color: var(--text-primary);
```

Tertiary: transparent with primary text.

## 13. Borders and Radius
```css
border: 1px solid var(--border-color);
```

Recommended:
- Controls: 6px.
- Panels/cards: 8–10px.
- Modals: 10–12px.

Avoid excessive pill-shaped UI.

## 14. Setup Wizard
Centered modal with:
`1 System Check → 2 Ollama → 3 Model → 4 Ready`

It must visually belong to Waypoint.

## 15. Update Badge
Top-right indicator such as:
`↑ 1`

Clicking opens:
```text
Waypoint IDE Update

Version 1.2.0 is available.

[ Download Update ]
Later
```

Download redirects to the official Waypoint website.

## 16. Empty States
Editor:
> Open a file to start coding.

Review:
> Your code review will appear here.

Keep empty states minimal.

## 17. Dark Mode
Implement after the light theme is stable. The Sand / Editorial light theme is the primary visual reference.

## 18. Accessibility
Ensure sufficient contrast, visible focus states, meaningful labels, and that errors/status are not communicated through color alone.
