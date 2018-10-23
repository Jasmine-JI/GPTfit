import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, OnInit } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import { ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { ReportService } from '../../services/report.service';
import { UtilsService } from '@shared/services/utils.service';
/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
}

/**
 * The Json tree data in string. The data could be parsed into Json object
 */
const TREE_DATA = JSON.stringify({
  '所有運動': {
    '活動數量': '1-1',
    '總時間': '1-2',
    '總距離': '1-3',
    '消耗卡路里': '1-4',
    '平均速度': '1-5',
    '最大速度': '1-6',
    '平均心率': '1-7',
    '最大心率': '1-8'
  },
  '跑步': {
    '總時間': '2-1',
    '總距離': '2-2',
    '消耗卡路里': '2-3',
    '平均配速': '2-4',
    '最大配速': '2-5',
    '平均心率': '2-6',
    '最大心率': '2-7',
    '平均步頻': '2-8',
    '最大步頻': '2-9'
  },
  '騎乘': {
    '總時間': '3-1',
    '總距離': '3-2',
    '消耗卡路里': '3-3',
    '平均速度': '3-4',
    '最大速度': '3-5',
    '平均心率': '3-6',
    '最大心率': '3-7',
    '平均踏頻': '3-8',
    '最大踏頻': '3-9',
    '平均功率': '3-10',
    '最大功率': '3-11'
  },
  '游泳': {
    '總時間': '4-1',
    '總距離': '4-2',
    '消耗卡路里': '4-3',
    '平均配速': '4-4',
    '最大配速': '4-5',
    '平均划水頻': '4-6',
    '最大划水頻': '4-7'
  },
  '重訓': {
    '總時間': '5-1',
    '總重量': '5-2',
    '總次數': '5-3',
    '消耗卡路里': '5-4',
    '平均心率': '5-5',
    '最大心率': '5-6',
    '所有肌肉概要部位資訊': {
      '最大1RM{跟下面一起}': '5-7',
      '總重量{跟上面一起}': '5-8',
      '總組數{跟下面一起}': '5-9',
      '總次數{跟上面一起}': '5-10'
    },
    '各個肌肉概要部位資訊': {
      '最大1RM': '5-11',
      '總重量': '5-12',
      '總組數': '5-13',
      '總次數': '5-14'
    }
  }
  // '有氧': {
  //   October: 'pdf',
  //   November: 'pdf',
  //   Tutorial: 'html'
  // },
});

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
@Injectable()
export class FileDatabase {
  dataChange = new BehaviorSubject<FileNode[]>([]);

  get data(): FileNode[] { return this.dataChange.value; }

  constructor() {
    this.initialize();
  }

  initialize() {
    // Parse the string to json object.
    const dataObject = JSON.parse(TREE_DATA);

    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(dataObject, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: object, level: number): FileNode[] {
    return Object.keys(obj).reduce<FileNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new FileNode();
      node.filename = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1);
        } else {
          node.type = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }
}

/**
 * @title Tree with nested nodes
 */
