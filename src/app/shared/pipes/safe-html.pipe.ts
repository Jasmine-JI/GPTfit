import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/**
 * 引入圖片時，可防止xss攻擊（目前引入的圖片為本地端圖片，頭像等圖片url已皆由後端處理過，故可用可不用）
 */
@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(_html: string, args: string[]): any {
    if (_html) {
      return this.sanitizer.bypassSecurityTrustUrl(_html);
    }
  }
}
