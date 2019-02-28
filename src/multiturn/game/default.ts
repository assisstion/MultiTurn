import AuthServerNetworkLayer from '../auth-network/server/layer';
import RepeatServerSyncLayer from '../repeat-sync/server/layer';
import SIOServerNetworkLayer from '../sio-network/server/layer';
import { SIOServer } from '../sio-network/sio-external';
import UniversalStateManager from '../state/universal';
import { ServerSyncLayer } from '../sync/server';
import Player from './player';

export function defaultSyncLayer(io: SIOServer): ServerSyncLayer {
  const netLayer = new SIOServerNetworkLayer(io);
  const authLayer = new AuthServerNetworkLayer(netLayer);
  const stateManager = new UniversalStateManager('');
  const syncLayer = new RepeatServerSyncLayer(authLayer, stateManager);
  return syncLayer;
}

export function defaultStateMask<R, T>():
    (state: T, player: Player<R>) => string {
  return (state, _) => {
    return JSON.stringify(state);
  };
}
