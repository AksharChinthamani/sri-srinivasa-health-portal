import * as fs from 'fs';
import * as glob from 'glob';

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Check if it has 'use client' anywhere
  const hasUseClient = /['"]use client['"];?/.test(content);

  if (hasUseClient) {
    // Check if it's already exactly at the start
    const startsWithUseClient = content.trimStart().startsWith("'use client'") || content.trimStart().startsWith('"use client"');
    
    if (!startsWithUseClient) {
      // Remove all occurrences
      content = content.replace(/['"]use client['"];?\n?/g, '');
      // Add it to the absolute top
      content = `'use client';\n` + content;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed use client directives!');
