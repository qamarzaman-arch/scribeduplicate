const activeWin = require('active-win');

async function test() {
  try {
    const win = await activeWin();
    console.log('Active Window:', win);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
