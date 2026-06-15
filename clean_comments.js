const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib', 'types'];
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css'];

function removeComments(content) {
  // 1. Remove block comments
  let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 2. Remove line comments that take up the whole line (avoids URLs and strings)
  cleaned = cleaned.replace(/^\s*\/\/.*$/gm, '');
  
  // 3. Remove empty curly braces that are alone on a line (remnants of JSX comments)
  cleaned = cleaned.replace(/^\s*\{\s*\}\s*$/gm, '');
  
  return cleaned;
}

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else {
      if (EXTENSIONS.includes(path.extname(fullPath))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const after = removeComments(content);
          if (content !== after) {
            fs.writeFileSync(fullPath, after);
            console.log(`Cleaned: ${fullPath}`);
          }
        } catch (e) {
          console.error(`Error processing ${fullPath}:`, e);
        }
      }
    }
  }
}

DIRS.forEach(processDir);
console.log('Done cleaning comments safely.');
