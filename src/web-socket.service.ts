import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Rx';

import { WebSocketServiceConfig } from './web-socket-service-config';

@Injectable()
export class WebSocketService {
  private ws: WebSocket;
  private wsObservable: Observable<any>;
  private config: WebSocketServiceConfig;

  constructor(config: WebSocketServiceConfig) {
    this.config = config;
  }

  setupWebSocket(): void {
    this.wsObservable = Observable.create((observer: any) => {
      const token = this.config.tokenGetter ? this.config.tokenGetter() : null;
      const tokenId = this.config.tokenId;
      const webSocketUrl = (token && tokenId) ? this.config.websocket_url + '?' + tokenId + '=' + token : this.config.websocket_url;

      this.ws = new WebSocket(webSocketUrl);

      this.ws.onopen = (event) => {
      };

      this.ws.onclose = (event) => {
        if (event.wasClean) {
          observer.complete();
        } else {
          observer.error(event);
        }
      };

      this.ws.onerror = (event) => {
        observer.error(event);
      }

      this.ws.onmessage = (event) => {
        observer.next(event.data);
      }

      return () => {
        this.ws.close();
      };
    }).share();
  }

  getDataStream(): Observable<any> {
    return Observable.create((observer: any) => {
      let subscription = this.wsObservable.subscribe(observer);

      return () => {
        subscription.unsubscribe();
      };
    }).retryWhen((error: any) => error.delay(3000));
  }

  sendData(message: Object): void {
    this.ws.send(message);
  }
}
