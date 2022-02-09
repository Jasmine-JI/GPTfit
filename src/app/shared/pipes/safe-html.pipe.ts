import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';


@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  /**
   * 略過消毒
   * @param _html {string}-網址
   * @returns {string} 
   */
  transform(_html: string): any {
    if (_html) {
      return this.sanitizer.bypassSecurityTrustUrl(_html);
    }

  }
  
}
