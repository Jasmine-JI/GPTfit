/**
 * 多國語系清單
 */
export const langList = [
  'zh-tw',
  'zh-cn',
  'en-us',
  'es-es',
  'de-de',
  'fr-fr',
  'it-it',
  'pt-pt'
];

export const langData = {
  'zh-tw': '繁體中文',
  'zh-cn': '简体中文',
  'en-us': 'English',
  'es-es': 'Español',
  'de-de': 'Deutsche',
  'fr-fr': 'français',
  'it-it': 'italiano',
  'pt-pt': 'Português'
};

export type Lang = 'zh-tw' | 'zh-cn' | 'en-us' | 'es-es' | 'de-de' | 'fr-fr' | 'it-it' | 'pt-pt';

export enum MapLanguageEnum {
  TW,
  CN,
  EN,
  ES
}

