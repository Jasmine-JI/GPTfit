import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-page404',
  templateUrl: './page404.component.html',
  styleUrls: ['./page404.component.scss'],
})
export class Page404Component implements OnInit, OnDestroy {
  redirectUrl: string;

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    const { pathname, origin } = location;
    const pathList = pathname.split('/');
    const isOfficialPage = pathList.indexOf('official-activity') > -1;
    this.redirectUrl = `${origin}${isOfficialPage ? '/official-activity' : ''}`;
  }

  ngOnDestroy() {}
}
