import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  HostListener,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit, OnChanges {
  @Input() maxFileSize: number;
  @Input() disabled = false;
  @Input() reloadFileText: string;
  @Input() chooseFileText: string;
  @Input() btnText = this.chooseFileText;
  @Input() isLoading: boolean;
  @Input() accept: string;
  @Input() isImageFileMode = false;
  @Input() imageURL: string;
  fileInformation: any;
  isImgVertical$ = new BehaviorSubject<boolean>(false);
  isUploadNewImg$ = new BehaviorSubject<boolean>(false);
  errorMsg: string;
  @Output() onChange = new EventEmitter();
  @ViewChild('fileUpload')
  set lookUp(ref: any) {
    ref.nativeElement.value = null;
  }

  @HostListener('dragover', ['$event'])
  public onDragOver(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt) {
    evt.preventDefault();
    evt.stopPropagation();
  }
  @HostListener('drop', ['$event'])
  public onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const files = evt.dataTransfer.files;
    const acceptFileArray = this.accept;
    if (files.length > 0) {
      const fileReader = new FileReader();
      fileReader.onload = e => {
        const fileName = files[0].name.split('.');
        const fileType = fileName[fileName.length - 1];
        this.fileInformation = {
          value: files[0] || null,
          link: fileReader.result || '',
          isTypeCorrect: false,
          isSizeCorrect: false
        };

        if (acceptFileArray.indexOf(fileType.toUpperCase()) > -1) {
          this.fileInformation.isTypeCorrect = true;
        }
        // files[0].size 為bytes
        if (files[0].size <= this.maxFileSize) {
          this.fileInformation.isSizeCorrect = true;
        }
        if (
          this.fileInformation.isSizeCorrect &&
          this.fileInformation.isTypeCorrect
        ) {
          this.listenImage(this.fileInformation.link);
          this.isUploadNewImg$.next(true);
          this.btnText = this.reloadFileText;
        } else {
          this.handleErrorMsg();
          this.isUploadNewImg$.next(false);
        }

        return this.onChange.emit(this.fileInformation);
      };
      fileReader.readAsDataURL(files[0]);
    }
  }
  constructor() {}

  ngOnInit() {}
  ngOnChanges(changes: SimpleChanges) {
    // if (this.isImageFileMode) {
    //   const { imageURL: { currentValue } } = changes;
    //   if (currentValue) {
    //     this.listenImage(currentValue);
    //   }
    // }
  }
  handleClick() {}
  handleBtnEvent(event) {
    event.preventDefault();
  }
  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    if (width < height) {
      this.isImgVertical$.next(true);
    } else {
      this.isImgVertical$.next(false);
    }
  }

  handleChange(event) {
    const files = event.target.files;
    const acceptFileArray = this.accept;
    if (files.length > 0) {
      const fileReader = new FileReader();

      fileReader.onload = e => {
        const fileName = files[0].name.split('.');
        const fileType = fileName[fileName.length - 1];
        this.fileInformation = {
          value: files[0] || null,
          link: fileReader.result || '',
          isTypeCorrect: false,
          isSizeCorrect: false
        };
        if (acceptFileArray.indexOf(fileType.toUpperCase()) > -1) {
          this.fileInformation.isTypeCorrect = true;
        }
        // files[0].size 為bytes
        if (files[0].size <= this.maxFileSize) {
          this.fileInformation.isSizeCorrect = true;
        }
        if (
          this.fileInformation.isSizeCorrect &&
          this.fileInformation.isTypeCorrect
        ) {
          this.listenImage(this.fileInformation.link);
          this.isUploadNewImg$.next(true);
          this.btnText = this.reloadFileText;
        } else {
          this.handleErrorMsg();
          this.isUploadNewImg$.next(false);
        }
        return this.onChange.emit(this.fileInformation);
      };
      fileReader.readAsDataURL(files[0]);
    }
  }
  listenImage(link) {
    // Set the image height and width
    const image = new Image();
    image.addEventListener('load', this.handleImageLoad.bind(this));
    image.src = link;
  }
  removePreImage() {
    this.listenImage(this.imageURL);
    this.fileInformation.link = this.imageURL;
    this.onChange.emit(this.fileInformation);
    this.btnText = this.chooseFileText;
    this.isUploadNewImg$.next(false);
  }
  handleErrorMsg() {
    const { isSizeCorrect, isTypeCorrect } = this.fileInformation;
    if (!isSizeCorrect && !isTypeCorrect) {
      this.fileInformation.errorMsg = `照片格式限${
        this.accept
      }<br/>大小限制為${this.maxFileSize / 1024} KB以內`;
    } else if (!isSizeCorrect) {
      this.fileInformation.errorMsg = `大小限制為${this.maxFileSize /
        1024} KB以內`;
    } else {
      this.fileInformation.errorMsg = `照片格式限${this.accept}`;
    }
  }
}
