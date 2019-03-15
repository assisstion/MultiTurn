import { NetworkLayer, ConnectionEvent, RequestEvent } from '../../network/network';
import { ClientSyncLayer, ClientSyncResponder, ClientSyncCombinedEvent } from '../../sync/client';

const requestId = '_syncRequest';
const updateId = '_syncUpdate';
const emptyResponse = '';

function validateRequest(r: any): r is ClientSyncCombinedEvent {
  if (r.state !== undefined) {
    return true;
  }
  else {
    return false;
  }
}

export default class RepeatClientSyncLayer implements ClientSyncLayer {

  private listening: boolean = false;

  public constructor(public layer: NetworkLayer,
    public responder: ClientSyncResponder) {

  }

  public listen(): void {
    if (this.listening) {
      return;
    }
    this.listening = true;
    this.layer.addConnectionListener((e: ConnectionEvent) => {
      const sock = e.accept();
      sock.addRequestListener((e2: RequestEvent) => {
        if (e2.key === requestId) {
          const requestEvent = JSON.parse(e2.message);
          if (validateRequest(requestEvent)) {
            this.responder.onUpdateState(requestEvent)
              .then(() => this.responder.onRequest(requestEvent))
              .then((s: string) => e2.respond(s));
          }
          else {
            console.log('[Sync][Warn] Invalid request!');
          }
        } else if (e2.key === updateId) {
          this.responder.onUpdateState({state: e2.message})
            .then(() => e2.respond(emptyResponse));
        }
      });
    });
    this.layer.listen();
  }
}
