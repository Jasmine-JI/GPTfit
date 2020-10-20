import { Component, OnInit } from '@angular/core';
import { DbResultDialogComponent } from '../db-result-dialog/db-result-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-db-maintain',
  templateUrl: './db-maintain.component.html',
  styleUrls: ['./db-maintain.component.scss']
})
export class DbMaintainComponent implements OnInit {
  initdbArray = [];
  dbArray = [];
  db = '';
  intidb = '';
  resultsContent = {
    add: '',
    fix: '',
    delete: '刪除'
  };
  results = {
    lostArray: [],
    typeErrors: [],
    primaryKey: ''
  };
  constructor(public dialog: MatDialog) {}

  ngOnInit() {}
  intidbSubmit({ value }, event) {
    this.initdbArray = [];
    const { intidb } = value;
    const initdbDatas = intidb.split(',');
    initdbDatas.forEach(_data => {
      if (_data.indexOf('PRIMARY KEY') === -1) {
        const dbCloum = _data
          .replace(/`/g, '')
          .trim()
          .split(' ');
        const data = {
          name: dbCloum[0],
          type: dbCloum[1],
          null: '',
          default: ''
        };
        if (_data.indexOf('NOT NULL') > -1) {
          data.null = 'NOT NULL';
        }
        if (dbCloum.length > 4) {
          data.default = dbCloum.slice(2, dbCloum.length).join(' ');
        }
        return this.initdbArray.push(data);
      } else {
        const startIdx = _data.indexOf('(') + 1;
        const lastIdx = _data.indexOf(')');
        this.results.primaryKey = _data.slice(startIdx, lastIdx);
      }
    });
  }

  dbSubmit({ value }, event) {
    this.dbArray = [];
    const { db } = value;
    const dbDatas = db.split('\n');
    dbDatas.forEach(_data => {
      const dbCloum = _data.trim().split('	');
      if (dbCloum[0].length > 0) {
        const data = {
          name: dbCloum[0],
          type: dbCloum[1],
          isAmbiguous: false
        };
        return this.dbArray.push(data);
      }
    });
  }
  parse() {
    const typeErrors = [];
    const lostArray = this.initdbArray.filter((initdbData, idx) => {
      const isExit = this.dbArray.some(
        _dbData => _dbData.name === initdbData.name
      );
      if (!isExit) {
        return initdbData;
      } else {
        const index = this.dbArray.findIndex(
          _db => _db.name === initdbData.name
        );
        if (this.dbArray[index].type !== initdbData.type) {
          typeErrors.push(initdbData);
        }
      }
    });
    this.results.lostArray = lostArray;
    this.results.typeErrors = typeErrors;
    if (
      this.results.lostArray.length === 0 &&
      this.results.typeErrors.length === 0
    ) {
      this.dbArray.map(_data => {
        const isAmbiguous = !this.initdbArray.some(
          _initdbData => _initdbData.name === _data.name
        );
        if (isAmbiguous) {
          _data.isAmbiguous = true;
          this.resultsContent.delete += _data.name + '、';
        }
      });
    } else {
      this.resultsContent.add =
        this.results.lostArray.length > 0
          ? '新增' +
            this.results.lostArray.map(_lost => _lost.name).join() +
            '欄位'
          : '';
      this.resultsContent.fix =
        this.results.typeErrors.length > 0
          ? '修改' +
            this.results.typeErrors.map(_type => _type.name).join() +
            '資料型態'
          : '';
    }
  }
  showLostColumnDialog() {
    const data = {
      datas: this.results.lostArray,
      title: 'Column were lost'
    };
    this.dialog.open(DbResultDialogComponent, {
      hasBackdrop: true,
      data
    });
  }

  showTypeErrorsDialog() {
    const data = {
      datas: this.results.typeErrors,
      title: 'Types were Error'
    };
    this.dialog.open(DbResultDialogComponent, {
      hasBackdrop: true,
      data
    });
  }
  reset(str: HTMLInputElement) {
    str.value = '';
  }
}
