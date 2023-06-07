import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HrZoneRange } from '../../../../core/models/compo/chart-data.model';
import { HrBase } from '../../../../core/enums/sports';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-hrzone-info',
  templateUrl: './hrzone-info.component.html',
  styleUrls: ['./hrzone-info.component.scss'],
  standalone: true,
  imports: [NgIf, TranslateModule],
})
export class HrzoneInfoComponent implements OnInit, OnChanges {
  @Input() hrZoneRange: HrZoneRange;

  readonly HrBase = HrBase;

  constructor() {}

  ngOnInit() {}

  ngOnChanges() {}
}
