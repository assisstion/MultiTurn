import { Client } from '../multiturn/game/client';
import { remote } from '../multiturn/remote/remote';
import { ClientSyncStateEvent } from '../multiturn/sync/client';
import Board from './board';
import Move from './move';

type StateListener = (s: Board) => void;

export default class Remote implements Client<Remote> {
  private playerNum!: number;
  private state!: Board;
  private latestMoveResolver?: (m: Move) => void;
  private stateListeners: StateListener[] = [];

  @remote(Move)
  public getMove(): Promise<Move> {
    return new Promise((resolve, reject) => {
      // Wait for a button to be pressed
      this.latestMoveResolver = resolve;
    });
  }

  // Client methods
  public updateState(e: ClientSyncStateEvent) {
    this.state = JSON.parse(e.state) as Board;
    for (const listener of this.stateListeners) {
      listener(this.state);
    }
  }

  public getRemote(): Remote {
    return this;
  }

  public gameOver(message: string) {
    console.log(`Game over! Player ${message} wins!`);
  }

  public addStateListener(listener: StateListener) {
    this.stateListeners.push(listener);
  }

  public resolveMove(x: number, y: number) {
    const move = new Move(x, y);
    if (this.latestMoveResolver) {
      this.latestMoveResolver(move);
    }
  }
}
