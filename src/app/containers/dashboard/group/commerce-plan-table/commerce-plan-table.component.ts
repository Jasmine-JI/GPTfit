import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { planDatas } from '../desc';
import { TranslateModule } from '@ngx-translate/core';
import { NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-commerce-plan-table',
  templateUrl: './commerce-plan-table.component.html',
  styleUrls: ['./commerce-plan-table.component.scss'],
  standalone: true,
  imports: [NgIf, DecimalPipe, TranslateModule],
})
export class CommercePlanTableComponent implements OnInit {
  @Input() createType: number;
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  planIdx: number;
  planDatas = planDatas;
  createTypeTable: string;

  constructor() {}

  ngOnInit() {
    if (this.createType === 4) {
      this.createTypeTable = 'brandTable';
    } else if (this.createType === 5) {
      this.createTypeTable = 'comTable';
    }
  }

  choosePlan(idx) {
    this.planIdx = idx;
    this.onChange.emit(this.planIdx);
  }
}
