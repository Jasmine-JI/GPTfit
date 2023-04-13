import { Component, OnInit, Input } from '@angular/core';
import { AlaApp } from '../../models/app-id';
import { getUrlQueryStrings } from '../../../core/utils';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
})
export class TermsComponent implements OnInit {
  @Input() language = 'zh-tw';
  appId = AlaApp.gptfit;

  readonly AlaApp = AlaApp;

  constructor() {}

  ngOnInit(): void {
    const { fi } = getUrlQueryStrings(location.search);
    if (fi) this.appId = +fi;
  }
}
