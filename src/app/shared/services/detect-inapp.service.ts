import { Injectable } from '@angular/core';
import { findKey } from 'lodash';

const BROWSER = {
  messenger: /\bFB[\w_]+\/(Messenger|MESSENGER)/,
  facebook: /\bFB[\w_]+\//,
  twitter: /\bTwitter/i,
  line: /\bLine\//i,
  wechat: /\bMicroMessenger\//i,
  puffin: /\bPuffin/i,
  miui: /\bMiuiBrowser\//i,
  instagram: /\bInstagram/i,
  chrome: /\bCrMo\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?/,
  safari: /Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari/,
  ie: /IEMobile|MSIEMobile/,
  firefox: /fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS/
};

@Injectable()
export class DetectInappService {
  ua = '';

  constructor() {
    this.ua = navigator.userAgent || navigator.vendor || window['opera'];
  }

  get browser(): string {
    return findKey(BROWSER, regex => regex.test(this.ua)) || 'other';
  }

  get isIE(): boolean {
    return /IEMobile|MSIEMobile|Edge/i.test(this.ua) || false;
  }
  get isLine(): boolean {
    return /\bLine\//i.test(this.ua) || false;
  }
  get isMobile(): boolean {
    return /(iPad|iPhone|Android|Mobile)/i.test(this.ua) || false;
  }

  get isDesktop(): boolean {
    return !this.isMobile;
  }

  get isInApp(): boolean {
    const rules = [
      'WebView',
      '(iPhone|iPod|iPad)(?!.*Safari/)',
      'Android.*(wv|.0.0.0)'
    ];
    const regex = new RegExp(`(${rules.join('|')})`, 'ig');
    return Boolean(this.ua.match(regex));
  }
}
