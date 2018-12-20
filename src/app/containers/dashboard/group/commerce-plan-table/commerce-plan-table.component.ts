import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-commerce-plan-table',
  templateUrl: './commerce-plan-table.component.html',
  styleUrls: ['./commerce-plan-table.component.scss']
})
export class CommercePlanTableComponent implements OnInit {
  @Output() onChange: EventEmitter<any> = new EventEmitter();
  planIdx: number;
  constructor() { }

  ngOnInit() {
  }
  choosePlan(idx) {
    this.planIdx = idx;
    this.onChange.emit(this.planIdx);
  }

}
