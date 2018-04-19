import { Component, OnInit } from '@angular/core';
import { getUrlQueryStrings } from '@shared/utils/';
@Component({
  selector: 'app-demo-qrcod',
  templateUrl: './demo-qrcod.component.html',
  styleUrls: ['./demo-qrcod.component.css']
})
export class DemoQrcodComponent implements OnInit {
  displayQr: any;
  constructor() { }

  ngOnInit() {
    const queryStrings = getUrlQueryStrings(location.search);
    this.displayQr = queryStrings;
  }

}
