import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ala-iframe',
  templateUrl: './ala-iframe.component.html',
  styleUrls: ['./ala-iframe.component.scss'],
  standalone: true,
})
export class AlaIframeComponent implements OnChanges {
  @Input() src: any;
  @Input() type: 'trainLive' | 'signUp' | 'officialActivity' = 'trainLive'; // 用於trainlive頁面、註冊頁面、官方活動詳細頁
  @Input() width: string;
  @Input() height: string;
  @Input() maxWidth: string;
  @Input() maxHeight: string;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(this.src);
  }
}
