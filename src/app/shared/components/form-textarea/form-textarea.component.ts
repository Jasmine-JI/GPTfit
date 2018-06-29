import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './form-textarea.component.html',
  styleUrls: ['./form-textarea.component.css']
})
export class FormTextareaComponent implements OnInit {
  @Input() className: string;
  @Input() isInvalid = false;
  @Input() content: string;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() placeholder = '請輸入';
  fieldCls = 'form-field';
  constructor() {}

  ngOnInit() {}
}
