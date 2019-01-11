import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-basic-info',
  templateUrl: './basic-info.component.html',
  styleUrls: ['./basic-info.component.scss', '../user-profile.component.scss']
})
export class BasicInfoComponent implements OnInit {
  @Input() description: string;
  constructor() {}

  ngOnInit() {}
}
