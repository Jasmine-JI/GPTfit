import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import {
  unknownDeviceImagePath,
  professionalIconSubstitudePath,
  personalIconSubstitudePath,
} from '../../core/models/const';
import { ProductTypePipe } from '../../core/pipes';
import { FileFooterInfo } from '../../core/models/compo';

@Component({
  selector: 'app-sport-file-footer',
  templateUrl: './sport-file-footer.component.html',
  styleUrls: ['./sport-file-footer.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, ProductTypePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SportFileFooterComponent implements OnInit {
  @Input() footerInfo: FileFooterInfo;

  readonly unknownDeviceImagePath = unknownDeviceImagePath;
  readonly professionalIconSubstitudePath = professionalIconSubstitudePath;
  readonly personalIconSubstitudePath = personalIconSubstitudePath;
  readonly defaultDescriptionLength = 50;

  /**
   * 顯示完整課程介紹
   */
  showMoreClassInfo = false;

  /**
   * 顯示完整教練介紹
   */
  showMoreCoachInfo = false;

  /**
   * 現在顯示的裝置序列
   */
  currentDeviceIndex = 0;

  constructor() {}

  ngOnInit(): void {}

  /**
   * 隱藏所有過長資訊
   */
  initShowFullInfo() {
    this.showMoreClassInfo = false;
    this.showMoreCoachInfo = false;
  }

  /**
   * 顯示完整教練資訊
   */
  showFullCoachInfo() {
    this.showMoreCoachInfo = true;
  }

  /**
   * 顯示完整課程資訊
   */
  showFullClassInfo() {
    this.showMoreClassInfo = true;
  }

  /**
   * 切換前一個裝置資訊
   */
  switchPreviousDevice() {
    const { currentDeviceIndex } = this;
    if (currentDeviceIndex > 0) this.currentDeviceIndex--;
  }

  /**
   * 切換下一個裝置資訊
   */
  switchNextDevice() {
    const { currentDeviceIndex, footerInfo } = this;
    const deviceInfo = footerInfo?.deviceInfo;
    if (deviceInfo) {
      const deviceInfoLength = deviceInfo.length;
      if (currentDeviceIndex < deviceInfoLength - 1) this.currentDeviceIndex++;
    }
  }

  /**
   * 切換指定的裝置資訊
   * @param index {number}-指定的序列
   */
  switchAssignDevice(index: number) {
    this.currentDeviceIndex = index;
  }
}
