const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Hex Colors
  { regex: /#(EF4444|DC2626|ef4444|dc2626)/g, to: 'var(--clr-emergency)' },
  { regex: /#(3B82F6|2563EB|3b82f6|2563eb)/g, to: 'var(--clr-info)' },
  { regex: /#(10B981|059669|10b981|059669|2E7D32)/g, to: 'var(--clr-success)' },
  
  // Tailwind Text Classes
  { regex: /text-(red|orange)-[456]00/g, to: 'text-[var(--clr-emergency)]' },
  { regex: /text-blue-[456]00/g, to: 'text-[var(--clr-info)]' },
  { regex: /text-green-[456]00/g, to: 'text-[var(--clr-success)]' },
  
  // Tailwind BG Classes
  { regex: /bg-(red|orange)-[456]00/g, to: 'bg-[var(--clr-emergency)]' },
  { regex: /bg-blue-[456]00/g, to: 'bg-[var(--clr-info)]' },
  { regex: /bg-green-[456]00/g, to: 'bg-[var(--clr-success)]' },

  // Tailwind Border Classes
  { regex: /border-(red|orange)-[456]00/g, to: 'border-[var(--clr-emergency)]' },
  { regex: /border-blue-[456]00/g, to: 'border-[var(--clr-info)]' },
  { regex: /border-green-[456]00/g, to: 'border-[var(--clr-success)]' }
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
        console.log(`Updated Semantic Colors: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Semantic Semantic Updates complete.');
