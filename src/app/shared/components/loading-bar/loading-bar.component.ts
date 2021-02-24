import { Component, OnInit, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'app-loading-bar',
  templateUrl: './loading-bar.component.html',
  styleUrls: ['./loading-bar.component.scss']
})
export class LoadingBarComponent implements OnInit, OnChanges {

  @Input('progress') progress: number;

  /**
   * UI用到的各個flag
   */
  uiFlag = {
    pageComplete: true
  }

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    if (this.progress !== 100) {
      this.uiFlag.pageComplete = false;
    } else if (this.progress === 100) {
      setTimeout(() => {
        this.uiFlag.pageComplete = true;
      }, 1000);

    }

  }

}
