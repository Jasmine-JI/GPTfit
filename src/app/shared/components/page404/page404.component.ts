import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { appPath } from '../../../app-path.const';

@Component({
  selector: 'app-page404',
  templateUrl: './page404.component.html',
  styleUrls: ['./page404.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class Page404Component implements OnInit, OnDestroy {
  redirectUrl: string;

  constructor(private translate: TranslateService) {}

  ngOnInit() {
    const { pathname, origin } = location;
    const {
      officialActivity: { home: officialActivityHome },
    } = appPath;
    const pathList = pathname.split('/');
    const isOfficialPage = pathList.indexOf(officialActivityHome) > -1;
    this.redirectUrl = `${origin}${isOfficialPage ? `/${officialActivityHome}` : ''}`;
  }

  ngOnDestroy() {}
}
