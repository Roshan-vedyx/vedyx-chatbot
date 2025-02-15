module.exports = {
  env: {
    node: true,      // This tells ESLint that it's a Node.js environment
    es2021: true,    // Use ES2021 features (you can adjust to a different version if needed)
  },
  extends: [
    'eslint:recommended', // Use ESLint's recommended settings
    'google',             // Google JavaScript style guide
  ],
  parserOptions: {
    ecmaVersion: 2021,   // Parse modern JavaScript features
  },
  rules: {
    'no-undef': 'off',  // Disable the 'no-undef' rule, since it's causing issues here
  },
};
