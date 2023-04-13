import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-mask',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-mask.component.html',
  styleUrls: ['./loading-mask.component.scss'],
})
export class LoadingMaskComponent {
  @Input() isLoading = false;
}
