import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.css']
})
export class LeaderboardComponent implements OnInit {
  rankDatas: any;
  mapDatas: any;
  meta: any;
  mapId = 5;
  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.http.get('http://localhost:3000/rankform').subscribe(res => {
      this.rankDatas = res.datas;
      this.meta = this.buildPageMeta(res.meta);
    });
    this.http.get('http://localhost:3000/rankform/rankInfo?param=map').subscribe(res => {
      this.mapDatas = res;
    });
  }
  onSubmit(form) {
    this.mapId = form.value.mapId;
    this.http.get('http://localhost:3000/rankform?mapId=' + this.mapId).subscribe(res => {
      this.rankDatas = res.datas;
    });
  }
  buildPageMeta(_meta) {
    const meta = Object.assign({}, {
      pageNumber: 0,
      pageSize: 0,
      pageCount: 0,
    }, _meta);
    const {
      pageSize,
      pageCount,
    } = meta;
    const maxPage = Math.ceil(pageCount / pageSize) || 0;
    return {
      maxPage,
      currentPage: meta.pageNumber,
      perPage: pageSize,
      total: pageCount,
    };
  }
  prePage() {
    const pageNumber = this.meta.currentPage - 1;
    this.http.get(`http://localhost:3000/rankform?mapId=${this.mapId}&pageNumber=` + pageNumber).subscribe(res => {
      this.rankDatas = res.datas;
      this.meta = this.buildPageMeta(res.meta);
    });
  }
  nextPage() {
    const pageNumber = this.meta.currentPage + 1;
    this.http.get(`http://localhost:3000/rankform?mapId=${this.mapId}&pageNumber=` + pageNumber).subscribe(res => {
      this.rankDatas = res.datas;
      this.meta = this.buildPageMeta(res.meta);
    });
  }
}
