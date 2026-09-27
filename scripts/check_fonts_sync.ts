import fs from 'node:fs';
import path from 'node:path';

function checkFontPaths() {
  const fontCandidates = [
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
  ];
  fontCandidates.forEach(p => {
    console.log(`${p}: exists = ${fs.existsSync(p)}`);
  });
}

checkFontPaths();
