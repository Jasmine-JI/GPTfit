import { NestedTreeControl } from '@angular/cdk/tree';
import {
  Component,
  Injectable,
  OnInit,
  Output,
  EventEmitter
} from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import { ViewEncapsulation } from '@angular/core';
import * as moment from 'moment';
import { ReportService } from '../../services/report.service';
import { UtilsService } from '@shared/services/utils.service';
import { ActivatedRoute } from '@angular/router';
import { TREE_DATA } from './treeData';
import { TranslateService } from '@ngx-translate/core';
import { HashIdService } from '@shared/services/hash-id.service';

/**
 * Json node data with nested structure. Each node has a filename and a value or a list of children
 */
export class FileNode {
  children: FileNode[];
  filename: string;
  type: any;
}

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

  constructor(private translate: TranslateService) {
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();
  }
  getAndInitTranslations() {
    this.initialize(this.translate.currentLang);
  }
  initialize(lang) {
    // Parse the string to json object.
    const dataObject = JSON.parse(JSON.stringify(TREE_DATA[lang]));

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
  today = moment().format('YYYY/MM/DD');
  endWeekDay = moment()
    .add(6 - +moment().format('d'), 'days')
    .format('YYYY/MM/DD');
  datas = [];
  chartName = '';
  treeData: any;
  periodTimes = [];
  isLoading = false;
  // to fix 之後多語系要注意
  openTreeName = '所有運動';
  targetUserId: string;
  currentLang: string;
  @Output() showPrivacyUi = new EventEmitter();
  constructor(
    database: FileDatabase,
    private reportService: ReportService,
    private utils: UtilsService,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private hashIdService: HashIdService
  ) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();
    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });
    this.getAndInitTranslations();
    database.dataChange.subscribe(data => (this.nestedDataSource.data = data));
    this.filterEndTime = moment().format('YYYY/MM/DD');
    this.filterStartTime = moment()
      .subtract(6, 'days')
      .format('YYYY/MM/DD');
  }

  hasNestedChild = (_: number, nodeData: FileNode) => !nodeData.type;
  ngOnInit() {
    this.targetUserId = this.hashIdService.handleUserIdDecode(this.route.snapshot.paramMap.get('userId'));
    const filterEndTime = moment().format('YYYY-MM-DDT23:59:59+08:00');
    const filterStartTime = moment()
      .subtract(6, 'days')
      .format('YYYY-MM-DDT00:00:00+08:00');
    this.generateTimePeriod();
    const body = {
      token: this.utils.getToken(),
      type: 1,
      filterStartTime,
      filterEndTime,
      targetUserId: ''
    };

    if (this.treeData) {
      for (const sport in this.treeData) {
        if (this.treeData.hasOwnProperty(sport)) {
          for (const item in this.treeData[sport]) {
            if (this.treeData.hasOwnProperty(sport)) {
              const _sport = this.treeData[sport];
              if (_sport[item] === this.chooseType) {
                this.chartName = sport + ' ' + item;
              }
            }
          }
        }
      }
    }
    this.handleSportSummaryArray(body);
  }
  getAndInitTranslations() {
    this.currentLang = this.translate.currentLang;
    this.treeData = JSON.parse(JSON.stringify(TREE_DATA[this.currentLang]));
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
                this.chartName = sport + ' ' + item;
              }
            }
          }
        }
      }
    }
  }
  generateTimePeriod() {
    this.periodTimes = [];
    let stamp = moment(this.filterStartTime).unix();
    const stopDay = moment(this.filterEndTime).format('d');
    let stopTime = '';
    if (this.timeType === 2 || this.timeType === 3) {
      const stopTimeStamp =
        moment(this.filterEndTime)
          .subtract(stopDay, 'days')
          .unix() +
        86400 * 7;
      stopTime = moment.unix(stopTimeStamp).format('YYYY-MM-DD');
    } else {
      const stopStamp = moment(this.filterEndTime).unix() + 86400;
      stopTime = moment.unix(stopStamp).format('YYYY-MM-DD');
    }
    while (moment.unix(stamp).format('YYYY-MM-DD') !== stopTime) {
      if (this.timeType === 2 || this.timeType === 3) {
        this.periodTimes.push((stamp + 86400 * 6) * 1000);
        stamp = stamp + 86400 * 7;
      } else {
        this.periodTimes.push(stamp * 1000);
        stamp = stamp + 86400;
      }
    }
  }
  changeGroupInfo({ index }) {
    this.timeType = index;
    this.filterEndTime = moment().format('YYYY/MM/DD');
    const day = moment().format('d');
    if (this.timeType === 0) {
      this.filterStartTime = moment()
        .subtract(6, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 1) {
      this.filterStartTime = moment()
        .subtract(29, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 2) {
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(26, 'weeks')
        .format('YYYY/MM/DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY/MM/DD');
    } else {
      this.filterStartTime = moment()
        .subtract(day, 'days')
        .subtract(52, 'weeks')
        .format('YYYY/MM/DD');
      this.filterEndTime = moment()
        .add(6 - +day, 'days')
        .format('YYYY/MM/DD');
    }
    this.generateTimePeriod();
    let filterEndTime = moment().format('YYYY-MM-DDT23:59:59+08:00');

    let body = {};
    let filterStartTime = '';
    if (this.timeType === 0) {
      filterStartTime = moment()
        .subtract(6, 'days')
        .format('YYYY-MM-DDT00:00:00+08:00');
    } else if (this.timeType === 1) {
      filterStartTime = moment()
        .subtract(29, 'days')
        .format('YYYY-MM-DDT00:00:00+08:00');
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
    this.isLoading = true;
    if (this.targetUserId) {
      body.targetUserId = this.targetUserId;
    }
    this.reportService.fetchSportSummaryArray(body).subscribe(res => {
      this.isLoading = false;
      if (res.resultCode === 402) {
        return this.showPrivacyUi.emit(true);
      }
      if (res.resultCode === 200) {
        const { reportActivityDays, reportActivityWeeks } = res;
        if (body.type === 1) {
          this.datas = reportActivityDays;
        } else {
          this.datas = reportActivityWeeks;
        }
        this.showPrivacyUi.emit(false);
      }
    });
  }
  handleItem(targetNode) {
    if (
      targetNode.filename === '重訓' ||
      targetNode.filename === '重训' ||
      targetNode.filename === 'Weight Training' ||
      targetNode.filename === '游泳' ||
      targetNode.filename === 'Swimming'
    ) {
      return;
    }
    if (this.openTreeName === targetNode.filename) {
      this.openTreeName = '';
    } else {
      this.openTreeName = targetNode.filename;
    }
  }
  shiftPreTime() {
    if (this.timeType === 0) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 1) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(29, 'days')
        .format('YYYY/MM/DD');
    } else if (this.timeType === 2) {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(26, 'weeks')
        .format('YYYY/MM/DD');
    } else {
      this.filterEndTime = moment(this.filterStartTime)
        .subtract(1, 'days')
        .format('YYYY/MM/DD');
      this.filterStartTime = moment(this.filterEndTime)
        .subtract(6, 'days')
        .subtract(52, 'weeks')
        .format('YYYY/MM/DD');
    }
    const filterEndTime = moment(this.filterEndTime).format(
      'YYYY-MM-DDT23:59:59+08:00'
    );
    const filterStartTime = moment(this.filterStartTime).format(
      'YYYY-MM-DDT00:00:00+08:00'
    );
    const body = {
      token: this.utils.getToken(),
      type: 1,
      filterStartTime,
      filterEndTime,
      targetUserId: ''
    };
    if (this.timeType > 1) {
      body.type = 2;
    }
    this.generateTimePeriod();
    this.handleSportSummaryArray(body);
  }
  shiftNextTime() {
    if (
      this.filterEndTime !== this.today ||
      this.filterEndTime !== this.endWeekDay
    ) {
      if (this.timeType === 0) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 1) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(29, 'days')
          .format('YYYY/MM/DD');
      } else if (this.timeType === 2) {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(26, 'weeks')
          .format('YYYY/MM/DD');
      } else {
        this.filterStartTime = moment(this.filterEndTime)
          .add(1, 'days')
          .format('YYYY/MM/DD');
        this.filterEndTime = moment(this.filterStartTime)
          .add(6, 'days')
          .add(52, 'weeks')
          .format('YYYY/MM/DD');
      }
      const filterEndTime = moment(this.filterEndTime).format(
        'YYYY-MM-DDT23:59:59+08:00'
      );
      const filterStartTime = moment(this.filterStartTime).format(
        'YYYY-MM-DDT00:00:00+08:00'
      );
      const body = {
        token: this.utils.getToken(),
        type: 1,
        filterStartTime,
        filterEndTime,
        targetUserId: ''
      };
      if (this.timeType > 1) {
        body.type = 2;
      }
      this.generateTimePeriod();
      this.handleSportSummaryArray(body);
    }
  }
}
