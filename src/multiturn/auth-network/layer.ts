import { NetworkLayer, ConnectionEvent, RequestEvent,
  Socket } from '../network';
import { Serializer, Deserializer,
  defaultSerializer, defaultDeserializer } from '../sio-network/serializer';
import AuthConnectionEvent from './connectionevent';
import AuthSocket from './socket';
import { generateUID } from './uid';
import AuthUser from './user';

const registerId = '_register';
const loginId = '_login';

export default class AuthNetworkLayer implements NetworkLayer {

  private users: Map<string, AuthUser>;
  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;
  private serializer: Serializer;
  private deserializer: Deserializer;

  // Use an underlying network layer for actual network connections
  public constructor(private network: NetworkLayer,
    serializer?: Serializer, deserializer?: Deserializer) {
    this.listeners = [];
    this.users = new Map();
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer('|', '|');
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer('|', '|');
    }
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.network.addConnectionListener((e: ConnectionEvent) => {
      const socket = e.socket;
      socket.addRequestListener(this.handleRequest(socket).bind(this));
      e.accept();
    });
    this.network.listen();
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

  private handleRequest(socket: Socket) {
    return (e: RequestEvent) => {
      if (e.key === registerId) {
        // Check if socket is already registered, if so, give them their ID
        for (const id of this.users.keys()) {
          const existingUser = this.users.get(id)!;
          if (existingUser.socket === socket) {
            e.respond(id);
            return;
          }
        }
        // Socket is not registered, register it
        const newId = generateUID();
        const user = new AuthUser(newId, socket, this.serializer,
          this.deserializer);
        this.users.set(newId, user);
        for (const listener of this.listeners) {
          const authSock = new AuthSocket(user);
          listener(new AuthConnectionEvent(authSock));
        }
      }
      else if (e.key === loginId) {
        // If id exists, replace sock with the given id
        const id = e.message;
        if (this.users.has(id)) {
          const user = this.users.get(id)!;
          user.socket = socket;
          // Resend all outstanding requests
          user.refresh();
        }
      }
      else if (this.users.has(e.key)) {
        const user = this.users.get(e.key)!;
        user.handleRequest(e.message);
      }
    };
  }

}
