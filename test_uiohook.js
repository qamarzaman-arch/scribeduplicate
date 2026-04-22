const uiohookNapi = require('uiohook-napi');
const hook = uiohookNapi.uIOhook || uiohookNapi.default || uiohookNapi;

hook.on('click', (e) => console.log('click', e));
hook.on('mousedown', (e) => console.log('mousedown', e));
hook.on('keydown', (e) => console.log('keydown', e));

hook.start();
console.log('Hook started. Please press a key and click the mouse.');
setTimeout(() => {
  hook.stop();
  console.log('Hook stopped.');
}, 3000);
