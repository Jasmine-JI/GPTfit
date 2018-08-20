import { Component, OnInit } from '@angular/core';
import { EChartOption } from 'echarts';

@Component({
  selector: 'app-activity-info',
  templateUrl: './activity-info.component.html',
  styleUrls: ['./activity-info.component.css']
})
export class ActivityInfoComponent implements OnInit {
  echartsIntance: any;

  loading = false;

  chartOption = {
    title: {
      text: '堆疊區域圖'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Heart rate', 'Elevation', 'Speed']
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['0km', '1km', '2km', '3km', '4km', '5km', '6km']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: 'Heart rate',
        type: 'line',
        stack: '总量',
        areaStyle: { normal: {} },
        data: [150, 232, 201, 154, 190, 330, 410]
      },
      {
        name: 'Elevation',
        type: 'line',
        stack: '总量',
        areaStyle: { normal: {} },
        data: [320, 332, 301, 334, 390, 330, 320]
      },
      {
        name: 'Speed',
        type: 'line',
        stack: '总量',
        label: {
          normal: {
            show: true,
            position: 'top'
          }
        },
        areaStyle: { normal: {} },
        data: [820, 932, 901, 934, 1290, 1330, 1320]
      }
    ]
  };

  constructor() {}

  ngOnInit() {}

  /**
   * 获取echarts对象
   * @param ec echarts对象
   */
  onChartInit(ec) {
    this.echartsIntance = ec;
  }

  switch() {
    this.loading = !this.loading;
  }
}
