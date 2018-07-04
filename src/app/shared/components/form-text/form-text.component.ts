import { Component, OnInit, Input } from '@angular/core';
import { DEFAULT_MAXLENGTH } from '@shared/utils/';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-text',
  templateUrl: './form-text.component.html',
  styleUrls: ['./form-text.component.css']
})
export class FormTextComponent implements OnInit {
  @Input() class_name = 'form-field';
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXT;
  @Input() isInvalid: boolean;
  @Input() content: string;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() control: FormGroup;
  @Input() controlName: string;
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  ngOnInit() {
  }
  setMyClasses() {
    const classes = {
      'form-field': true,
      'form-field--invalid': this.isInvalid
    };
    return classes;
  }
}
