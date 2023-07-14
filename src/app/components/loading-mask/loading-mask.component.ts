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
  /**
   * 是否正在載入
   */
  @Input() isLoading = false;

  /**
   * 是否佔滿版面
   */
  @Input() isFullPage = true;
}
