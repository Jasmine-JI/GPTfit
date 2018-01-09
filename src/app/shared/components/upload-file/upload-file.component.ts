import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit {
  @Input() maxFileSize: number;
  @Input() disabled = false;
  @Input() btnText: string;
  @Input() isLoading: boolean;
  @Input() accept: string;

  @Output() onChange = new EventEmitter();
  @ViewChild('fileUpload')
  set lookUp(ref: any) {
    ref.nativeElement.value = null;
  }
  constructor() {}

  ngOnInit() {}
  handleClick() {
  }
  handleBtnEvent(event) {
    event.preventDefault();
  }
  handleChange(event) {
    const files = event.target.files;
    const acceptFileArray = this.accept;
    if (files.length > 0) {
      const fileReader = new FileReader();

      fileReader.onload = e => {
        const fileName = files[0].name.split('.');
        const fileType = fileName[fileName.length - 1];
        const fileInformation = {
          value: files[0] || null,
          link: fileReader.result || '',
          isTypeCorrect: false,
          isSizeCorrect: false
        };
        if (acceptFileArray.indexOf(fileType.toLowerCase()) > -1) {
          fileInformation.isTypeCorrect = true;
        }
        if (files[0].size <= this.maxFileSize) {
          fileInformation.isSizeCorrect = true;
        }
        return this.onChange.emit(fileInformation);
      };
      fileReader.readAsDataURL(files[0]);
    }
  }
}
