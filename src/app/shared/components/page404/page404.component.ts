import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-page404',
  templateUrl: './page404.component.html',
  styleUrls: ['./page404.component.css']
})
export class Page404Component implements OnInit, OnDestroy {
  redirectUrl: string;

  constructor(
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.redirectUrl = `https://${location.hostname}`;
  }

  ngOnDestroy() { }
}
