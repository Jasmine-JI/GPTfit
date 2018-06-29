import { Component, OnInit, Input } from '@angular/core';
import { DEFAULT_MAXLENGTH } from '@shared/utils/';

@Component({
  selector: 'app-form-text',
  templateUrl: './form-text.component.html',
  styleUrls: ['./form-text.component.css']
})
export class FormTextComponent implements OnInit {
  @Input() className: string;
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXT;
  @Input() isInvalid = false;
  @Input() content: string;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  inputCls: string;
  constructor() {}

  ngOnInit() {
    console.log('this.className: ', this.className);
    console.log('this.maxLength: ', this.maxLength);
    console.log('this.content: ', this.content);
    this.inputCls = this.isInvalid
      ? `${this.className} ${this.className}--invalid`
      : `${this.className}`;
    console.log('this.inputCls: ', this.inputCls);
  }
}
