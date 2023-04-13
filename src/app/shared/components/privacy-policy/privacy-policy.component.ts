import { Component, OnInit, Input } from '@angular/core';
import { AlaApp } from '../../models/app-id';
import { getUrlQueryStrings } from '../../../core/utils';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
})
export class PrivacyPolicyComponent implements OnInit {
  @Input() language = 'zh-tw';
  appId = AlaApp.gptfit;

  readonly AlaApp = AlaApp;

  constructor() {}

  ngOnInit(): void {
    const { fi } = getUrlQueryStrings(location.search);
    if (fi) this.appId = +fi;
  }
}
