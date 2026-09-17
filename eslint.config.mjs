import obsidianmd from 'eslint-plugin-obsidianmd'

export default [
  {
    ignores: ['node_modules/', 'main.js'],
  },
  ...obsidianmd.configs.recommended,
  {
    // Build scripts run in Node, never in the app, so the mobile-API and
    // console rules that protect plugin code do not apply to them.
    files: ['version-bump.mjs', 'vite.config.ts'],
    languageOptions: {
      globals: { process: 'readonly' },
    },
    rules: {
      'obsidianmd/no-nodejs-modules': 'off',
      'obsidianmd/rule-custom-message': 'off',
    },
  },
  {
    files: ['**/*.{ts,cts,mts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['vite.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-prototype-builtins': 'off',
      // The static methods here are `this`-free helpers, written to be
      // passed to map and flatMap. Binding them would say the opposite.
      '@typescript-eslint/unbound-method': ['error', { ignoreStatic: true }],
      // Sentence case, except that Tyto is the plugin's name.
      'obsidianmd/ui/sentence-case': ['error', { brands: ['Tyto', 'Obsidian', 'Mistral'] }],
    },
  },
  {
    // Test code is typed by its doubles rather than by the API. `vi.fn()` is
    // `any` by construction, `expect(fake.method)` is how Vitest asserts on a
    // call, and a parked promise left unsettled is often the case under test.
    // The rules that police those shapes say nothing useful here.
    files: ['**/tests/**/*.{ts,tsx}', 'src/test-support/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/await-thenable': 'off',
    },
  },
  {
    // This file stands in for Obsidian, so it cannot reach for Obsidian's
    // own globals: createDiv() is the thing it is mocking.
    files: ['src/test-support/__mocks__/obsidian.ts'],
    rules: {
      'obsidianmd/prefer-create-el': 'off',
    },
  },
  {
    // A test naming the config folder it writes its fixture into is stating
    // the path under test, not reading the user's configured one.
    files: ['**/tests/**/*.{ts,tsx}'],
    rules: {
      'obsidianmd/hardcoded-config-path': 'off',
    },
  },
  {
    // A fake builds the minimal TFile its subject reads. The rule's advice is
    // to narrow with instanceof, which a test double has no real file to be.
    files: ['**/tests/**/*.{ts,tsx}', 'src/test-support/**/*.{ts,tsx}'],
    rules: {
      'obsidianmd/no-tfile-tfolder-cast': 'off',
    },
  },
  {
    // The rule matches the name `write` looking for document.write.
    // TranscriptDocument.write returns a markdown string and touches no DOM.
    files: [
      'src/session/views/SessionPanel.tsx',
      'src/session/transcript/tests/transcript-document.test.ts',
    ],
    rules: {
      'no-unsanitized/method': 'off',
    },
  },
  {
    // requestUrl exists to bypass CORS, and RequestUrlParam carries no signal.
    // Cancelling a turn aborts the request in flight, which is what makes a
    // cancel immediate rather than a wait for the model to finish, so moving
    // to requestUrl would trade a user-visible behaviour for a rule.
    //
    // The CORS the rule protects against is not in play: api.mistral.ai
    // answers a preflight with access-control-allow-origin *, so fetch reaches
    // it from desktop and mobile alike.
    files: ['src/model/providers/mistral-provider.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
]
