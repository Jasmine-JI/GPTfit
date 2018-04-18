import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({name: 'safeHtml'})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(_html: string, args: string[]): any {
    if (_html) {
      return this.sanitizer.bypassSecurityTrustUrl(_html);
    }
  }
}
