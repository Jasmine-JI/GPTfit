import { Component } from '@angular/core';
import { Domain } from './shared/enum/domain';
import { Router, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  appLoaded = false;

  constructor(
    private router: Router
  ) {
    this.checkDomain();
    this.subscribeNavigation();
  }

  /**
   * 確認若為舊domain或非https，則予以轉址
   * @author kidin-1110119
   */
  checkDomain() {
    const { href, protocol, hostname } = location;
    if (protocol === 'http:' && (hostname === Domain.uat || hostname === Domain.newProd)) {
      // 以由後端(google domain設定http轉導)，待穩定後移除此段
      location.href = href.replace('http://', 'https://');
    } else if (protocol === 'http:' && hostname === Domain.oldProd) {
      location.href = href.replace(`http://${Domain.oldProd}`, `https://${Domain.newProd}`);
    } else if (hostname === Domain.oldProd) {
      location.href = href.replace(Domain.oldProd, Domain.newProd);
    }

  }

  /**
   * 訂閱轉導事件，並只取前面幾個事件，讓載入angular及call api 1003和1010不會只有白畫面
   */
  subscribeNavigation() {
    this.router.events.subscribe(e => {
      if (
        e instanceof NavigationEnd
        || e instanceof NavigationCancel
        || e instanceof NavigationError
      ) {
        this.appLoaded = true;
      }

    });

  }
  
}
