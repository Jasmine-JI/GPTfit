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
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
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
    return next.handle(request).pipe(
      tap(
        (event: HttpEvent<any>) => {
          if (event instanceof HttpResponse) {
            // do stuff with response if you want
            let parseBody;
            if (typeof (event.body) !== 'object') {
              parseBody = JSON.parse(event.body);
              if (
                (
                  parseBody.msgCode === 5058 || parseBody.msgCode === 1144) &&
                  (parseBody.resultCode === 401 || parseBody.resultCode === 402)
              ) {
                this.dialog.open(MessageBoxComponent, {
                  hasBackdrop: true,
                  data: {
                    title: 'Error',
                    body:
                      parseBody.resultMessage +
                      '<br>After five seconds, return to the login page',
                    confirmText: 'Confirm'
                  }
                });
                const auth = this.injector.get(AuthService);
                auth.logout();
                setTimeout(() => location.href = '/signin', 5000);
              }
            }

          }
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401 || err.status === 402 || err.status === 403) {
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
                  body: 'Server had problem',
                  confirmText: 'Confirm'
                }
              });
            }
          }
        }
      )

    );
  }
}
