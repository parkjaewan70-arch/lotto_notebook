export type Selection = '자동' | '수동' | '반자동';
export type Mode = 'random' | 'filter' | 'avoid';
export type Draw = { round:number; date:string; numbers:number[]; bonus:number; winners?:number; prizes:Partial<Record<1|2|3|4|5,number>>; source:string };
export type Game = { id:string; round:number; numbers:number[]; selection:Selection; note:string; favorite:boolean; createdAt:string; seed?:string };
export type Purchase = { id:string; amount:number; at:string };
export type Filters = { include:number[]; exclude:number[]; odd:number|null; min:number; max:number; consecutive:boolean; endingLimit:number };
export type ResponseData = { draws:Draw[]; warning:string; source:string };
