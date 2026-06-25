import * as fs from 'fs';
import * as glob from 'glob';

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('React.useContext(LanguageContext)')) {
    content = content.replace(/React\.useContext\(LanguageContext\)/g, 'useContext(LanguageContext)');
    
    // ensure useContext is imported
    if (content.includes("from 'react'") || content.includes('from "react"')) {
       if (!content.includes('useContext')) {
          content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react['"]/, (match, p1) => {
             return `import { useContext, ${p1} } from 'react'`;
          });
       }
    } else {
       content = `import { useContext } from 'react';\n` + content;
    }
    changed = true;
  }

  if (content.includes('getTranslation(language,') && !content.includes('const language =')) {
    // Insert fallback variable
    content = content.replace(/getTranslation\(language,/g, "getTranslation('en',");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed imports!');
