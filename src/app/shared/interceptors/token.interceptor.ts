import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { UtilsService } from '../services/utils.service';
import { Observable } from 'rxjs/Observable';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(public utils: UtilsService) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.utils.getToken();

    if (token) {
      const newRequest = request.clone({
        setHeaders: {
          Authorization: token
        }
      });
      return next.handle(newRequest);
    }
    return next.handle(request);
  }
}
