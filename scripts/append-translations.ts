import * as fs from 'fs';

const dictRaw = JSON.parse(fs.readFileSync('extracted_dictionary.json', 'utf8'));

const autoEn: Record<string, string> = {};
const autoHi: Record<string, string> = {};
const autoTe: Record<string, string> = {};

for (const key of Object.keys(dictRaw)) {
  const subkey = key.replace('auto.', '');
  const val = dictRaw[key];
  autoEn[subkey] = val;
  autoHi[subkey] = '[HI] ' + val;
  autoTe[subkey] = '[TE] ' + val;
}

function updateFile(filename: string, autoObj: Record<string, string>) {
  let content = fs.readFileSync(filename, 'utf8');
  // Insert before the last closing brace of the export
  const lastBraceIndex = content.lastIndexOf('};');
  if (lastBraceIndex !== -1) {
    const insert = `,\n  auto: ${JSON.stringify(autoObj, null, 4)}\n`;
    content = content.slice(0, lastBraceIndex) + insert + content.slice(lastBraceIndex);
    fs.writeFileSync(filename, content);
  }
}

updateFile('src/lib/i18n/en.ts', autoEn);
updateFile('src/lib/i18n/hi.ts', autoHi);
updateFile('src/lib/i18n/te.ts', autoTe);

console.log('Translations appended successfully!');
