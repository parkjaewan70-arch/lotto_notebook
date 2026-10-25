'use client';
import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import {canSpend} from './budget';
import type {Game,Purchase} from './types';
type Store={games:Game[];purchases:Purchase[];budget:number;dark:boolean;setBudget:(n:number)=>void;toggleTheme:()=>void;saveGame:(g:Game)=>'saved'|'duplicate'|'budget';remove:(id:string)=>void;favorite:(id:string)=>void;purchase:(amount:number)=>boolean};
export const useStore=create<Store>()(persist((set,get)=>({games:[],purchases:[],budget:20000,dark:false,setBudget:n=>{if(Number.isFinite(n)&&n>=0)set({budget:Math.floor(n)});},toggleTheme:()=>set({dark:!get().dark}),saveGame:g=>{const s=get();if(s.games.some(x=>x.round===g.round&&x.numbers.join(',')===g.numbers.join(',')))return 'duplicate';if(!canSpend(s.budget,s.purchases,1000))return 'budget';set({games:[g,...s.games]});return 'saved';},remove:id=>set({games:get().games.filter(g=>g.id!==id)}),favorite:id=>set({games:get().games.map(g=>g.id===id?{...g,favorite:!g.favorite}:g)}),purchase:amount=>{const s=get();if(!canSpend(s.budget,s.purchases,amount))return false;set({purchases:[{id:crypto.randomUUID(),amount,at:new Date().toISOString()},...s.purchases]});return true;}}),{name:'lotto-notebook-v1',storage:createJSONStorage(()=>localStorage),version:1}));
