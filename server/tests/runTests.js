const { runTests } = require('./search.test');

async function main() {
  try {
    await runTests();
  } catch (err) {
    console.error('Test suite failed:', err);
    process.exit(1);
  }
}

main();
