const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Typography mapping
  { regex: /text-(gray|slate)-[89]00/g, to: 'text-[var(--txt-heading)]' },
  { regex: /text-(gray|slate)-[56]00/g, to: 'text-[var(--txt-body)]' },
  { regex: /text-white/g, to: 'text-[var(--txt-inverse)]' },

  // Background mapping
  { regex: /bg-white/g, to: 'bg-[var(--clr-bg-card)]' },
  { regex: /bg-(gray|slate)-(50|100)/g, to: 'bg-[var(--clr-bg-page)]' },

  // Border mapping
  { regex: /border-(gray|slate)-[23]00/g, to: 'border-[var(--clr-border)]' },
  
  // Specific Footer / Header classes if existing?
  // We will do Footer/Header in code directly for more granularity since they use --header-bg etc.
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    // exclude some files if needed
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
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
        console.log(`Updated Tokens: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Design Token v2 Updates complete.');
