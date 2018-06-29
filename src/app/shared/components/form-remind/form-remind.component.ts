import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-form-remind',
  templateUrl: './form-remind.component.html',
  styleUrls: ['./form-remind.component.css']
})
export class FormRemindComponent implements OnInit {
  @Input() className: string;
  @Input() isInvalid = false;
  @Input() invalidText: string;
  remindCls = 'ala-form__remind';
  constructor() {}

  ngOnInit() {}
}
