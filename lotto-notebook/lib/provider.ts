import 'server-only';
import {load} from 'cheerio';
import {unstable_cache} from 'next/cache';
import seed from '../data/seed.json';
import type {Draw,ResponseData} from './types';
import {validNumbers} from './math';
const memory=new Map<number,Draw>();
const active=new Map<number,Promise<Draw|null>>();
let queue=Promise.resolve();let last=0;
const source='https://www.dhlottery.co.kr/lt645/result';
export function validateDraw(d:Draw) {if(!Number.isInteger(d.round)||d.round<1||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!validNumbers(d.numbers)||!validNumbers([d.bonus],1)||d.numbers.includes(d.bonus)||Object.values(d.prizes).some(x=>!Number.isFinite(x)||x!<0))throw Error('공식 결과 형식 불일치');return d;}
function legacy(j:Record<string,unknown>,round:number):Draw {if(j.returnValue!=='success'||Number(j.drwNo)!==round)throw Error('회차 불일치');return validateDraw({round,date:String(j.drwNoDate),numbers:[1,2,3,4,5,6].map(i=>Number(j['drwtNo'+i])),bonus:Number(j.bnusNo),winners:Number(j.firstPrzwnerCo),prizes:{1:Number(j.firstWinamnt)},source});}
export function parsePage(html:string,round:number):Draw {const $=load(html);const script=$('script[type="application/json"][data-lotto-result]').text();if(script){const d=validateDraw(JSON.parse(script));if(d.round!==round)throw Error('회차 불일치');return {...d,source};}
 const heading=$('.win_result h4').text();if(!heading.includes(round+'회'))throw Error('공식 페이지 구조 변경 또는 동적 페이지');const numbers=$('.win_result .num.win .ball_645').map((_,e)=>Number($(e).text())).get();const bonus=Number($('.win_result .num.bonus .ball_645').text());const date=$('.win_result .desc').text().match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);if(!date)throw Error('추첨일 누락');const prizes:Draw['prizes']={};let winners:number|undefined;$('table tbody tr').each((_,el)=>{const cells=$(el).find('td');const r=Number(cells.eq(0).text().replace(/\D/g,''));if(r>=1&&r<=5){const amount=Number(cells.eq(3).text().replace(/\D/g,''));if(amount>0)prizes[r as 1|2|3|4|5]=amount;if(r===1)winners=Number(cells.eq(2).text().replace(/\D/g,''));}});return validateDraw({round,date:`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`,numbers,bonus,winners,prizes,source});}
async function politeFetch(url:string) {let done!:()=>void;const before=queue;queue=new Promise<void>(r=>{done=r;});await before;try{await new Promise(r=>setTimeout(r,Math.max(0,1100-(Date.now()-last))));last=Date.now();const response=await fetch(url,{headers:{'User-Agent':'LottoNotebook/1.0 (read-only official results)'},redirect:'follow',signal:AbortSignal.timeout(6000),cache:'no-store'});if(!response.ok)throw Error('원본 서버 응답 오류');return await response.text();}finally{done();}}
const fetchCached=unstable_cache(async(round:number)=>{let d:Draw;try{d=legacy(JSON.parse(await politeFetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`)),round);}catch{d=parsePage(await politeFetch(`${source}?ltEpsd=${round}`),round);}memory.set(round,d);return d;},['official-draw-v1'],{revalidate:false});
async function one(round:number) {if(memory.has(round))return memory.get(round)!;if(active.has(round))return active.get(round)!;const task=fetchCached(round).catch(()=>null).finally(()=>active.delete(round));active.set(round,task);return task;}
export async function getResults(end:number,n:number):Promise<ResponseData> {const draws:Draw[]=[];let warning='';if(process.env.LOTTO_FETCH_ENABLED==='true'){for(let r=end;r>Math.max(0,end-n);r--){const d=await one(r);if(d)draws.push(d);else{warning='공식 조회 실패: 마지막 캐시와 확인된 보관 자료만 표시합니다.';break;}}}else warning='외부 수집 비활성화: robots·이용약관 검토 전에는 보관 자료만 표시합니다.';
 for(const d of [...memory.values(),...seed as Draw[]])if(d.round<=end&&d.round>end-n&&!draws.some(x=>x.round===d.round))draws.push(d);
 if(!draws.length){draws.push(...seed as Draw[]);warning+=' 요청 구간 자료가 없어 2021년 보관 회차 1개를 대신 표시합니다. 최신 결과가 아닙니다.';}
 draws.sort((a,b)=>b.round-a.round);if(draws.length<n)warning+=` 요청 ${n}회 중 실제 표시 ${draws.length}회. 누락 회차를 채우거나 통계를 추정하지 않습니다.`;return {draws,warning,source};}
