import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeStyle',
  standalone: true,
})
export class SafeStylePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  /**
   * 取消過濾inline style
   * @param _html {string}-html text
   * @returns {string}
   */
  transform(_html: string): any {
    if (_html) {
      return this.sanitizer.bypassSecurityTrustHtml(_html);
    }
  }
}
