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
  ngOnInit() {}
  toggleMenu() {
    this.active = !this.active;
  }
}
