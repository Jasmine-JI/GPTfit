import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { getUserFtpZone } from '../../../../core/utils/sports';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-threshold-info',
  templateUrl: './threshold-info.component.html',
  styleUrls: ['./threshold-info.component.scss'],
  standalone: true,
  imports: [TranslateModule],
})
export class ThresholdInfoComponent implements OnInit, OnChanges {
  @Input() cycleFtp = 200;

  ftpZoneRange = {
    z0: 109,
    z1: 149,
    z2: 179,
    z3: 209,
    z4: 239,
    z5: 299,
    z6: ' ', // 最上層不顯示數值
  };

  constructor() {}

  ngOnInit(): void {
    this.ftpZoneRange = getUserFtpZone(this.cycleFtp);
  }

  ngOnChanges() {}
}
