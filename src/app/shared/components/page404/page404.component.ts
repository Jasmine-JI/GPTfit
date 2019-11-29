import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-page404',
  templateUrl: './page404.component.html',
  styleUrls: ['./page404.component.css']
})
export class Page404Component implements OnInit, OnDestroy {
  timeout: any;

  constructor(private router: Router) {}

  ngOnInit() {
    if (history.state.navigationId >= 2) {
      this.timeout = setTimeout(() => history.go(-2), 3000);
    } else {
      this.timeout = setTimeout(() => this.router.navigateByUrl('/dashboard'), 3000);
    }
  }

  ngOnDestroy() {
    if(this.timeout) {
      clearInterval(this.timeout);
    }
  }
}
