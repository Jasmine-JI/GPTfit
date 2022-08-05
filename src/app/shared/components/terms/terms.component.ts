import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss']
})
export class TermsComponent implements OnInit {

  @Input() language = 'zh-tw';

  constructor() { }

  ngOnInit(): void {
  }

}
