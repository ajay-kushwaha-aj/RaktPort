const fs = require('fs');
const path = require('path');

function processRegexReplacements(filePath, replacements) {
    if(!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let mod = false;
    for(const rule of replacements) {
        if(content.match(rule.regex)) {
            content = content.replace(rule.regex, rule.to);
            mod = true;
        }
    }
    if(mod) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated specific context: ${path.basename(filePath)}`);
    }
}

// 1. Hospital Styles Bridge
processRegexReplacements(path.join(__dirname, 'src/components/hospital/styles.ts'), [
    { regex: /--c-brand:\s*#C41C38;/g, to: '--c-brand:         var(--clr-brand);' },
    { regex: /--c-brand-mid:\s*#A31628;/g, to: '--c-brand-mid:     var(--clr-brand-dark);' },
    { regex: /--c-bg:\s*#F4F6FB;/g, to: '--c-bg:            var(--clr-bg-page);' },
    { regex: /--c-surface:\s*#FFFFFF;/g, to: '--c-surface:       var(--clr-bg-card);' },
    { regex: /--c-border:\s*rgba\(15,23,42,0\.07\);/g, to: '--c-border:        var(--clr-border);' },
    { regex: /--c-text:\s*#0F172A;/g, to: '--c-text:          var(--txt-heading);' },
    { regex: /--c-text-2:\s*#1E293B;/g, to: '--c-text-2:        var(--txt-heading);' },
    { regex: /--c-text-3:\s*#475569;/g, to: '--c-text-3:        var(--txt-body);' },
    { regex: /--c-text-inv:\s*#FFFFFF;/g, to: '--c-text-inv:      var(--txt-inverse);' }
]);

// 2. Stats Bar + RTID Tracker Mapping across Dashboards
const dashboards = ['DonorDashboard.tsx', 'BloodBankDashboard.tsx', 'AdminDashboard.tsx', 'hospital/HospitalDashboard.tsx', 'hospital/PremiumDashboard.tsx'];
for(const board of dashboards) {
  processRegexReplacements(path.join(__dirname, `src/components/${board}`), [
    // Stats Bar
    { regex: /bg-\[var\(--clr-brand\)\]/g, to: 'bg-[var(--stats-bg)]' },
    { regex: /bg-gradient-to-br from-\[var\(--clr-brand\)\] to-\[\#4a0000\]/g, to: 'bg-[var(--stats-bg)]' },
    { regex: /bg-\[var\(--clr-emergency\)\]/g, to: 'bg-[var(--stats-bg)]' }, // If it was mapped randomly
    { regex: /bg-red-100/g, to: 'bg-[var(--stats-divider)]' },
    
    // RTID Contexts
    { regex: /bg-\[var\(--clr-navy\)\]/g, to: 'bg-[var(--rtid-bg)]' },
    { regex: /text-\[var\(--clr-info\)\]/g, to: 'text-[var(--rtid-badge)]' },
    { regex: /bg-\[var\(--clr-info\)\]/g, to: 'bg-[var(--rtid-badge)]' },
    { regex: /border-blue-100/g, to: 'border-[var(--clr-border)]' },
    { regex: /border-red-100/g, to: 'border-[var(--clr-border)]' }
  ]);
}