@Component({
  selector: 'app-sport-report',
  templateUrl: './sport-report.component.html',
  styleUrls: ['./sport-report.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [FileDatabase]
})
export class SportReportComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;
  chooseType = '1-1';
  timeType = 0;
  filterStartTime: string;
  filterEndTime: string;

  datas = [];
  chartName = '';
  treeData = JSON.parse(TREE_DATA);
  periodTimes = [];
  constructor(
    database: FileDatabase,
    private reportService: ReportService,
    private utils: UtilsService
  ) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(data => (this.nestedDataSource.data = data));
    this.filterEndTime = moment().format('YYYY-MM-DD');
    this.filterStartTime = moment()
      .subtract(7, 'days')
      .format('YYYY-MM-DD');
  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;
  ngOnInit() {
    const filterEndTime = moment().format('YYYY-MM-DDTHH:mm:ss+08:00');
    const filterStartTime = moment()
      .subtract(7, 'days')
      .format('YYYY-MM-DDTHH:mm:ss+08:00');
    this.generateTimePeriod();
    const body = {
      token: this.utils.getToken(),
      type: 1,
      filterStartTime,
      filterEndTime
    };

    if (this.treeData) {
      for (const sport in this.treeData) {
        if (this.treeData.hasOwnProperty(sport)) {
          for (const item in this.treeData[sport]) {
            if (this.treeData.hasOwnProperty(sport)) {
              const _sport = this.treeData[sport];
              if (_sport[item] === this.chooseType) {
                this.chartName = sport + item;
              }
            }
          }
        }
      }
    }
    this.handleSportSummaryArray(body);
  }
  private _getChildren = (node: FileNode) => node.children;
  handleRenderChart(type) {
    this.chooseType = type;
    // chartName generate
    if (this.treeData) {
      for (const sport in this.treeData) {
        if (this.treeData.hasOwnProperty(sport)) {
          for (const item in this.treeData[sport]) {
            if (this.treeData.hasOwnProperty(sport)) {
              const _sport = this.treeData[sport];
              if (_sport[item] === this.chooseType) {
                this.chartName = sport + item;
              }
            }
          }
        }
      }
    }

    console.log('chartName: ', this.chartName);
  }
  generateTimePeriod() {
    this.periodTimes = [];
    let stamp = moment(this.filterStartTime).unix();
    const stopDay = moment(this.filterEndTime).format('d');
    console.log('stopDay: ', stopDay);
    let stopTime = '';
    if (this.timeType === 2 || this.timeType === 3) {
      const stopTimeStamp = moment(this.filterEndTime)
        .subtract(stopDay, 'days')
        .unix() + 86400 * 7;
      stopTime = moment.unix(stopTimeStamp).format('YYYY-MM-DD');
      console.log('~~~~', moment.unix(stopTimeStamp).format('YYYY-MM-DD'));
    } else {
      const stopStamp = moment(this.filterEndTime).unix() + 86400;
      stopTime = moment.unix(stopStamp).format('YYYY-MM-DD');
    }
    console.log('stopTime: ', stopTime);
    while (moment.unix(stamp).format('YYYY-MM-DD') !== stopTime) {
      if (this.timeType === 2 || this.timeType === 3) {
        this.periodTimes.push(`${moment.unix(stamp).format('YYYY-MM-DD')}~${moment.unix(stamp + 86400 * 6).format('YYYY-MM-DD')}`);
        stamp = stamp + 86400 * 7;
      } else {
        this.periodTimes.push(moment.unix(stamp).format('YYYY-MM-DD'));
        stamp = stamp + 86400;
      }
    }
    console.log('this.periodTimes: ', this.periodTimes);
  }
  changeGroupInfo({ index }) {
    this.timeType = index;
    this.filterEndTime = moment().format('YYYY-MM-DD');
    const day = moment().format('d');
    if (this.timeType === 0) {
      this.filterStartTime = moment()
        .subtract(7, 'days')
        .format('YYYY-MM-DD');
    } else if (this.timeType === 1) {
      this.filterStartTime = moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD');
    } else if (this.timeType === 2) {
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format('YYYY-MM-DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DD');
    } else {
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format('YYYY-MM-DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DD');
    }
    this.generateTimePeriod();
    let filterEndTime = moment().format('YYYY-MM-DDTHH:mm:ss+08:00');

    let body = {};
    let filterStartTime = '';
    if (this.timeType === 0) {
      filterStartTime = moment()
        .subtract(7, 'days')
        .format('YYYY-MM-DDTHH:mm:ss+08:00');
    } else if (this.timeType === 1) {
      filterStartTime = moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DDTHH:mm:ss+08:00');
    } else if (this.timeType === 2) {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format('YYYY-MM-DDT00:00:00+08:00');
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DDT23:59:59+08:00');
    } else {
      filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format('YYYY-MM-DDT00:00:00+08:00');
      filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY-MM-DDT23:59:59+08:00');
    }
    if (this.timeType <= 1) {
      body = {
        token: this.utils.getToken(),
        type: 1,
        filterStartTime,
        filterEndTime
      };
    } else {
      body = {
        token: this.utils.getToken(),
        type: 2,
        filterStartTime,
        filterEndTime
      };
    }
    this.handleSportSummaryArray(body);
  }
  handleSportSummaryArray(body) {
    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      const { reportActivityDays, reportActivityWeeks } = res;
      if (body.type === 1) {
        this.datas = reportActivityDays;
      } else {
        this.datas = reportActivityWeeks;
      }
    });
  }
}
