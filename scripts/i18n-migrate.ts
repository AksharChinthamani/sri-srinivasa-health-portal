import { Project, SyntaxKind, JsxText, StringLiteral, JsxAttribute, Node } from 'ts-morph';
import * as fs from 'fs';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
    .substring(0, 40) || 'key_' + Math.random().toString(36).substring(7);
}

async function run() {
  const project = new Project({
    tsConfigFilePath: 'tsconfig.json',
  });

  const sourceFiles = project.getSourceFiles(['src/app/**/*.tsx', 'src/components/**/*.tsx']);
  const dictionary: Record<string, string> = {};

  let modifiedFilesCount = 0;

  for (const sourceFile of sourceFiles) {
    if (sourceFile.getFilePath().includes('layout.tsx')) continue; // Skip layout to avoid breaking root providers
    
    let isModified = false;
    let hasGetTranslation = false;

    // Find all JSX Text nodes
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    for (const jsxText of jsxTexts) {
      const text = jsxText.getLiteralText().trim();
      if (text && text.length > 1 && !/^[0-9]+$/.test(text) && !/^[^\w]+$/.test(text)) {
        // Exclude simple symbols, numbers, empty strings
        const key = `auto.${slugify(text)}`;
        dictionary[key] = text;
        
        // Ensure not inside a script tag or style tag
        const parent = jsxText.getParent();
        if (Node.isJsxElement(parent) && ['script', 'style'].includes(parent.getOpeningElement().getTagNameNode().getText())) {
          continue;
        }

        jsxText.replaceWithText(`{getTranslation(language, '${key}')}`);
        isModified = true;
        hasGetTranslation = true;
      }
    }

    // Find all JSX Attributes like placeholder, alt, title, label
    const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
    for (const attr of jsxAttributes) {
      const name = attr.getNameNode().getText();
      if (['placeholder', 'title', 'alt', 'label'].includes(name)) {
        const init = attr.getInitializer();
        if (Node.isStringLiteral(init)) {
          const text = init.getLiteralText().trim();
          if (text) {
            const key = `auto.${slugify(text)}`;
            dictionary[key] = text;
            attr.setInitializer(`{getTranslation(language, '${key}')}`);
            isModified = true;
            hasGetTranslation = true;
          }
        }
      }
    }

    if (isModified) {
      // Add 'use client' if missing
      const statements = sourceFile.getStatements();
      let hasUseClient = false;
      if (statements.length > 0 && Node.isExpressionStatement(statements[0])) {
        if (statements[0].getText().includes('use client')) {
          hasUseClient = true;
        }
      }
      if (!hasUseClient) {
        sourceFile.insertStatements(0, `'use client';\n`);
      }

      // Add imports
      const importDecls = sourceFile.getImportDeclarations();
      if (!importDecls.some(i => i.getModuleSpecifierValue() === '@/context/LanguageContext')) {
        sourceFile.addImportDeclaration({
          namedImports: ['LanguageContext'],
          moduleSpecifier: '@/context/LanguageContext',
        });
      }
      if (!importDecls.some(i => i.getModuleSpecifierValue() === '@/lib/i18n')) {
        sourceFile.addImportDeclaration({
          namedImports: ['getTranslation'],
          moduleSpecifier: '@/lib/i18n',
        });
      }
      if (!importDecls.some(i => i.getModuleSpecifierValue() === 'react')) {
        sourceFile.addImportDeclaration({
          defaultImport: 'React',
          moduleSpecifier: 'react',
        });
      }

      // Inject hook into component
      // Find the default export or the main function component
      const defaultExport = sourceFile.getDefaultExportSymbol();
      let componentFunc: Node | undefined = undefined;
      
      if (defaultExport) {
         const decl = defaultExport.getDeclarations()[0];
         if (Node.isFunctionDeclaration(decl)) {
           componentFunc = decl;
         }
      }
      
      // Fallback: get all arrow functions or function declarations assigned to exported consts
      if (!componentFunc) {
        const funcs = sourceFile.getFunctions();
        const arrowFuncs = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
        // Find one that returns JSX
        for (const f of [...funcs, ...arrowFuncs]) {
           if (f.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || f.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0) {
              componentFunc = f;
              break;
           }
        }
      }

      if (componentFunc) {
         let body: any = undefined;
         if (Node.isFunctionDeclaration(componentFunc) || Node.isFunctionExpression(componentFunc) || Node.isArrowFunction(componentFunc)) {
            body = componentFunc.getBody();
         }
         
         if (Node.isBlock(body)) {
            // Check if it already has language defined
            if (!body.getText().includes('useContext(LanguageContext)')) {
               body.insertStatements(0, `const langContext = React.useContext(LanguageContext);\n  const language = langContext?.language || 'en';`);
            }
         }
      }

      modifiedFilesCount++;
    }
  }

  await project.save();
  console.log(`Modified ${modifiedFilesCount} files.`);
  
  fs.writeFileSync('extracted_dictionary.json', JSON.stringify(dictionary, null, 2));
  console.log('Dictionary extracted to extracted_dictionary.json');
}

run().catch(console.error);
