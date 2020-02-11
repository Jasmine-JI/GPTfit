import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-hrzone-info',
  templateUrl: './hrzone-info.component.html',
  styleUrls: ['./hrzone-info.component.scss']
})
export class HrzoneInfoComponent implements OnInit {
  @Input() HRSetting: any;

  hrZoneRange = {
    z0: '0',
    z1: '0',
    z2: '0',
    z3: '0',
    z4: '0',
    z5: '0',
  };

  constructor() {
  }

  ngOnInit() {
    this.getUserBodyInfo();
  }

  // 取得使用者資訊並計算心率區間範圍()-kidin-1090203
  getUserBodyInfo () {
    const { userHRBase, userAge, userMaxHR, userRestHR } = this.HRSetting;

    if (userAge !== null) {
      if (userMaxHR && userRestHR) {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5) + '';
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1) + '';
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1) + '';
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1) + '';
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1) + '';
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1) + '';
        } else {
          this.hrZoneRange['z0'] = Math.floor((userMaxHR - userRestHR) * (0.55)) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor((userMaxHR - userRestHR) * (0.6)) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor((userMaxHR - userRestHR) * (0.65)) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor((userMaxHR - userRestHR) * (0.75)) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor((userMaxHR - userRestHR) * (0.85)) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor((userMaxHR - userRestHR) * (1)) + userRestHR;
        }
      } else {
        if (userHRBase === 0) {
          // 區間數值採無條件捨去法
          this.hrZoneRange['z0'] = Math.floor((220 - userAge) * 0.5) + '';
          this.hrZoneRange['z1'] = Math.floor((220 - userAge) * 0.6 - 1) + '';
          this.hrZoneRange['z2'] = Math.floor((220 - userAge) * 0.7 - 1) + '';
          this.hrZoneRange['z3'] = Math.floor((220 - userAge) * 0.8 - 1) + '';
          this.hrZoneRange['z4'] = Math.floor((220 - userAge) * 0.9 - 1) + '';
          this.hrZoneRange['z5'] = Math.floor((220 - userAge) * 1) + '';
        } else {
          this.hrZoneRange['z0'] = Math.floor(((220 - userAge) - userRestHR) * (0.55)) + userRestHR;
          this.hrZoneRange['z1'] = Math.floor(((220 - userAge) - userRestHR) * (0.6)) + userRestHR;
          this.hrZoneRange['z2'] = Math.floor(((220 - userAge) - userRestHR) * (0.65)) + userRestHR;
          this.hrZoneRange['z3'] = Math.floor(((220 - userAge) - userRestHR) * (0.75)) + userRestHR;
          this.hrZoneRange['z4'] = Math.floor(((220 - userAge) - userRestHR) * (0.85)) + userRestHR;
          this.hrZoneRange['z5'] = Math.floor(((220 - userAge) - userRestHR) * (1)) + userRestHR;
        }
      }
    } else {
      this.hrZoneRange['z0'] = 'Z0';
      this.hrZoneRange['z1'] = 'Z1';
      this.hrZoneRange['z2'] = 'Z2';
      this.hrZoneRange['z3'] = 'Z3';
      this.hrZoneRange['z4'] = 'Z4';
      this.hrZoneRange['z5'] = 'Z5';
    }

  }

}
