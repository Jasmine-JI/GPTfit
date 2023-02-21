import { Component, OnInit, OnChanges, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-bar',
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class LoadingBarComponent implements OnInit, OnChanges {
  @Input() progress: number;
  @Input() isPreviewMode = false;

  /**
   * UI用到的各個flag
   */
  uiFlag = {
    pageComplete: true,
  };

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.changeProgress();
  }

  /**
   * 變更進度
   * @author kidin-1100302
   */
  changeProgress() {
    if (this.progress !== 100) {
      this.uiFlag.pageComplete = false;
      this.changeDetectorRef.markForCheck();
    } else if (this.progress === 100) {
      setTimeout(() => {
        this.uiFlag.pageComplete = true;
        this.changeDetectorRef.markForCheck();
      }, 1000);
    }
  }
}
