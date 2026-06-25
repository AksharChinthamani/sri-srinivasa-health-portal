import { en } from './en';
import { hi } from './hi';
import { te } from './te';

const translations = { en, hi, te };

export function getTranslation(language: string, key: string) {
  const lang = (translations as any)[language] || en;
  const keys = key.split('.');
  let value: any = lang;

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}
