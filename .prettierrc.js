export default {
  // Line length
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Semicolons (required)
  semi: true,

  // Quotes (single for JS, double for JSX)
  singleQuote: true,
  jsxSingleQuote: false,

  // Trailing commas (helps with git diffs)
  trailingComma: 'es5',

  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,

  // Arrow function parens (always)
  arrowParens: 'always',

  // End of line
  endOfLine: 'lf',

  // JSX
  // jsxBracketSameLine is deprecated in favor of bracketSameLine (already set to false above)

  // Plugin overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
};
