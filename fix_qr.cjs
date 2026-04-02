const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixQRious(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fixQRious(fullPath);
    } else if (/\.(ts|tsx)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const before = content;
      // Replace foreground color in QRious instantiation
      content = content.replace(/foreground:\s*['"]var\(--clr-brand\)['"]/g, "foreground: '#C41E3A'");
      
      // Look for any other occurrences
      if (content !== before) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed QR in ${fullPath}`);
      }
    }
  }
}

fixQRious(srcDir);
console.log('Done');
