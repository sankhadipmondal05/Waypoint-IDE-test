// Monaco Editor Sand / Editorial Theme Definition

export const defineMonacoThemes = (monaco: any) => {
  // Light Mode (Sand / Editorial)
  monaco.editor.defineTheme('sand-editorial-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: '', foreground: '22211D', background: 'F7F6F2' },
      { token: 'comment', foreground: '8C8A82', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8F3B3B', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: '8F3B3B', fontStyle: 'bold' },
      { token: 'keyword.directive', foreground: 'B04A2F', fontStyle: 'bold' },
      { token: 'type', foreground: '1E6B9B', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: '1E6B9B' },
      { token: 'string', foreground: '2B7A4B' },
      { token: 'number', foreground: 'B86200' },
      { token: 'delimiter', foreground: '78756E' },
      { token: 'operator', foreground: '5C5850' },
      { token: 'identifier', foreground: '22211D' },
      { token: 'function', foreground: '6E3B95' },
    ],
    colors: {
      'editor.background': '#F7F6F2',
      'editor.foreground': '#22211D',
      'editorCursor.foreground': '#1C1B18',
      'editor.lineHighlightBackground': '#EFECE6',
      'editorLineNumber.foreground': '#A3A099',
      'editorLineNumber.activeForeground': '#22211D',
      'editor.selectionBackground': '#E2DDD2',
      'editor.inactiveSelectionBackground': '#ECEAE3',
      'editorIndentGuide.background': '#DDD9CE',
      'editorIndentGuide.activeBackground': '#7C7A73',
      'editorGutter.background': '#F7F6F2',
      'editorWidget.background': '#F7F6F2',
      'editorWidget.border': '#DDD9CE',
    },
  });

  // Dark Mode (Sand / Editorial Dark)
  monaco.editor.defineTheme('sand-editorial-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'EFECE6', background: '262421' },
      { token: 'comment', foreground: '9E9E9E', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'E57373', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'E57373', fontStyle: 'bold' },
      { token: 'keyword.directive', foreground: 'FF8A65', fontStyle: 'bold' },
      { token: 'type', foreground: '64B5F6', fontStyle: 'bold' },
      { token: 'type.identifier', foreground: '64B5F6' },
      { token: 'string', foreground: '81C784' },
      { token: 'number', foreground: 'FFB74D' },
      { token: 'delimiter', foreground: '90A4AE' },
      { token: 'operator', foreground: 'B0BEC5' },
      { token: 'identifier', foreground: 'EFECE6' },
      { token: 'function', foreground: 'BA68C8' },
    ],
    colors: {
      'editor.background': '#262421',
      'editor.foreground': '#EFECE6',
      'editorCursor.foreground': '#F7F6F2',
      'editor.lineHighlightBackground': '#1F1E1B',
      'editorLineNumber.foreground': '#6B6860',
      'editorLineNumber.activeForeground': '#EFECE6',
      'editor.selectionBackground': '#383530',
      'editor.inactiveSelectionBackground': '#2E2C27',
      'editorIndentGuide.background': '#383530',
      'editorIndentGuide.activeBackground': '#9B988E',
      'editorGutter.background': '#262421',
      'editorWidget.background': '#262421',
      'editorWidget.border': '#383530',
    },
  });
};
