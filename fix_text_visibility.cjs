const fs = require('fs');
const path = require('path');

const indexCssPath = path.join(__dirname, 'src', 'index.css');

let content = fs.readFileSync(indexCssPath, 'utf8');

// Fix global aliases in :root
content = content.replace(/--txt-inverse:\s*var\(--bg-surface\);/g, '--txt-inverse: #FFFFFF;');
content = content.replace(/--header-cta:\s*var\(--bg-surface\);/g, '--header-cta: var(--brand-primary);');

// Fix dark mode overrides if any
if (!content.includes('--txt-inverse: #F5F0F1;') && content.includes('.dark {')) {
  content = content.replace(/\.dark\s*{([\s\S]*?)--brand-hover:\s*#C41E3A;/, 
    ".dark {$1--brand-hover: #C41E3A;\n    --txt-inverse: #F5F0F1;\n    --header-cta: var(--brand-primary);");
}

fs.writeFileSync(indexCssPath, content, 'utf8');
console.log('Fixed aliases in index.css');
