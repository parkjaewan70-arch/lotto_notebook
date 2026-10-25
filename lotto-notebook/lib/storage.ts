import type {Game,Purchase} from './types';
export type Snapshot={games:Game[];purchases:Purchase[];budget:number};
export interface StorageAdapter {load():Promise<Snapshot|null>;save(value:Snapshot):Promise<void>}
export class LocalAdapter implements StorageAdapter {async load(){const raw=localStorage.getItem('lotto-export');return raw?JSON.parse(raw) as Snapshot:null;}async save(value:Snapshot){localStorage.setItem('lotto-export',JSON.stringify(value));}}
// A future server adapter can implement this contract without changing calculations.
