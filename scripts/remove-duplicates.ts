import * as fs from 'fs';
import * as glob from 'glob';

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Count how many times `useContext` is imported
  const importMatches = content.match(/import\s+[^;]*useContext[^;]*;/g);
  
  if (importMatches && importMatches.length > 1) {
    // There are multiple imports of useContext. We should keep the first one and remove others.
    // Actually, just remove the simple `import { useContext } from 'react';` line
    const lines = content.split('\n');
    const newLines = [];
    let removed = false;
    
    for (const line of lines) {
      if ((line.trim() === "import { useContext } from 'react';" || line.trim() === 'import { useContext } from "react";') && !removed) {
         removed = true;
         continue;
      }
      newLines.push(line);
    }
    
    fs.writeFileSync(file, newLines.join('\n'));
  }
});
console.log('Duplicate imports removed!');
