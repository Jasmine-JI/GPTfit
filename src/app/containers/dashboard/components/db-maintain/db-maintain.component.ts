import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-db-maintain',
  templateUrl: './db-maintain.component.html',
  styleUrls: ['./db-maintain.component.css']
})
export class DbMaintainComponent implements OnInit {
  initdbArray: any;
  dbArray: any;
  results: any;
  constructor() {}

  ngOnInit() {}
  intidbSubmit({ value }, event) {
    const { intidb } = value;
    console.log('value: ', value);
    console.log('event: ', event);
    let initdbDatas = intidb.split(',');
    initdbDatas = initdbDatas.map(_data => {
      const dbCloum = _data
        .replace(/`/g, '')
        .trim()
        .split(' ');
      const data = {
        name: dbCloum[0],
        type: dbCloum[1]
      };
      return data;
    });
    this.initdbArray = initdbDatas;
    console.log('initdbDatas: ', initdbDatas);
  }

  dbSubmit({ value }, event) {
    const { db } = value;
    console.log('value: ', value);
    console.log('event: ', event);
    let dbDatas = db.split('\n');
    dbDatas = dbDatas.map(_data => {
      const dbCloum = _data.trim().split('	');
      const data = {
        name: dbCloum[0],
        type: dbCloum[1]
      };
      return data;
    });
    this.dbArray = dbDatas;
    console.log('dbDatas: ', dbDatas);
  }
  parse() {
    console.log('this.initdbArray: ', this.initdbArray);
    console.log('this.dbArray: ', this.dbArray);
    let tmps = [];
    const lostArray = this.initdbArray.filter((initdbData, idx) => {
      const isExit = this.dbArray.some(_dbData => _dbData.name === initdbData.name);
      if (!isExit) {
        return initdbData;
      }
      // if (initdbData.length === idx + 1) {
      //   return tmps;
      // }
    });
    console.log('lostArray: ', lostArray);
  }
}
