const { runTests } = require('./search.test');
const { runFrontendSearchTests } = require('./frontendSearch.test');

async function main() {
  try {
    await runTests();
    await runFrontendSearchTests();
    console.log('🎉 ALL School OS Phase 1 & Phase 2 Test Suites Passed Successfully!\n');
  } catch (err) {
    console.error('Test runner fatal error:', err);
    process.exit(1);
  }
}

main();
