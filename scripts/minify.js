const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'api');

function minifyFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const minified = JSON.stringify(json);
    fs.writeFileSync(filePath, minified);
    
    const originalSize = content.length;
    const newSize = minified.length;
    const saved = ((originalSize - newSize) / originalSize * 100).toFixed(2);
    
    console.log(`Minified ${path.relative(apiDir, filePath)}: ${originalSize} -> ${newSize} bytes (${saved}% saved)`);
  } catch (e) {
    console.error(`Error minifying ${filePath}:`, e.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.json') && file !== 'manifest.json') {
      minifyFile(filePath);
    }
  }
}

console.log('Starting minification...');
walkDir(apiDir);
console.log('Minification complete.');
