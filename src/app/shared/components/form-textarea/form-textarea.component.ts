import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { DEFAULT_MAXLENGTH } from '../../../core/utils/index';
import { UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormRemindComponent } from '../form-remind/form-remind.component';

@Component({
  selector: 'app-form-textarea',
  templateUrl: './form-textarea.component.html',
  styleUrls: ['./form-textarea.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, FormRemindComponent],
})
export class FormTextareaComponent implements OnInit, OnChanges {
  @Input() class_name = 'form-field';
  @Input() isInvalid = false;
  @Input() content: string;
  @Input() maxLength = DEFAULT_MAXLENGTH.TEXTAREA;
  @Input() invalidRemindText: string;
  @Input() remindText: string;
  @Input() placeholder = 'Please enter';
  @Output() onChange = new EventEmitter();
  @Input() control: UntypedFormGroup;
  @Input() controlName: string;
  @Input() disabled = false;
  @Input() isHadCount = false;
  countText: string;
  preContent: string;
  invalidClassName = `${this.class_name} ${this.class_name}--invalid`;
  constructor() {}

  ngOnInit() {
    this.preContent = this.content;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.content && changes.content.currentValue) {
      this.countText = `${changes.content.currentValue.length}/${this.maxLength}`;
    }
  }

  handleAutoHeight(textarea) {
    let adjustedHeight = textarea.currentTarget.clientHeight;
    adjustedHeight = Math.max(textarea.currentTarget.scrollHeight, adjustedHeight);
    if (adjustedHeight > textarea.currentTarget.clientHeight) {
      textarea.currentTarget.style.height = adjustedHeight + 'px';
    }
  }

  handleChange(event) {
    const value = event.target.value;
    this.handleAutoHeight(event);
    this.countText = `${value.length}/${this.maxLength}`;
    this.onChange.emit(value);
  }
}
