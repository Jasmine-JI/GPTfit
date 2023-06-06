import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  Api2103Response,
  SportsFileInfo,
  ActivityInfo,
  ActivityLap,
  ActivityPoint,
} from '../../../../../core/models/api/api-21xx';
import { SportTypeIconPipe, WeekDayKeyPipe, SportTypePipe } from '../../../../../core/pipes';
import { personalIconSubstitudePath } from '../../../../../core/models/const';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SportTypeIconPipe,
    WeekDayKeyPipe,
    SportTypePipe,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnChanges {
  /**
   * 基準檔案數據
   */
  @Input() fileData: Api2103Response;

  constructor() {}

  ngOnChanges(): void {}

  /**
   * 處理照片載入錯誤事件
   * @param e 錯誤事件
   */
  handleUserIconError(e: ErrorEvent) {
    (e.target as any).src = personalIconSubstitudePath;
  }
}
