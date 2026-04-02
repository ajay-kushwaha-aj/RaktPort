const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /#(1A0506|1B0708|0D0305)/gi, to: 'var(--clr-navy)' },
  { regex: /#(851011|8B1010|9B111E|8B0000)/gi, to: 'var(--clr-brand)' },
  { regex: /#(F7F5EC|F6F4EC)/gi, to: 'var(--clr-bg-page)' },
  { regex: /#(D09C5A)/gi, to: 'var(--clr-brand-tint)' }
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(js|jsx|ts|tsx|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const rule of replacements) {
        if (rule.regex.test(content)) {
          content = content.replace(rule.regex, rule.to);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Color updates complete.');
