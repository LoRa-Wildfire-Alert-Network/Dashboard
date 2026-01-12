module.exports = {
    extends: [
      // ... your other extends
      'plugin:prettier/recommended', // This should be last
    ],
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': 'error',
    },
  };