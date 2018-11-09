import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'app-ala-iframe',
  templateUrl: './ala-iframe.component.html',
  styleUrls: ['./ala-iframe.component.css']
})
export class AlaIframeComponent {
  @Input() src: string;
}
