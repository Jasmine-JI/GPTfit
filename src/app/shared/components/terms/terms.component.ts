import { Component, OnInit, Input } from '@angular/core';
import { AlaApp } from '../../../core/enums/common/app-id.enum';
import { getUrlQueryStrings } from '../../../core/utils';
import { NgSwitch, NgSwitchCase, NgIf, NgSwitchDefault } from '@angular/common';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, NgIf, NgSwitchDefault],
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
