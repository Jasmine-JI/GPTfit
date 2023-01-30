import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DEFAULT_MAXLENGTH } from '../../../core/utils/index';
import { UntypedFormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-text',
  templateUrl: './form-text.component.html',
  styleUrls: ['./form-text.component.scss'],
})
export class FormTextComponent implements OnInit {
  @Input() class_name = 'form-field';
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXT;
  @Input() isInvalid: boolean;
  @Input() type = 'text';
  @Input() content: string;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() control: UntypedFormGroup;
  @Input() controlName: string;
  @Input() disabled = false;
  @Input() placeholder = '';
  @Input() min = 0;
  @Input() max = 255;
  @Output() onChange = new EventEmitter();
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  ngOnInit() {}
  setMyClasses() {
    const classes = {
      'form-field': true,
      'form-field--invalid': this.isInvalid,
    };
    return classes;
  }
  handleChange(event) {
    const value = event.target.value;
    this.onChange.emit(value);
  }

  // 取消按enter鍵(Bug 1104)-kidin-1090415
  handleKeyDown(e) {
    if (e.key === 'Enter') {
      return false;
    }
  }
}
