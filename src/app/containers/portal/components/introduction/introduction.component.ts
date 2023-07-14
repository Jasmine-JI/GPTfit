import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { getLocalStorageObject } from '../../../../core/utils';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class IntroductionComponent implements OnInit, OnDestroy {
  langName: string;
  element: HTMLElement;
  login$: Observable<boolean>;
  intersectionObserver: IntersectionObserver;
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.createIntersectionObserver();
  }

  /**
   * 轉導至錨點
   * @param e 點擊事件
   * @param fragment 錨點字串
   */
  srollToElement(e, fragment: string) {
    e.preventDefault();
    this.element = document.getElementById(fragment);
    this.element.scrollIntoView({ behavior: 'smooth' });
  }

  ifLogin() {
    if (!this.login$) {
      this.router.navigateByUrl(`/signIn-web`);
    }
  }

  /**
   * 當頁面滾到指定位置，則圖片滑入
   */
  createIntersectionObserver() {
    const targetImgs = document.querySelectorAll('.hide__slide__img');
    const options = {
      threshold: 0,
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.remove('hide__slide__img');
        entry.target.classList.toggle('left__slide__in', entry.isIntersecting);
        // if(entry.isIntersecting) this.intersectionObserver.unobserve(entry.target)
      });
    }, options);
    targetImgs.forEach((targetImg) => {
      this.intersectionObserver.observe(targetImg);
    });
  }

  /**
   * 根據語系轉導至指定網址
   * @param code {number} 1: 了解更多 2:探索產品 3:取得應用 4:與我們聯絡
   */
  handleNavigation(code: number) {
    const currentLang = getLocalStorageObject('locale');
    let lang: string;
    switch (currentLang) {
      case 'zh-tw':
        lang = 'tw';
        break;
      case 'zh-cn':
        lang = 'cn';
        break;
      default:
        lang = 'en';
        break;
    }

    switch (code) {
      // case 1:
      //   window.open(
      //     `https://www.attacusfitness.com/gpt/lang/${lang}/id/38`,
      //     '_blank',
      //     'noopener=yes,noreferrer=yes'
      //   );
      //   break;
      case 2:
        window.open(
          `https://www.attacusfitness.com/products/${lang}/id/3`,
          '_blank',
          'noopener=yes,noreferrer=yes'
        );
        break;
      // case 3:
      //   this.switchPage('application');
      //   break;
      // case 4:
      //   window.open(
      //     `https://www.attacusfitness.com/contact/lang/${lang}`,
      //     '_blank',
      //     'noopener=yes,noreferrer=yes'
      //   );
      //   break;
    }
  }

  ngOnDestroy(): void {
    this.intersectionObserver.disconnect();
  }
}
