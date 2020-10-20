import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit {
  @Input() meta: any;
  @Input() currentPage: number;
  @Input() maxPage: number;
  @Input() total: number;
  @Output() onChange = new EventEmitter();

  pageRanges: Array<any>; // 產生頁數範圍
  constructor() {}

  ngOnInit() {
    this.pageRanges = Array.from({ length: this.maxPage }, (v, k) => k + 1);
  }
  onPageChange(_page) {
    this.onChange.emit(_page);
  }
  selectPage(_page) {
    this.currentPage = _page;
    this.onPageChange(this.currentPage);
  }
  prePage() {
    let pageNumber = this.currentPage;
    if (this.currentPage > 1) {
      pageNumber = this.currentPage - 1;
    }
    if (this.currentPage !== 1) {
      this.onPageChange(pageNumber);
    }
  }
  nextPage() {
    let pageNumber = this.currentPage;
    if (this.currentPage < this.maxPage) {
      pageNumber = this.currentPage + 1;
    }
    if (this.currentPage !== this.maxPage) {
      this.onPageChange(pageNumber);
    }
  }
  toFirstPage() {
    const pageNumber = 1;
    if (this.currentPage !== 1) {
      this.onPageChange(pageNumber);
    }
  }
  toLastPage() {
    if (this.currentPage !== this.maxPage) {
      this.onPageChange(this.maxPage);
    }
  }
}
