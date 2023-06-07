import { Component, OnInit, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-form-remind',
  templateUrl: './form-remind.component.html',
  styleUrls: ['./form-remind.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class FormRemindComponent implements OnInit {
  @Input() className: string;
  @Input() isInvalid = false;
  @Input() remindText: string;
  @Input() invalidRemindText: string;
  @Input() textareaLength: number;
  @Input() content: string;
  @Input() maxLength: string;
  @Input() isHadCount = false;
  @Input() countText: string;
  remindCls = 'ala-form__remind';
  constructor() {}

  ngOnInit() {}
}
