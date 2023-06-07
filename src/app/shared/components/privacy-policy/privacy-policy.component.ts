import { Component, OnInit, Input } from '@angular/core';
import { AlaApp } from '../../../core/enums/common/app-id.enum';
import { getUrlQueryStrings } from '../../../core/utils';
import { NgSwitch, NgSwitchCase, NgIf } from '@angular/common';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgIf],
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
