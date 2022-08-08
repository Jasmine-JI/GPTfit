import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about-cloudrun',
  templateUrl: './about-cloudrun.component.html',
  styleUrls: ['./about-cloudrun.component.scss'],
})
export class AboutCloudrunComponent implements OnInit {
  /**
   * ui會用到的flag
   */
  uiFlag = {
    progress: 0,
  };

  constructor() {}

  ngOnInit(): void {
    const scrollTarget = document.querySelector('.main__page');
    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
    this.handleImgLoadingTimeOut();
  }

  /**
   * 確認照片是否皆載入完成
   * @author kidin-1110125
   */
  imageLoaded() {
    const IMAGE_NUMBER = 6;
    const { progress } = this.uiFlag;
    const newProgress = progress + Math.ceil(100 / IMAGE_NUMBER);
    this.uiFlag.progress = newProgress >= 100 ? 100 : newProgress;
  }

  /**
   * 10秒內圖片沒載完亦顯示頁面
   * @author kidin-1110126
   */
  handleImgLoadingTimeOut() {
    setTimeout(() => {
      this.uiFlag.progress = 100;
    }, 10000);
  }
}
