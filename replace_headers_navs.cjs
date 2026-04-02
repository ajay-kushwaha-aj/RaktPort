const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, rules) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  for (const rule of rules) {
    if (content.match(rule.regex)) {
      content = content.replace(rule.regex, rule.to);
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  }
}

// 1. Header.tsx
replaceFileContent(path.join(__dirname, 'src/components/Header.tsx'), [
  { regex: /var\(--clr-navy\)/g, to: 'var(--header-bg)' },
  { regex: /var\(--clr-brand\)/g, to: 'var(--header-cta)' }, // mostly used for login button text / borders
  { regex: /borderLeft:'3px solid var\(--header-cta\)'/g, to: "borderLeft:'3px solid var(--header-accent)'" }
]);

// 2. HospitalHeader.tsx and BloodBankHeader.tsx
const hospitalHeaderRules = [
  { regex: /bg-\[var\(--clr-navy\)\]/g, to: 'bg-[var(--header-bg)]' },
  { regex: /var\(--clr-navy\)/g, to: 'var(--header-bg)' },
  { regex: /var\(--clr-brand\)/g, to: 'var(--header-cta)' }
];
if(fs.existsSync(path.join(__dirname, 'src/components/HospitalHeader.tsx'))) {
    replaceFileContent(path.join(__dirname, 'src/components/HospitalHeader.tsx'), hospitalHeaderRules);
}
if(fs.existsSync(path.join(__dirname, 'src/components/BloodBankHeader.tsx'))) {
    replaceFileContent(path.join(__dirname, 'src/components/BloodBankHeader.tsx'), hospitalHeaderRules);
}

// 3. Footer.tsx
replaceFileContent(path.join(__dirname, 'src/components/Footer.tsx'), [
  { regex: /var\(--clr-navy\)/g, to: 'var(--footer-bg)' },
  { regex: /var\(--clr-brand\)/g, to: 'var(--footer-accent)' },
  { regex: /text-gray-400|text-gray-300|text-\[var\(--txt-body\)\]/g, to: 'text-[var(--footer-txt)]' }
]);

// 4. StatusTimeline.tsx (RTID Tracker)
if(fs.existsSync(path.join(__dirname, 'src/components/hospital/StatusTimeline.tsx'))) {
  replaceFileContent(path.join(__dirname, 'src/components/hospital/StatusTimeline.tsx'), [
    // Convert wrapper colors or badge colors.
    // If it uses var(--clr-bg-card) or white, maybe leave it, but RTID badges use var(--clr-info) normally.
    { regex: /var\(--clr-info\)/g, to: 'var(--rtid-badge)' },
    { regex: /bg-\[var\(--clr-info\)\]/g, to: 'bg-[var(--rtid-badge)]' },
    { regex: /text-\[var\(--clr-info\)\]/g, to: 'text-[var(--rtid-badge)]' }
  ]);
}
