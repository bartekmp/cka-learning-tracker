import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**', 'node_modules/**'],
    },
    js.configs.recommended,
    {
        files: ['src/data/**/*.js', 'src/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2022,
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
            },
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
];