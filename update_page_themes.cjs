const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // 1. Core mapping for surfaces
  { regex: /bg-\[var\(--clr-bg-page\)\]/g, to: 'bg-[var(--bg-page)]' },
  { regex: /bg-\[var\(--clr-bg-card\)\]/g, to: 'bg-[var(--bg-surface)]' },
  { regex: /text-\[var\(--txt-heading\)\]/g, to: 'text-[var(--text-primary)]' },
  { regex: /text-\[var\(--txt-body\)\]/g, to: 'text-[var(--text-secondary)]' },
  { regex: /border-\[var\(--clr-border\)\]/g, to: 'border-[var(--border-color)]' },

  // Base hex mapping if they exist
  { regex: /#FAF8F8/gi, to: 'var(--bg-page)' },
  { regex: /#130A0C/gi, to: 'var(--text-primary)' },
  { regex: /#E0D6D8/gi, to: 'var(--border-color)' },
  { regex: /#C41E3A/gi, to: 'var(--brand-primary)' },
  { regex: /bg-\[var\(--clr-emergency\)\]/gi, to: 'bg-[var(--clr-danger)]' },
  { regex: /text-\[var\(--clr-emergency\)\]/gi, to: 'text-[var(--clr-danger)]' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Global replacements
      for (const rule of replacements) {
        if (content.match(rule.regex)) {
          content = content.replace(rule.regex, rule.to);
          modified = true;
        }
      }

      // Page Specific Replacements
      if (file === 'LandingPage.tsx' || file === 'Header.tsx') {
        content = content.replace(/var\(--header-bg\)/g, 'var(--brand-primary)');
        content = content.replace(/var\(--stats-bg\)/g, 'var(--clr-dark-bg)');
        modified = true;
      }
      
      if (file === 'DonorDashboard.tsx') {
        content = content.replace(/var\(--rtid-badge\)/g, 'var(--brand-primary)');
        content = content.replace(/#7E22CE/gi, 'var(--clr-purple)');
        modified = true;
      }
      
      if (file.includes('HospitalDashboard') || file.includes('BloodBankDashboard') || fullPath.includes('hospital')) {
        content = content.replace(/var\(--rtid-bg\)/g, 'var(--bg-surface)');
        content = content.replace(/var\(--rtid-btn\)/g, 'var(--brand-primary)');
        modified = true;
      }

      if (file === 'AdminDashboard.tsx') {
        content = content.replace(/bg-\[var\(--bg-surface\)\]/g, 'bg-[var(--bg-surface)]');
        // Let's ensure Sidebar uses dark
        content = content.replace(/var\(--clr-dark-bg\)/g, 'var(--clr-dark-bg)');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated Page Theme: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Page-by-page mapping complete.');
