import * as fs from 'fs';
import * as glob from 'glob';

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remove duplicate `import { useContext } from 'react';`
  const lines = content.split('\n');
  const newLines = [];
  let seenUseContext = false;
  for (const line of lines) {
    if (line.trim() === "import { useContext } from 'react';" || line.trim() === 'import { useContext } from "react";') {
      if (seenUseContext) {
        changed = true;
        continue; // skip duplicate
      }
      seenUseContext = true;
    }
    newLines.push(line);
  }
  content = newLines.join('\n');

  // Fix RoleGuard
  if (file.includes('RoleGuard.tsx')) {
    if (content.includes("getTranslation(language, 'auto.access_denied')")) {
      content = content.replace("getTranslation(language, 'auto.access_denied')", "'Access Denied'");
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Cleaned up files!');
