import {
  Component,
  OnInit,
  Input,
  HostListener,
  ElementRef
} from '@angular/core';

@Component({
  selector: 'app-member-capsule',
  templateUrl: './member-capsule.component.html',
  styleUrls: ['./member-capsule.component.css']
})
export class MemberCapsuleComponent implements OnInit {
  @Input() memberInfo: any;
  @Input() icon: string;
  @Input() name: string;
  @Input() title: string;
  @Input() role: any;
  @Input() isSubGroupInfo = false;
  @Input() isAdminInfo = false;
  active = false;
  width = '100%';
  height = 'auto';
  public elementRef;
  constructor(myElement: ElementRef) {
    this.elementRef = myElement;
  }
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.elementRef.nativeElement.contains(event.target)) {
    } else {
      this.active = false;
    }
  }
  handleClick() {}
  ngOnInit() {
    this.listenImage(this.icon);
  }
  listenImage(link) {
    // Set the image height and width
    const image = new Image();
    image.addEventListener('load', this.handleImageLoad.bind(this));
    image.src = link;
  }
  handleImageLoad(event): void {
    const width = event.target.width;
    const height = event.target.height;
    const radio = width / height;
    if (radio > 1.6) {
      this.width = '180%';
      this.height = 'auto';
    } else if (radio < 0.6)  {
      this.width = 'auto';
      this.height = '180%';
    } else if (radio < 1.6 && radio > 1.3) {
      this.width = '150%';
      this.height = 'auto';
    } else {
      this.width = '100%';
      this.height = 'auto';
    }
  }
  toggleMenu() {
    this.active = !this.active;
  }
}
