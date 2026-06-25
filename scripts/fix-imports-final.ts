import * as fs from 'fs';
import * as glob from 'glob';

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('useContext(LanguageContext)')) {
    if (!content.includes('import { useContext } from "react"') && 
        !content.includes("import { useContext } from 'react'") && 
        !content.match(/import\s+{[^}]*useContext[^}]*}\s+from\s+['"]react['"]/)) {
       
       // Need to add useContext import.
       // Safest is to just append `import { useContext } from 'react';` right after `'use client';` or at top
       if (content.includes("'use client';") || content.includes('"use client";')) {
          content = content.replace(/(['"]use client['"];?\n?)/, "$1import { useContext } from 'react';\n");
       } else {
          content = `import { useContext } from 'react';\n` + content;
       }
       changed = true;
    }
  }
  
  if (content.includes("Cannot find name 'language'")) {
    // Just in case it's literally written in the code
  }
  
  // Specific fix for RoleGuard
  if (file.includes('RoleGuard.tsx')) {
     if (content.includes('getTranslation(language,')) {
         if (!content.includes('const language =')) {
            content = content.replace('getTranslation(language,', "getTranslation('en',");
            changed = true;
         }
     }
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed imports finally!');
