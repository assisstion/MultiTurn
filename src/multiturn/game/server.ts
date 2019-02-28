import { ServerSyncLayer, StateManager } from '../sync/server';
import Player from './player';
import ServerStateManager from './state';

// Type of player: R
// Type of state: T
export default class Server<R, T> {

  public readonly maxPlayers: number;

  private state: ServerStateManager<R, T>;

  public constructor(
    private mainLoop: (server: Server<R, T>) => Promise<void>,
    private syncLayer: ServerSyncLayer,
    stateMask: (state: T, player: Player<R>) => string,
    remoteGenerator: new () => R,
    options: ServerOptions<T>
  ) {
    this.maxPlayers = options.maxPlayers;
    this.state = new ServerStateManager(this, options.state,
      stateMask, remoteGenerator, options.typePath);
    this.syncLayer.state = this.state;
  }

  public async start() {
    this.syncLayer.listen();

    // Wait until enough players have joined
    await this.state.waitForPlayers();

    // Run main loop forever
    while (true) {
      try {
        await this.mainLoop.call(this.mainLoop, this);
      }
      catch (err) {
        console.log('Error occurred while running main loop!');
        console.error(err);
      }
    }
  }

  public getPlayers(): Array<Player<R>> {
    return this.state.getPlayers();
  }
}

interface ServerOptions<T> {
  state: T;
  maxPlayers: number;
  typePath: string;
}
