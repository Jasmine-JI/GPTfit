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

/**
 * 偵測所有http request，若任何response返回401就進行登出
 * @author kidin-1090817
 */
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
            if (typeof (event.body) !== 'object' && event.body.slice(0, 5) !== '<?xml') {
              parseBody = JSON.parse(event.body);
              if (parseBody.processResult && parseBody.processResult.resultCode === 401) {
                const auth = this.injector.get(AuthService);
                auth.logout();
                console.log('Login identity error!');
              }
            }

          }
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401 || err.status === 402 || err.status === 403) {
              const router = this.injector.get(Router);
              const auth = this.injector.get(AuthService);

              this.dialog.open(MessageBoxComponent, {
                hasBackdrop: true,
                data: {
                  title: 'Error',
                  body: `${err.status}：網路異常，請稍後再試`,
                  confirmText: 'Confirm'
                }

              });

              auth.logout();
              router.navigate(['/signIn-web']);

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
