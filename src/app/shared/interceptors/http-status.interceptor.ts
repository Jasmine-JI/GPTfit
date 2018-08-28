import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { UtilsService } from '../services/utils.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material';
import { MessageBoxComponent } from '../components/message-box/message-box.component';

@Injectable()
export class HttpStatusInterceptor implements HttpInterceptor {
  constructor(
    public utils: UtilsService,
    public dialog: MatDialog,
    private injector: Injector
  ) {}
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).do(
      (event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // do stuff with response if you want
          // const parseBody = JSON.parse(event.body);
          // if (parseBody.resultCode && parseBody.resultCode !== 200) {
          //   this.dialog.open(MessageBoxComponent, {
          //     hasBackdrop: true,
          //     data: {
          //       title: 'Error',
          //       body: parseBody.resultMessage,
          //       confirmText: '確定'
          //     }
          //   });
          // }
        }
      },
      (err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401 || err.status === 403) {
            const router = this.injector.get(Router);
            const auth = this.injector.get(AuthService);
            auth.logout();
            router.navigate(['/signin']);
          }
          if (err.status === 504) {
            this.dialog.open(MessageBoxComponent, {
              hasBackdrop: true,
              data: {
                title: 'Error',
                body: 'server出現問題',
                confirmText: '確定'
              }
            });
          }
        }
      }
    );
  }
}
