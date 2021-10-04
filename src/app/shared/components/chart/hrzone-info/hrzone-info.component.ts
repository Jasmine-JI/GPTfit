import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { HrZoneRange } from '../../../models/chart-data';
import { hrBase } from '../../../../containers/dashboard/models/userProfileInfo';

@Component({
  selector: 'app-hrzone-info',
  templateUrl: './hrzone-info.component.html',
  styleUrls: ['./hrzone-info.component.scss']
})
export class HrzoneInfoComponent implements OnInit, OnChanges {
  @Input() hrZoneRange: HrZoneRange;

  readonly hrBase = hrBase;

  constructor() {
  }

  ngOnInit() { }

  ngOnChanges () { }

}
