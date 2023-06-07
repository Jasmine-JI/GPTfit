import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import { NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hover-hint',
  templateUrl: './hover-hint.component.html',
  styleUrls: ['./hover-hint.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgIf],
})
export class HoverHintComponent implements OnInit, OnChanges {
  @Input() type: string;
  @Input() leftPosition: boolean;
  @Output() showBox = new EventEmitter();

  isDisplayBox = false;
  hint: string;

  constructor(private translate: TranslateService) {}

  ngOnInit() {}

  ngOnChanges() {
    // 根據不同區塊顯示不同提示框-kidin-1090326
    switch (this.type) {
      case 'sportsFile':
        this.hint = this.translate.instant('universal_activityData_eventFileInformation');
        break;
      case 'sportsReport':
        this.hint = this.translate.instant('universal_activityData_sportsStatisticsInformation');
        break;
      case 'lifeTrackingReport':
        this.hint = this.translate.instant('universal_lifeTracking_lifeStatisticsInformation');
        break;
    }
  }

  // 滑鼠移入時顯示提示視窗-kidin-1090326
  mouseEnter() {
    this.isDisplayBox = true;
    this.showBox.emit(true);
  }

  // 滑鼠移出時隱藏提示視窗-kidin-1090326
  mouseLeave() {
    this.isDisplayBox = false;
    this.showBox.emit(false);
  }
}
