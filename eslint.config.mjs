import js from '@eslint/js';
import globals from 'globals';

// Globals that autosave.js defines and other script files consume via the page scope.
const scriptGlobals = {
    CHEATSHEET: 'readonly',
    HAS_FSA: 'readonly',
    SECTIONS: 'readonly',
    TIPS: 'readonly',
    asFlash: 'readonly',
    canWrite: 'readonly',
    idbDel: 'readonly',
    idbGet: 'readonly',
    idbSet: 'readonly',
    readHandle: 'readonly',
    setBarState: 'readonly',
    writeHandle: 'readonly',
};

const noUnusedVars = [
    'error',
    {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
    },
];

export default [
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
    js.configs.recommended,
    // Build script — Node.js ESM.
    {
        files: ['build.mjs'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: { 'no-unused-vars': noUnusedVars },
    },
    // Files that DEFINE shared globals (loaded as <script> tags; top-level vars become page-scoped).
    {
        files: ['src/data/**/*.js', 'src/js/autosave.js', 'src/js/theme.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, ...globals.es2022 },
        },
        rules: {
            // vars:'local' suppresses "assigned but never used" for intentional global exports.
            'no-unused-vars': [noUnusedVars[0], { ...noUnusedVars[1], vars: 'local' }],
        },
    },
    // Files that CONSUME shared globals (plain script, no bundler).
    {
        files: ['src/js/tasks.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.browser, ...globals.es2022, ...scriptGlobals },
        },
        rules: { 'no-unused-vars': noUnusedVars },
    },
    // React/JSX tracker bundle — ESM module, consumes shared globals via preceding <script> tags.
    {
        files: ['src/js/tracker.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: { ...globals.browser, ...globals.es2022, ...scriptGlobals },
        },
        rules: { 'no-unused-vars': noUnusedVars },
    },
];