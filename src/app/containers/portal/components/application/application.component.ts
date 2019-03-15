import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-application',
  templateUrl: './application.component.html',
  styleUrls: ['./application.component.css']
})
export class ApplicationComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    if (location.hash === '#cloudrun') {
      this.router.navigateByUrl('#cloudrun');
    } else if (location.hash === '#connect') {
      this.router.navigateByUrl('#connect');
    } else if (location.hash === '#trainlive') {
      this.router.navigateByUrl('#trainlive');
    } else if (location.hash === '#fitness') {
      this.router.navigateByUrl('#fitness');
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
