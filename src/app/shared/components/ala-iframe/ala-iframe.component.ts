import {
  Component,
  Input,
  OnChanges
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ala-iframe',
  templateUrl: './ala-iframe.component.html',
  styleUrls: ['./ala-iframe.component.scss']
})
export class AlaIframeComponent implements OnChanges {
  @Input() src: any;

  constructor (
    private sanitizer: DomSanitizer
  ) {}

    ngOnChanges(): void {
      this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.src
      );

    }

}
