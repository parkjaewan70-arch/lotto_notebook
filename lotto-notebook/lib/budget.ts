import type {Purchase} from './types';
export function koreaDate(date=new Date()) {return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function monthSpent(entries:Purchase[],date=new Date()) {const month=koreaDate(date).slice(0,7);return entries.filter(e=>koreaDate(new Date(e.at)).startsWith(month)).reduce((s,e)=>s+e.amount,0);}
export function canSpend(budget:number,entries:Purchase[],amount:number,date=new Date()) {return Number.isFinite(budget)&&budget>=0&&Number.isInteger(amount)&&amount>=0&&monthSpent(entries,date)+amount<=budget;}
export function weekSpent(entries:Purchase[],date=new Date()) {const today=new Date(koreaDate(date)+'T00:00:00+09:00');const localDay=new Date(koreaDate(date)+'T00:00:00Z').getUTCDay();const monday=today.getTime()-((localDay+6)%7)*86400000;return entries.filter(e=>new Date(e.at).getTime()>=monday&&new Date(e.at).getTime()<=date.getTime()).reduce((s,e)=>s+e.amount,0);}
