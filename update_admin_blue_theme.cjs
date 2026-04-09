const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'admin');

const replacements = [
  // Backgrounds - deep navy / slate
  { regex: /#080508/gi, to: '#020617' }, // slate-950
  { regex: /#0a0608/gi, to: '#0f172a' }, // slate-900
  { regex: /#0e0809/gi, to: '#0f172a' }, // sidebar bg
  { regex: /#0f0a0b/gi, to: '#1e293b' }, // card bg (slate-800)
  { regex: /#120a0c|#120b0d/gi, to: '#1e293b' }, // dropdowns
  { regex: /#140c0e/gi, to: '#1e293b' }, // inputs
  { regex: /#160d0f/gi, to: '#334155' }, // slate-700
  
  // Borders
  { regex: /#1a0e10/gi, to: '#334155' }, // slate-700
  { regex: /#1e1214/gi, to: '#334155' },
  { regex: /#2a1a1d/gi, to: '#475569' }, // slate-600
  { regex: /#2e1a1e/gi, to: '#475569' },
  { regex: /#3a1a20/gi, to: '#64748b' }, // slate-500
  { regex: /#3e1a20/gi, to: '#64748b' },
  
  // Text
  { regex: /#4a3a3d|#4a3a4d/gi, to: '#64748b' }, // slate-500
  { regex: /#5a4a4d|#5a4a5d/gi, to: '#94a3b8' }, // slate-400
  { regex: /#6a5a5d/gi, to: '#94a3b8' },
  { regex: /#7a6a6d/gi, to: '#cbd5e1' }, // slate-300
  { regex: /#8a7a7d/gi, to: '#cbd5e1' },
  { regex: /#9a8a8d/gi, to: '#e2e8f0' }, // slate-200
  { regex: /#a09094/gi, to: '#e2e8f0' },
  { regex: /#c0b0b3/gi, to: '#f1f5f9' }, // slate-100
  { regex: /#d0c0c4/gi, to: '#f8fafc' }, // slate-50
  { regex: /#e0d0d4/gi, to: '#f8fafc' },
  { regex: /#f0e0e4/gi, to: '#ffffff' },
  { regex: /#f0e8ea/gi, to: '#ffffff' },

  // Accents (Reds/Pinks/Browns to Blues)
  { regex: /#C41E3A/gi, to: '#2563eb' }, // blue-600
  { regex: /#E8294A/gi, to: '#3b82f6' }, // blue-500
  { regex: /#7B0D1E/gi, to: '#1d4ed8' }, // blue-700
  { regex: /#f472b6/gi, to: '#60a5fa' }, // pink-400 to blue-400 (charts/icons) 
  { regex: /rgba\(196,30,58,/g, to: 'rgba(37,99,235,' },
  { regex: /rgba\(232,41,74,/g, to: 'rgba(59,130,246,' },
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
      
      for (const rule of replacements) {
        if (content.match(rule.regex)) {
          content = content.replace(rule.regex, rule.to);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath.replace(__dirname, '')}`);
      }
    }
  }
}

console.log('Starting color replacement for admin dashboard...');
processDirectory(adminDir);
console.log('Done.');
