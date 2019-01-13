import { Socket, RequestEvent } from '../network';
import { Serializer, Deserializer } from '../sio-network/serializer';
import AuthRequestEvent from './requestevent';
import { generateUID } from './uid';

export default class AuthUser {

  private listeners: Array<(e: RequestEvent) => void>;
  private promises: Map<string, (s: string) => void>;

  public constructor(public readonly id: string, public socket: Socket,
    private serializer: Serializer, private deserializer: Deserializer) {
    this.listeners = [];
    this.promises = new Map();
  }

  public addRequestListener(callback: (e: RequestEvent) => void) {
    this.listeners.push(callback);
  }

  public request(key: string, message: string): Promise<string> {
    const uid = generateUID();
    const promise = new Promise<string>((resolve, reject) => {
      this.socket.request()
      this.promises.set(uid, resolve);
    });
    return promise;
  }

  // Resend all outstanding requests
  public refresh() {
    throw new Error("Method not implemented.");
  }

  public handleRequest(value: string) {
    const listeners = this.listeners;
    const [success, key, message] = this.deserializer(value);
    if (success) {
      for (const listener of listeners) {
        listener(new AuthRequestEvent(this, key, message));
      }
    }
    // Do nothing on failed deserializing
  }
}
