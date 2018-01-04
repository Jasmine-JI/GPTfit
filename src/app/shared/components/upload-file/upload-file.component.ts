import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit {
  @Input() maxFileSize: number;
  @Input() disabled: boolean;
  @Input() btnText: string;
  @Input() isLoading: boolean;
  @Input() accept: string;

  @Output() onChange = new EventEmitter();
  constructor() {}
  handleChange(event) {
    // const { accept } = this.props;
    const files = event.target.files;
    const acceptFileArray = this.accept;
    if (files.length > 0) {
      const fileReader = new FileReader();

      fileReader.onload = e => {
        const fileName = files[0].name.split('.');
        const fileType = fileName[fileName.length - 1];
        const fileInformation = {
          value: files[0] || null,
          link: e.target.result || '',
          isTypeCorrect: false,
          isSizeCorrect: false
        };
        if (acceptFileArray.indexOf(fileType.toLowerCase()) > -1) {
          fileInformation.isTypeCorrect = true;
        }
        if (files[0].size <= this.maxFileSize) {
          fileInformation.isSizeCorrect = true;
        }
        console.log('fileInformation: ', fileInformation);
        // return this.onChange(fileInformation);
      };
      fileReader.readAsDataURL(files[0]);
    }
  }
  ngOnInit() {
    console.log('accept: ', this.accept);
    console.log('maxFileSize: ', this.maxFileSize);
    console.log('btnText: ', this.btnText);
    console.log('isLoading: ', this.isLoading);
    console.log('disabled: ', this.disabled);
  }
}
