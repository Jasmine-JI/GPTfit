import { Component, OnInit } from '@angular/core';
import { EChartOption } from 'echarts';
import { chartOption, basicAreaOption, rainOption } from './testDatas';

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: ['./activity-info.component.css']
})
export class ActivityInfoComponent implements OnInit {
  echartsIntance: any;

  chartLoading = false;
  basicLoading = false;
  rainLoading = false;

  chartOption = chartOption;
  basicAreaOption = basicAreaOption;
  rainOption = rainOption;
  constructor() {}

  ngOnInit() {}

  /**
   * 获取echarts对象
   * @param ec echarts对象
   */
  onChartInit(ec) {
    this.echartsIntance = ec;
  }

  switch(_loading) {
    this[_loading] = !this[_loading];
  }
}
