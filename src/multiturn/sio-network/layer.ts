import { NetworkLayer, ConnectionEvent } from '../network';
import SIOConnectionEvent from './connectionevent';
import { Serializer, Deserializer,
  defaultSerializer, defaultDeserializer } from './serializer';
import SIONetworkSocket from './socket';

/**
 * A socket.io based implementation of the Network layer
 */
export default class SIONetworkLayer implements NetworkLayer {

  private serializer: Serializer;
  private deserializer: Deserializer;
  private listeners: Array<(e: ConnectionEvent) => void>;
  private listening: boolean = false;

  public constructor(private io: SocketIO.Server, serializer?: Serializer,
    deserializer?: Deserializer) {
    this.listeners = [];
    if (serializer) {
      this.serializer = serializer;
    }
    else {
      this.serializer = defaultSerializer('$');
    }
    if (deserializer) {
      this.deserializer = deserializer;
    }
    else {
      this.deserializer = defaultDeserializer('$');
    }
  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.io.on('connection', (socket: SocketIO.Socket) => {
      for (const listener of this.listeners) {
        const internalSocket = new SIONetworkSocket(socket,
          this.serializer, this.deserializer);
        const event = new SIOConnectionEvent(internalSocket);
        listener(event);
      }
    });
  }

  public addConnectionListener(callback: (e: ConnectionEvent) => void): void {
    this.listeners.push(callback);
  }

}
