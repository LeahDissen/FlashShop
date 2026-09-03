const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'EditorSidebar.jsx');
const text = fs.readFileSync(file, 'utf8');
const start = text.indexOf('const __REMOVE_FRAMES_LEFTOVER__');
const end = text.indexOf('const TextPanel');
if (start === -1 || end === -1 || end <= start) {
  throw new Error(`markers not found start=${start} end=${end}`);
}
fs.writeFileSync(file, text.slice(0, start) + text.slice(end));
console.log('removed', end - start, 'chars');
