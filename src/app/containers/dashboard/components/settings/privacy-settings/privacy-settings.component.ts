import { Component, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-privacy-settings',
  templateUrl: './privacy-settings.component.html',
  styleUrls: ['./privacy-settings.component.scss', '../settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PrivacySettingsComponent implements OnInit {
  isDisplayBox = false;
  constructor() { }

  ngOnInit() {
  }
  mouseEnter() {
    this.isDisplayBox = true;
  }
  mouseLeave() {
    this.isDisplayBox = false;
  }
}
