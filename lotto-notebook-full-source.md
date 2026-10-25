# 로또 노트 — 파일 트리 및 전체 코드

프로젝트 소스 전체입니다. node_modules와 빌드 산출물은 제외하며 npm ci로 재구성합니다.

```text
lotto-notebook/
  .env.example
  .gitignore
  README.md
  app/api/cron/route.ts
  app/api/results/route.ts
  app/globals.css
  app/layout.tsx
  app/page.tsx
  components/Balls.tsx
  components/Charts.tsx
  data/seed.json
  lib/budget.ts
  lib/constants.ts
  lib/math.ts
  lib/provider.ts
  lib/storage.ts
  lib/store.ts
  lib/types.ts
  next-env.d.ts
  next.config.mjs
  package-lock.json
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tests/core.test.ts
  tsconfig.json
  vercel.cron.example.json
```

## .env.example

```example
# robots와 이용약관 검토 후에만 true. 자동 우회나 인증 접근은 하지 않습니다.
LOTTO_FETCH_ENABLED=false
CRON_SECRET=

```

## .gitignore

```text
node_modules/
.next/
.env.local
*.tsbuildinfo
.cache/

```

## README.md

```md
# 로또 노트

Next.js 14 App Router + TypeScript + Tailwind CSS + Zustand + Recharts + Framer Motion으로 만든 로컬 우선 번호·정보 관리 앱입니다. 자동 구매·결제·계정 접근 기능은 없습니다. 이 프로젝트는 소스 코드 전달용이며 배포는 수행하지 않았습니다.

## 시작하기

Node.js 20.19 이상 권장. ZIP을 풀고 프로젝트 폴더에서 실행합니다.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 http://localhost:3000 을 여세요. 기본값으로 외부 조회 없이 보관 자료 1회차가 표시되며 생성·저장·예산 기능을 이용할 수 있습니다.

```bash
npm test
npm run typecheck
npm run build
npm start
```

`package-lock.json`을 함께 제공하므로 `npm ci`로 설치 버전을 고정합니다. Next.js 14.2.35를 사용합니다. 실제 공개 운영 전 현재 보안 지원 정책 및 관련 패치를 재확인하세요.

## 구현 범위

- 1~5게임 균등 무작위 추출, 조건 필터, 64개 후보 묶음 비교 방식의 혼잡도 회피. 같은 생성 묶음 내 중복 제거.
- 홀짝 개수, 합계, 연속 허용, 끝수 제한, 포함/제외, 수동·자동·반자동.
- 암호학적 Web Crypto 난수와 modulo bias 없는 rejection sampling. 재현 옵션은 HMAC-SHA256 counter stream. 같은 시드·모드·필터·게임 수·직전 회차 조건으로 재현합니다. 시드는 추첨 결과에 영향을 주지 않습니다.
- 혼잡도 가중치는 lib/constants.ts의 WEIGHTS. 생일 편중은 31 이하 개수/6, 연속 쌍은 쌍 개수/5, 나머지는 0 또는 1로 정규화합니다. 시각적 직선은 7열 격자에서 가로·세로·대각선의 연속 3개 이상입니다. 모든 끝수가 같다는 조건은 6/45의 서로 다른 6개에서는 성립하지 않지만 요청 산식을 그대로 보존했습니다.
- 혼잡도는 실제 판매 선택 분포로 검증한 모델이 아닙니다. 낮은 점수가 실제 공동 당첨자 수 감소나 분배금 증가를 입증하지 않습니다. 직전 회차가 없으면 해당 항목 0점과 불완전 표시를 노출합니다.
- 실제 확보 회차만 통계 계산. 번호·보너스 히트맵/차트, 홀짝·합계·끝수 분포, 연속 포함률, 공식 1등 당첨자 수 추이. 빈 공식 값은 표시하지 않습니다.
- 회차별 보관함·즐겨찾기·메모·수동 입력·슬립 5게임. 동일 회차·동일 조합 저장 중복 방지.
- 2등은 본번호 정확히 5개 + 보너스. 1~3등 당첨금은 공식 값만 사용. 자료 없으면 판정 또는 금액 보류. 4·5등 고정 금액. 세율 자동 적용 없이 사용자가 확인한 공제액만 입력하여 세후 참고액 표시.
- 월 예산과 한국 시간 기준 실제 구매 기록, 월·주 집계. 생성 예정 게임 비용과 개별 저장 비용이 남은 예산을 넘으면 차단. 실제 구매 기록 시에도 차단. 생성/저장은 구매가 아니므로 예산을 차감하지 않습니다. 계획액을 자동으로 지출로 집계하지 않습니다.
- 이용 30분 후 휴식 권유. 라이트·다크, 반응형 360px부터, 숫자 표기, 키보드 포커스, 차트 수치 표 대안, 동작 감소 설정 대응.

## 중요한 산술 정정

요청 원본 표는 `PROVIDED_ODDS`로 보존하고 정보 탭 접기 영역에 표시합니다. 실제 계산 상수 `ODDS`는 아래처럼 정정했습니다.

|항목|요청값|직접 계산값|
|---|---:|---:|
|3등 조합 수|234|228 = 6×38|
|3등 역수 분모|34,808|약 35,723.9|
|2등 백분율|0.0000742%|약 0.0000737%|
|3등 백분율|0.00287%|약 0.0027992%|
|3개 이상 당첨 합계|194,136|194,130|

본번호 5개 선택은 6가지, 남은 일반 번호는 45−6−1(보너스)=38가지입니다. 요청값 234는 2등 6가지를 포함하므로 이를 별도로 더하면 중복입니다. 전체 45C6=8,145,060과 1등 역수는 변함없습니다. 등위별 표시 확률은 반올림입니다.

## 데이터 소스·폴백

1. 서버만 지정 UA + redirect follow로 구형 JSON 엔드포인트 호출.
2. 실패하면 공식 결과 HTML(`lt645/result?ltEpsd=...`) 파싱. 회차·날짜·본번호·보너스를 모두 검증합니다. 레거시 `.win_result` 구조만 실제 추출 대상으로 하며 공식 페이지가 JS 렌더링으로 바뀌면 안전하게 실패합니다. JSON script adapter도 제공하나 현재 공식 페이지의 채택 여부는 검증하지 않았습니다.
3. 실패 시 마지막 Next Data Cache / 인스턴스 메모리 / 확인된 `data/seed.json` 순으로 이용. 공식 구조를 추측하여 값으로 채우지 않습니다.

확인된 보관 데이터는 동행복권 공식 Facebook 게시물의 962회(2021-05-08) 본번호와 보너스 1건입니다. 1등 당첨자 수·변동 당첨금은 미확보로 비워 둡니다. 요청 구간에 데이터가 없으면 이 과거 자료로 대체했다는 배너를 표시합니다. 최신 20개나 100개를 검증한 것처럼 제공하지 않습니다. 통계는 기본 요청 100회지만 실제 샘플 수를 표시합니다.

Next unstable_cache는 검증 완료 회차만 무기한 보관합니다. 요청 실패는 캐시하지 않습니다. 회차별 in-flight 중복 제거 및 인스턴스당 1.1초 간격 직렬화. 실패 첫 회차에서 중단하여 차단 서버에 반복 요청하지 않습니다. 분산 배포 전체의 초당 한도는 이 프로세스 큐로 보장되지 않으므로 여러 인스턴스에서는 공유 rate limiter가 추가로 필요합니다. Vercel 캐시 보존은 플랫폼 정책에 따릅니다. 인스턴스 메모리만 영속 저장으로 간주하지 않습니다.

### 환경변수

- `LOTTO_FETCH_ENABLED=false`: 기본값. 공식 robots.txt/약관을 이 환경에서 열람·검증하지 못하여 자동 수집을 중지했습니다. 운영자가 적용 약관·robots의 해당 경로 허용 여부를 직접 확인한 뒤에만 true로 변경하세요. 금지된 경로는 활성화하지 마세요.
- `CRON_SECRET`: Cron용 Bearer 인증값. 미설정이면 401. 클라이언트로 노출하지 마세요.

클라이언트는 오직 `/api/results`에 요청합니다. 구형 JSON에서는 1등 당첨금만 제공하므로 2·3등 금액을 추정하지 않습니다. 파싱 실패는 정상 오류 상태입니다. 향후 공식 구조 변화 시 실제 원문을 확보한 후 parser와 fixture 테스트를 갱신해야 합니다. 실제 공식 서버 end-to-end 성공은 확인하지 못했습니다.

## 배포 (Vercel)

1. 이 폴더를 개인 Git 저장소로 올립니다. `.env.local`과 node_modules는 올리지 않습니다.
2. Vercel에서 가져오고 Next.js 프로젝트로 배포합니다.
3. 위 환경변수를 설정합니다. 외부 수집은 허용 여부를 먼저 확인합니다.
4. 주 1회 갱신이 필요하면 `vercel.cron.example.json`을 `vercel.json`으로 복사합니다. `0 12 * * 6`은 토요일 21:00 KST입니다. Vercel에 CRON_SECRET을 설정합니다.
5. 공식 서비스 지연 시 수동으로 통계 탭의 조회를 실행합니다. Cron은 최신 추정 회차 1개만 가져오며 당첨 결과를 생성하지 않습니다.

서버 저장은 선택 사항입니다. `lib/storage.ts`의 StorageAdapter를 구현하여 Supabase 등으로 확장할 수 있습니다. 현재 실제 상태 영속성은 Zustand localStorage이고 Adapter는 확장 계약입니다. 브라우저 데이터 삭제에 대비한 서버 백업은 구현하지 않았습니다.

## 출처와 안내 위치

- 첫 화면: 1게임 확률과 고정성. 결과 카드: 같은 확률과 분배금/예산 안내.
- 정보 탭: 요청 제공 운영 정보 전체, 산술 정정, 동행복권 소개/이용안내/추첨결과.
- 모든 탭의 footer: 미성년 구매 금지, 오락·예산 고지, 비공식 서비스 고지, 확률 고정 안내, 한국도박문제예방치유원 자가진단·상담 안내 홈페이지 링크.
- 보관함: 국세청 기준 확인 고지, 세율 하드코딩 없음.
- 정부/기관의 전화번호를 추측해 넣지 않고 공식 기관 홈페이지로 안내합니다.

참조 URL:
https://www.dhlottery.co.kr/lt645/intro
https://www.dhlottery.co.kr/userGuide
https://www.dhlottery.co.kr/lt645/result
https://www.facebook.com/donghanglottery/posts/860008458253750/
https://www.kcgp.or.kr
https://www.nts.go.kr
https://nextjs.org/blog/security-update-2025-12-11

운영·법령·전자지급 정보는 요청 제공값을 출처와 함께 표시하되 최신 전체 검증 완료로 표현하지 않습니다.

## 검증 범위

Vitest는 등위 판정, 보너스 구분, 조합 수, 확률 표, 생성·시드·필터·중복, 통계·혼잡도, 한국 날짜 경계, 실제 Zustand 구매/저장 예산 차단을 검사합니다. 생성 버튼도 동일한 canSpend 함수를 사용합니다. 테스트 로그의 localStorage 부재 경고는 Node 환경에만 해당합니다.

브라우저 실기기·Lighthouse·키보드 전체 흐름·WCAG 대비 수치 및 Vercel 배포는 검증하지 않았습니다. LCP 2.5초와 모든 필터/기기에서 100ms 이내 생성은 보장하지 않습니다. 일반 무작위는 빠르게 처리하나 좁은 필터와 회피 모드는 10,000회 시도 제한으로 더 오래 걸릴 수 있습니다. 무한 반복 대신 명확한 조건 오류를 반환합니다.

전체 파일 트리와 모든 텍스트 파일의 전체 코드는 프로젝트 바깥의 `lotto-notebook-full-source.md`에 포함됩니다. 의존성 잠금 파일도 생략 없이 포함됩니다.

```

## app/api/cron/route.ts

```ts
import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/provider';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'인증 필요'},{status:401});const round=Math.floor((Date.now()-Date.parse('2002-12-07T20:40:00+09:00'))/604800000)+1;return NextResponse.json(await getResults(round,1));}

```

## app/api/results/route.ts

```ts
import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/provider';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(req:NextRequest){const end=Number(req.nextUrl.searchParams.get('round')||1247),n=Number(req.nextUrl.searchParams.get('n')||100);if(!Number.isInteger(end)||end<1||end>10000||!Number.isInteger(n)||n<1||n>100)return NextResponse.json({error:'회차 1~10000, 조회 수 1~100'}, {status:400});return NextResponse.json(await getResults(end,n));}

```

## app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
:root{color-scheme:light;--bg:#f4f6fb;--paper:#fff;--ink:#172844;--muted:#56647b;--border:#dce3ef;--blue:#2256ce}html.dark{color-scheme:dark;--bg:#101a2c;--paper:#18253b;--ink:#f1f5ff;--muted:#b8c4da;--border:#3c4b63;--blue:#91b4ff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;line-height:1.6;font-variant-numeric:tabular-nums}header{max-width:1200px;margin:auto;padding:24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border)}a{color:var(--blue);text-underline-offset:4px}.brand{text-decoration:none;font-size:22px;font-weight:800;color:var(--ink)}.brand small{display:block;font-size:10px;letter-spacing:3px}main{max-width:1200px;margin:auto;padding:48px 24px}.eyebrow{font-size:11px;letter-spacing:3px;color:var(--blue);font-weight:700}h1{font-size:clamp(32px,5vw,52px);line-height:1.2;letter-spacing:-2px;font-weight:800;margin:16px 0}h2{font-size:21px;font-weight:750;margin:0 0 18px}h3{font-size:16px;font-weight:700;margin:0 0 14px}.lead{color:var(--muted);margin-bottom:28px}.notice{padding:20px 24px;background:var(--paper);border:1px solid var(--border);border-left:4px solid var(--blue);border-radius:12px;margin:20px 0}.notice p{margin:6px 0 0}.effects{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:20px 0}.effects span{font-size:14px;font-weight:700}.effects small{display:block;color:var(--muted);font-weight:400}.status{font-size:12px;color:var(--muted);border-bottom:1px solid var(--border);padding-bottom:20px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:24px;margin-top:28px}.panel{background:var(--paper);border:1px solid var(--border);padding:24px;border-radius:16px;margin-bottom:20px;min-width:0}.sectionhead{display:flex;align-items:center;justify-content:space-between;gap:8px}.sectionhead span{font-size:10px;letter-spacing:1px;color:var(--muted)}button{border:1px solid var(--border);border-radius:8px;padding:9px 13px;color:var(--ink);background:var(--paper);cursor:pointer;font-size:13px;min-height:40px}button:hover{border-color:var(--blue)}button:disabled{opacity:.6;cursor:wait}.primary{background:#2256ce;color:#fff;border-color:#2256ce;width:100%;margin-top:18px;font-weight:700;padding:15px}.segmented{display:flex;gap:6px;background:var(--bg);border-radius:10px;padding:5px}.segmented button{flex:1;border:0;background:transparent;padding:9px 4px}.segmented .active{background:var(--paper);color:var(--blue);box-shadow:0 2px 5px #10204012}p{font-size:14px}.muted{color:var(--muted);font-size:12px}.fields{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:18px 0}label{display:flex;flex-direction:column;gap:7px;font-size:12px;color:var(--muted);flex:1;min-width:100px}input,select{width:100%;background:var(--paper);color:var(--ink);border:1px solid var(--border);border-radius:8px;padding:10px;font:inherit;min-height:42px}.check{flex-direction:row;align-items:center;min-width:140px;margin:12px 0}.check input{width:16px;min-height:16px}.balls{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.ball{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;font-weight:800;color:#fff;box-shadow:inset 0 -4px 8px #0002;font-size:17px}.b1{background:linear-gradient(135deg,#ffdc64,#efab2a);color:#493000}.b2{background:#2164b8}.b3{background:#bd3749}.b4{background:#596477}.b5{background:#177649}.prob{font-size:12px;color:var(--muted)}summary{cursor:pointer;font-size:13px;padding:10px 0}table{width:100%;border-collapse:collapse;font-size:12px;overflow-wrap:anywhere}td,th{padding:12px 6px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}th{font-weight:700}th:first-child{min-width:65px}td{color:var(--muted)}.big{font-size:30px;font-weight:700}.big small{font-size:12px;color:var(--muted);font-weight:400}progress{width:100%;accent-color:#2256ce;height:7px}.chart{height:210px;font-size:11px}.heatmap{display:grid;grid-template-columns:repeat(9,1fr);gap:6px}.heatmap div{border:1px solid var(--border);border-radius:7px;padding:8px 2px;text-align:center}.heatmap small{display:block;font-size:10px}.slips{display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:10px;overflow:auto;margin-bottom:24px;padding:10px;background:var(--paper);border:1px solid var(--border);border-radius:12px}.slip strong{color:#bd3749}.grid7{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.grid7 span{text-align:center;border:1px solid var(--border);font-size:9px;min-height:21px}.grid7 .marked{background:var(--ink);color:var(--paper);font-weight:800}footer{max-width:1200px;margin:0 auto;padding:24px 24px 120px;border-top:1px solid var(--border);font-size:12px;color:var(--muted)}footer p{font-size:12px;margin:4px 0}nav{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);width:min(480px,calc(100% - 32px));display:flex;padding:6px;background:var(--paper);border:1px solid var(--border);border-radius:16px;box-shadow:0 8px 30px #0002;z-index:10}nav button{flex:1;border:0;background:transparent;display:flex;flex-direction:column;align-items:center;font-size:11px}nav span{font-size:20px}nav .selected{color:var(--blue);background:var(--bg);font-weight:700}.backdrop{position:fixed;inset:0;background:#0009;display:grid;place-items:center;padding:24px;z-index:20}.modal{max-width:420px;width:100%}:focus-visible{outline:3px solid #e88a00;outline-offset:3px}@media(max-width:760px){main{padding:28px 16px}.workspace{grid-template-columns:1fr}.panel{padding:18px}.effects{gap:8px}.effects span{font-size:12px}.effects small{font-size:10px}.heatmap{grid-template-columns:repeat(7,1fr)}header{padding:16px}aside{order:2}.balls{gap:6px}.ball{width:44px;height:44px}footer{padding-left:16px;padding-right:16px}}

```

## app/layout.tsx

```tsx
import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'로또 노트 | 6/45 정보·번호관리',description:'공식 결과를 참고하고 번호와 예산을 기록하는 도구'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}

```

## app/page.tsx

```tsx
'use client';
import {useEffect,useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {Balls,Slip} from '@/components/Balls';
import {useStore} from '@/lib/store';
import {canSpend,monthSpent,weekSpent} from '@/lib/budget';
import {crowding,defaultFilters,generate,prize,statistics,validNumbers} from '@/lib/math';
import {FACTS,ODDS,PROVIDED_ODDS,PRICE,PROBABILITY,RESULT_NOTICE,SOURCES} from '@/lib/constants';
import type {Draw,Filters,Game,Mode,ResponseData,Selection} from '@/lib/types';
const Chart=dynamic(()=>import('@/components/Charts').then(m=>m.Chart),{ssr:false,loading:()=> <p>차트 불러오는 중…</p>});
const labels:Record<string,string>={birthday:'31 이하 번호 비율',consecutive:'연속 쌍 / 최대 5쌍',sum:'합계 100~180',arithmetic:'3개 이상 등차수열',line:'7열 격자 직선 3개 이상',previous:'선택 기준 회차와 3개 이상 중복',extreme:'모두 홀·짝 또는 같은 끝수'};
function parse(text:string){if(!text.trim())return [];const a=text.trim().split(/[\s,]+/).map(Number);if(!validNumbers(a,a.length))throw Error('1~45의 서로 다른 정수를 입력하세요');return a.sort((a,b)=>a-b);}
function NumberField({label,value,onChange,min,max}:{label:string;value:number;onChange:(n:number)=>void;min:number;max:number}){return <label>{label}<input type="number" value={value} min={min} max={max} onChange={e=>onChange(Number(e.target.value))}/></label>}
export default function Page(){const store=useStore();const [ready,setReady]=useState(false),[tab,setTab]=useState(0),[mode,setMode]=useState<Mode>('random'),[count,setCount]=useState(5),[filters,setFilters]=useState<Filters>(defaultFilters),[include,setInclude]=useState(''),[exclude,setExclude]=useState(''),[seed,setSeed]=useState(''),[seedEnabled,setSeedEnabled]=useState(false),[selection,setSelection]=useState<Selection>('자동'),[round,setRound]=useState(1248),[end,setEnd]=useState(1247),[n,setN]=useState(100),[draws,setDraws]=useState<Draw[]>([]),[warning,setWarning]=useState('공식 자료를 불러오는 중입니다.'),[results,setResults]=useState<number[][]>([]),[resultSeed,setResultSeed]=useState<string|undefined>(),[busy,setBusy]=useState(false),[modal,setModal]=useState(''),[note,setNote]=useState(''),[manual,setManual]=useState(''),[archive,setArchive]=useState('all'),[onlyFavorites,setOnlyFavorites]=useState(false),[spend,setSpend]=useState(5000),[tax,setTax]=useState(''),[breakTime,setBreakTime]=useState(false);
 useEffect(()=>{setReady(true);const timer=setTimeout(()=>setBreakTime(true),30*60*1000);return()=>clearTimeout(timer);},[]);
 useEffect(()=>{document.documentElement.classList.toggle('dark',store.dark);},[store.dark]);
 async function refresh(){setWarning('공식 자료 조회 중…');try{const response=await fetch(`/api/results?round=${end}&n=${n}`);if(!response.ok)throw Error();const data:ResponseData=await response.json();setDraws(data.draws);setWarning(data.warning);}catch{setWarning('조회 실패. 이미 표시된 자료만 유지합니다.');}}
 useEffect(()=>{void refresh();},[]); // Explicit refresh avoids repeated requests during input.
 const stat=useMemo(()=>statistics(draws),[draws]);const previous=draws.find(d=>d.round===round-1)?.numbers??[];
 const visible=store.games.filter(g=>(archive==='all'||String(g.round)===archive)&&(!onlyFavorites||g.favorite));
 function guard(amount:number){if(!canSpend(store.budget,store.purchases,amount)){setModal('설정한 예산을 초과했습니다');return false;}return true;}
 async function create(){if(!guard(count*PRICE))return;setBusy(true);try{if(!Number.isInteger(round)||round<1)throw Error('저장할 회차를 확인하세요');const inc=selection==='반자동'?parse(include):mode==='random'?[]:parse(include);if(selection==='반자동'&&(inc.length<1||inc.length>5))throw Error('반자동은 1~5개를 직접 선택하세요');const f=mode==='random'?{...defaultFilters,include:inc}:{...filters,include:inc,exclude:parse(exclude)};const usedSeed=seedEnabled?(seed||crypto.randomUUID()):undefined;const games=await generate(count,mode,f,previous,usedSeed);setResults(games);setResultSeed(usedSeed);if(usedSeed)setSeed(usedSeed);}catch(e){setModal((e as Error).message);}finally{setBusy(false);}}
 function save(numbers:number[],method:Selection=selection){if(!guard(PRICE))return;const game:Game={id:crypto.randomUUID(),round,numbers,selection:method,note,favorite:false,createdAt:new Date().toISOString(),seed:resultSeed};const result=store.saveGame(game);setModal(result==='saved'?'번호를 저장했습니다. 구매 기록은 별도로 입력하세요.':result==='duplicate'?'이 회차에 이미 저장된 조합입니다.':'설정한 예산을 초과했습니다');}
 return <><header><a className="brand" href="/">◉ 로또 노트 <small>6/45 NOTEBOOK</small></a><button onClick={store.toggleTheme} aria-label="화면 색상 전환">{ready&&store.dark?'☀ 라이트':'☾ 다크'}</button></header><main><div className="eyebrow">NUMBER · DATA · BALANCE</div><h1>번호는 가볍게,<br/>기록은 정확하게.</h1><p className="lead">나의 번호와 지출을 한곳에서 관리하는 데이터 노트</p><section className="notice"><strong>1게임의 1등 확률은 1/8,145,060 · 0.0000123%로 고정입니다.</strong><p>어떤 번호 선택 전략도 이 값을 바꾸지 못합니다.</p></section><div className="effects"><span>01 기대 수령액 <small>당첨 시 분배금 참고</small></span><span>02 예산 효율 <small>중복 제거·게임 수 관리</small></span><span>03 정보 품질 <small>공식 과거 통계 · 예측 아님</small></span></div><p className="status" role="status">{warning}</p>{breakTime&&<section className="notice">30분 이상 사용했습니다. 잠시 화면에서 벗어나 쉬세요. <button onClick={()=>setBreakTime(false)}>확인</button></section>}
 <div className="workspace"><div>{tab===0&&<><section className="panel"><div className="sectionhead"><h2>번호 생성</h2><span>01 / GENERATE</span></div><div className="segmented">{(['random','filter','avoid'] as Mode[]).map((m,i)=><button aria-pressed={mode===m} className={mode===m?'active':''} key={m} onClick={()=>setMode(m)}>{['균형 무작위','필터 지정','회피 모드'][i]}</button>)}</div><p>{mode==='random'?'구간 균형을 강제하지 않고 1~45에서 균등하게 추출합니다.':mode==='filter'?'선택 조건에 맞는 조합만 표시합니다.':'64개 후보 묶음에서 혼잡도 점수가 가장 낮은 조합을 선택합니다. 전역 최솟값은 아닙니다.'}</p><div className="fields"><label>선택 방식<select value={selection} onChange={e=>setSelection(e.target.value as Selection)}><option>자동</option><option>반자동</option></select></label><NumberField label="게임 수" min={1} max={5} value={count} onChange={setCount}/><NumberField label="저장 대상 회차" min={1} max={10000} value={round} onChange={setRound}/></div>{(mode!=='random'||selection==='반자동')&&<div className="fields"><label>포함 번호 (쉼표 구분)<input value={include} onChange={e=>setInclude(e.target.value)} placeholder="예: 4, 17"/></label>{mode!=='random'&&<label>제외 번호<input value={exclude} onChange={e=>setExclude(e.target.value)}/></label>}</div>}{mode!=='random'&&<div className="fields"><label>홀수 개수<select value={filters.odd??'any'} onChange={e=>setFilters({...filters,odd:e.target.value==='any'?null:Number(e.target.value)})}><option value="any">제한 없음</option>{[0,1,2,3,4,5,6].map(x=><option key={x}>{x}</option>)}</select></label><NumberField label="합계 최소" min={21} max={255} value={filters.min} onChange={min=>setFilters({...filters,min})}/><NumberField label="합계 최대" min={21} max={255} value={filters.max} onChange={max=>setFilters({...filters,max})}/><NumberField label="동일 끝수 최대 개수" min={1} max={6} value={filters.endingLimit} onChange={endingLimit=>setFilters({...filters,endingLimit})}/><label className="check"><input type="checkbox" checked={filters.consecutive} onChange={e=>setFilters({...filters,consecutive:e.target.checked})}/>연속번호 허용</label></div>}<label className="check" title="시드는 재현용입니다. 시드를 바꿔도 각 조합의 추첨 확률은 같습니다."><input type="checkbox" checked={seedEnabled} onChange={e=>setSeedEnabled(e.target.checked)}/>재현용 시드 저장 ⓘ</label>{seedEnabled&&<input aria-label="재현용 시드" value={seed} onChange={e=>setSeed(e.target.value)} placeholder="비우면 안전한 무작위 시드 생성"/>}<button className="primary" disabled={busy||!ready} onClick={create}>{busy?'조합을 구성하는 중…':`${count}게임 생성하기 →`}</button><p className="muted">생성·저장은 구매가 아닙니다. 예산은 직접 입력한 실제 구매 이력으로 계산합니다.</p></section>{results.length>0&&<section aria-live="polite"><h2>이번에 생성한 번호</h2><p className="notice">{RESULT_NOTICE}</p><label>메모<input value={note} onChange={e=>setNote(e.target.value)}/></label>{results.map((a,i)=>{const score=crowding(a,previous);return <article className="panel" key={a.join(',')}><div className="sectionhead"><h3>GAME {'ABCDE'[i]}</h3><button onClick={()=>save(a)}>보관함에 저장</button></div><Balls numbers={a}/><p className="prob">{PROBABILITY}</p><details><summary>인기 조합 혼잡도(낮을수록 유리: 분배금 기준) <b>{score.score}/100</b></summary><p>규칙 기반 가정이며 실제 인기 분포 검증 자료가 없습니다. 당첨된다면 덜 나눠 받을 가능성을 살펴보는 참고값이며 분배금 증가를 보장하지 않습니다.</p><table><tbody>{score.details.map(d=><tr key={d.key}><th>{labels[d.key]}</th><td>{(d.weight*100).toFixed(0)}% × {d.value.toFixed(2)} = {d.points.toFixed(1)}</td></tr>)}</tbody></table><p>직전 회차 자료 {previous.length?'있음':'없음: 해당 항목 0점, 회피 점수 불완전'}.</p></details>{resultSeed&&<p>시드: {resultSeed}</p>}</article>})}<Slip games={results}/></section>}</>}
 {tab===1&&<><section className="notice"><strong>과거 출현 빈도는 다음 회차 확률에 영향을 주지 않습니다. 추첨은 매 회차 독립입니다.</strong></section><section className="panel"><h2>과거 회차 통계</h2><div className="fields"><NumberField label="마지막 회차" min={1} max={10000} value={end} onChange={setEnd}/><NumberField label="최근 N회" min={1} max={100} value={n} onChange={setN}/><button onClick={refresh}>공식 자료 조회</button></div><p>실제 자료 {draws.length}회 · {draws.at(-1)?.round}~{draws[0]?.round}회. 현재 표시 자료 기준, 연속번호 포함 회차 비율 {(stat.consecutiveRate*100).toFixed(1)}%.</p><h3>번호별 출현 빈도</h3><div className="heatmap">{stat.frequency.map((v,i)=><div key={i} style={{background:`rgba(37,99,235,${.06+v/Math.max(1,...stat.frequency)*.2})`}}><b>{i+1}</b><small>{v}회</small></div>)}</div></section>{[['홀수 개수별 회차 수',stat.odd],['합계 분포',stat.sums],['끝수 분포',stat.endings],['보너스 번호 빈도',stat.bonus]].map(([title,values],i)=><Chart key={String(title)} title={String(title)} data={(values as number[]).map((v,j)=>({label:i===1?`${j*50}~${Math.min(255,j*50+49)}`:i===3?j+1:j,value:v}))}/>)}<Chart title="회차별 1등 당첨자 수" line data={stat.winners.map(d=>({label:d.round,value:d.winners!}))}/></>}
 {tab===2&&<><section className="panel"><h2>내 번호 보관함</h2><p>이 브라우저에만 저장됩니다. 저장소 삭제 시 소실될 수 있습니다.</p><div className="fields"><NumberField label="저장 회차" min={1} max={10000} value={round} onChange={setRound}/><label>수동 번호 6개<input value={manual} onChange={e=>setManual(e.target.value)} placeholder="1, 8, 17, 26, 34, 45"/></label><label>메모<input value={note} onChange={e=>setNote(e.target.value)}/></label><button onClick={()=>{try{const a=parse(manual);if(!validNumbers(a))throw Error('서로 다른 번호 6개를 입력하세요');save(a,'수동');}catch(e){setModal((e as Error).message);}}}>수동 저장</button></div><div className="fields"><label>회차별 보기<select value={archive} onChange={e=>setArchive(e.target.value)}><option value="all">전체 회차</option>{Array.from(new Set(store.games.map(g=>g.round))).sort((a,b)=>b-a).map(r=><option key={r}>{r}</option>)}</select></label><label className="check"><input type="checkbox" checked={onlyFavorites} onChange={e=>setOnlyFavorites(e.target.checked)}/>즐겨찾기만</label><label>세후 참고용 공제액 (직접 확인)<input type="number" min="0" value={tax} onChange={e=>setTax(e.target.value)} placeholder="세율 자동 적용 없음"/></label></div><p>국세청 기준으로 세율 확인이 필요합니다. 공제액 입력 시에만 세후 참고액을 계산하며 실제 지급액과 다를 수 있습니다. <a href={SOURCES.tax}>국세청</a></p></section>{!visible.length&&<p className="panel">저장된 번호가 없습니다. 생성한 조합을 보관하거나 수동으로 입력하세요.</p>}{visible.map(g=>{const draw=draws.find(d=>d.round===g.round);const result=draw?prize(g.numbers,draw):null;return <article className="panel" key={g.id}><div className="sectionhead"><h3>{g.round}회 · {g.selection}</h3><div><button aria-label="즐겨찾기 전환" aria-pressed={g.favorite} onClick={()=>store.favorite(g.id)}>{g.favorite?'★':'☆'}</button><button onClick={()=>store.remove(g.id)}>삭제</button></div></div><Balls numbers={g.numbers}/><p>{g.note}</p><p>{result?result.rank?`${result.rank}등 · 세전 ${result.gross===null?'공식 당첨금 자료 없음':result.gross.toLocaleString()+'원'}`:'당첨 없음':'해당 회차 공식 결과 미확보: 판정 보류'}</p>{result?.gross!=null&&tax!==''&&Number(tax)>=0&&<p>세후 참고액 {Math.max(0,result.gross-Number(tax)).toLocaleString()}원 (직접 입력 공제액 기준)</p>}{g.seed&&<small>시드 {g.seed}</small>}</article>})}<Slip games={visible.slice(0,5).map(g=>g.numbers)}/></>}
 {tab===3&&<><section className="panel"><h2>로또 6/45 이용 정보</h2><table><tbody>{FACTS.map(([k,v])=><tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table><h3>등수별 조합 수와 확률</h3><p>총 8,145,060조합 기준. 분모와 백분율은 반올림한 표기입니다.</p><table><thead><tr><th>등수</th><th>조합 수</th><th>확률</th></tr></thead><tbody>{ODDS.map(o=><tr key={o.rank}><th>{o.rank}등</th><td>{o.count.toLocaleString()}</td><td>1/{o.denominator}<br/>{o.percent}%</td></tr>)}<tr><th>3개 이상 합계</th><td>194,130</td><td>약 1/42 · 2.383%</td></tr></tbody></table><p className="notice">산술 정정: 3등은 보너스 번호를 제외한 6×38=228조합입니다. 요청 원본의 234는 2등 6조합을 중복 집계합니다. 따라서 당첨 합계는 194,130입니다. 아래 원본은 비교용이며 계산에 사용하지 않습니다.</p><details><summary>요청 원본 참고표 (산술 불일치 있음)</summary><table><tbody>{PROVIDED_ODDS.map(o=><tr key={o.rank}><th>{o.rank}등</th><td>{o.count.toLocaleString()}조합</td><td>1/{o.denominator} · {o.percent}%</td></tr>)}</tbody></table></details><h3>왜 확률은 못 높이나</h3><p>45개에서 순서 없이 6개를 고르는 방법은 45! ÷ (6! × 39!) = 8,145,060개입니다. 공정한 추첨에서 각 조합은 같은 가능성을 가집니다. 과거 결과와 다음 추첨은 독립입니다.</p><p>1·2·3등은 등위별 배분액을 당첨자 수로 나누는 파리뮤추얼 구조입니다. 다른 사람이 덜 선택한 조합이라면 당첨 시 나눌 사람이 적을 수 있지만, 혼잡도 점수는 실제 구매 비율을 측정한 값이 아닙니다.</p><h3>출처</h3>{Object.entries(SOURCES).filter(([k])=>['intro','guide','result'].includes(k)).map(([k,v])=><p key={k}><a href={v}>{k==='intro'?'동행복권 로또6/45 소개':k==='guide'?'동행복권 이용안내':'동행복권 추첨결과'} ↗</a></p>)}<p>보관 자료: <a href={draws[0]?.source??SOURCES.result}>표시 회차의 원본 출처</a>. 최신 데이터가 아닐 수 있습니다.</p></section></>}
 </div><aside><section className="panel budget"><div className="sectionhead"><h2>나의 예산</h2><span>MONTHLY</span></div><NumberField label="월 예산 (원)" min={0} max={1000000} value={store.budget} onChange={store.setBudget}/><p className="big">{ready?monthSpent(store.purchases).toLocaleString():0}<small> / {store.budget.toLocaleString()}원</small></p><progress value={monthSpent(store.purchases)} max={store.budget||1} aria-label="월 예산 사용량"/><p>이번 주 실제 기록 <b>{ready?weekSpent(store.purchases).toLocaleString():0}원</b></p><p>1주 5,000원 = 커피 한 잔 값 (예시)</p><NumberField label="실제 구매액 직접 기록 (원)" min={1000} max={100000} value={spend} onChange={setSpend}/><button onClick={()=>{if(!Number.isInteger(spend)||spend<1000||spend%1000){setModal('1,000원 단위 금액을 입력하세요');return;}setModal(store.purchase(spend)?'구매 이력을 기록했습니다.':'설정한 예산을 초과했습니다');}}>구매 이력 기록</button><p className="muted">결제 기능은 없습니다. 구매 이력과 번호 저장은 서로 별도이며, 생성·저장은 예산을 차감하지 않습니다.</p></section><section className="panel"><h3>데이터 원칙</h3><p>실제 확보한 회차만 계산합니다. 누락된 당첨금과 당첨자 수는 추정하지 않습니다.</p><a href={SOURCES.result}>공식 결과 확인 ↗</a></section></aside></div></main><footer><strong>만 19세 미만은 복권을 구매할 수 없습니다.</strong><p>복권은 오락입니다. 감당 가능한 금액만 구매하세요.</p><p>본 앱은 동행복권·기획재정부와 무관한 비공식 정보 제공 서비스입니다.</p><p>당첨 확률은 어떤 방법으로도 높일 수 없습니다.</p><a href={SOURCES.help}>한국도박문제예방치유원 · 자가진단 및 상담 안내 ↗</a><p>지출이나 이용 시간을 조절하기 어렵다면 기관의 상담 안내를 확인하세요.</p></footer><nav aria-label="주요 메뉴">{['생성','통계','내 번호','정보'].map((t,i)=><button key={t} aria-current={tab===i?'page':undefined} className={tab===i?'selected':''} onClick={()=>setTab(i)}><span aria-hidden>{['◈','▥','▣','ⓘ'][i]}</span>{t}</button>)}</nav>{modal&&<div className="backdrop"><section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="panel modal"><h2 id="dialog-title">{modal}</h2><button autoFocus className="primary" onClick={()=>setModal('')} onKeyDown={e=>{if(e.key==='Escape')setModal('');if(e.key==='Tab')e.preventDefault();}}>확인</button></section></div>}</>;
}

```

## components/Balls.tsx

```tsx
'use client';
import {motion,useReducedMotion} from 'framer-motion';
export function Balls({numbers}:{numbers:number[]}){const reduce=useReducedMotion();return <div className="balls" aria-label={`번호 ${numbers.join(', ')}`}>{numbers.map((n,i)=><motion.span initial={reduce?false:{y:8,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:i*.04,duration:.2}} className={`ball b${Math.ceil(n/10)}`} key={n}>{n}</motion.span>)}</div>}
export function Slip({games}:{games:number[][]}){return <div className="slips">{Array.from({length:5},(_,i)=><div key={i} className="slip"><strong>{'ABCDE'[i]}</strong><div className="grid7">{Array.from({length:45},(_,j)=><span key={j} className={games[i]?.includes(j+1)?'marked':''} aria-label={`${j+1}${games[i]?.includes(j+1)?' 선택':''}`}>{j+1}{games[i]?.includes(j+1)?'●':''}</span>)}</div></div>)}</div>}

```

## components/Charts.tsx

```tsx
'use client';
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,LineChart,Line} from 'recharts';
export function Chart({title,data,line=false}:{title:string;data:{label:string|number;value:number}[];line?:boolean}){return <section className="panel"><h3>{title}</h3>{!data.length?<p>공식 자료가 없습니다.</p>:<><div className="chart" role="img" aria-label={title}><ResponsiveContainer width="100%" height="100%">{line?<LineChart data={data}><XAxis dataKey="label"/><YAxis/><Tooltip/><Line dataKey="value" stroke="#3b82f6" dot={false}/></LineChart>:<BarChart data={data}><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[5,5,0,0]}/></BarChart>}</ResponsiveContainer></div><details><summary>수치 표 보기</summary><table><tbody>{data.map(d=><tr key={d.label}><th>{d.label}</th><td>{d.value}</td></tr>)}</tbody></table></details></>}</section>}

```

## data/seed.json

```json
[{"round":962,"date":"2021-05-08","numbers":[1,18,28,31,34,43],"bonus":40,"prizes":{},"source":"https://www.facebook.com/donghanglottery/posts/860008458253750/"}]

```

## lib/budget.ts

```ts
import type {Purchase} from './types';
export function koreaDate(date=new Date()) {return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function monthSpent(entries:Purchase[],date=new Date()) {const month=koreaDate(date).slice(0,7);return entries.filter(e=>koreaDate(new Date(e.at)).startsWith(month)).reduce((s,e)=>s+e.amount,0);}
export function canSpend(budget:number,entries:Purchase[],amount:number,date=new Date()) {return Number.isFinite(budget)&&budget>=0&&Number.isInteger(amount)&&amount>=0&&monthSpent(entries,date)+amount<=budget;}
export function weekSpent(entries:Purchase[],date=new Date()) {const today=new Date(koreaDate(date)+'T00:00:00+09:00');const localDay=new Date(koreaDate(date)+'T00:00:00Z').getUTCDay();const monday=today.getTime()-((localDay+6)%7)*86400000;return entries.filter(e=>new Date(e.at).getTime()>=monday&&new Date(e.at).getTime()<=date.getTime()).reduce((s,e)=>s+e.amount,0);}

```

## lib/constants.ts

```ts
export const TOTAL = 8_145_060;
export const PRICE = 1000;
export const PROBABILITY = '이 조합의 1등 확률: 1/8,145,060 (변경 불가) · 0.0000123%';
export const RESULT_NOTICE = '확률은 동일합니다. 이 앱은 확률이 아니라 분배금과 예산 관리를 돕습니다.';
export const WEIGHTS = {birthday:.30,consecutive:.15,sum:.10,arithmetic:.15,line:.15,previous:.10,extreme:.05} as const;
export const PROVIDED_ODDS = [
 {rank:1,count:1,denominator:'8,145,060',percent:'0.0000123'},
 {rank:2,count:6,denominator:'1,357,510',percent:'0.0000742'},
 {rank:3,count:234,denominator:'34,808',percent:'0.00287'},
 {rank:4,count:11115,denominator:'733',percent:'0.1365'},
 {rank:5,count:182780,denominator:'44.6',percent:'2.244'}
];
export const SOURCES = {intro:'https://www.dhlottery.co.kr/lt645/intro',guide:'https://www.dhlottery.co.kr/userGuide',result:'https://www.dhlottery.co.kr/lt645/result',help:'https://www.kcgp.or.kr',tax:'https://www.nts.go.kr'};
export const FACTS = [
 ['게임','1~45 중 순서 무관 6개 선택. 보너스 1개는 2등 판정용 별도 추첨.'],
 ['선택','수동 / 자동 / 반자동(1~5개 직접 선택 후 나머지 자동).'],
 ['추첨','매주 토요일 MBC TV 생방송 20:35~20:40. 공기혼합방식 비너스(VENUS). 경찰관·NH농협은행 본점 입회하 당일 봉인 출고, 스튜디오 CCTV 통제 및 방청객 입회.'],
 ['당첨금','총 당첨금은 판매액의 50%. 1·2·3등은 등위별 배분액을 당첨자 수로 나눔. 4등 50,000원 / 5등 5,000원. 등위별 배분 비율은 별도 추정하지 않음.'],
 ['구매 한도','판매점 1인 1회 100,000원 / 인터넷 회차당 1인 5,000원(PC·모바일 합산) / 사이트 통합 1일 150,000원.'],
 ['판매 시간','추첨일 20:00 마감, 다음 날 06:00까지 판매 중지. 채널별 운영시간은 공식 이용안내에서 추가 확인.'],
 ['수령','1등 NH농협은행 본점 / 2·3등 전국 지점 / 4·5등 판매점 / 전자지급 페이코. 지급기한 경과 시 복권기금 귀속. 채널·지급 조건은 공식 안내에서 확인.'],
 ['연령','만 19세 미만 구매 불가(복권 및 복권기금법).'],
 ['자료 상태','운영 정보는 요구사항 제공값. 최신 변경사항 전체를 검증하지 못했으므로 구매·수령 전 공식 안내 확인 필요.']
];

export const ODDS = [
 {rank:1,count:1,denominator:'8,145,060',percent:'0.0000123'},
 {rank:2,count:6,denominator:'1,357,510',percent:'0.0000737'},
 {rank:3,count:228,denominator:'35,723.9',percent:'0.0027992'},
 {rank:4,count:11115,denominator:'732.8',percent:'0.1364631'},
 {rank:5,count:182780,denominator:'44.6',percent:'2.2440596'}
];

```

## lib/math.ts

```ts
import {TOTAL,WEIGHTS} from './constants';
import type {Draw,Filters,Mode} from './types';
export function choose(n:number,k:number):number {let r=1;for(let i=1;i<=k;i++)r=r*(n-i+1)/i;return Math.round(r);}
export function validNumbers(a:number[],size=6) {return a.length===size&&new Set(a).size===size&&a.every(n=>Number.isInteger(n)&&n>=1&&n<=45);}
export function rank(numbers:number[],draw:Draw):0|1|2|3|4|5 {if(!validNumbers(numbers)||!validNumbers(draw.numbers)||draw.numbers.includes(draw.bonus)||!validNumbers([draw.bonus],1))throw Error('번호 형식 오류');const hits=numbers.filter(n=>draw.numbers.includes(n)).length;return hits===6?1:hits===5?(numbers.includes(draw.bonus)?2:3):hits===4?4:hits===3?5:0;}
export function prize(numbers:number[],draw:Draw) {const r=rank(numbers,draw);return {rank:r,gross:r===0?0:r===4?50000:r===5?5000:draw.prizes[r]??null};}
export const consecutivePairs=(a:number[])=>a.filter(n=>a.includes(n+1)).length;
function arithmetic(a:number[]) {return a.some(x=>a.some(y=>y>x&&a.includes(2*y-x)));}
function line(a:number[]) {const set=new Set(a);return a.some(n=>{const r=Math.floor((n-1)/7),c=(n-1)%7;return [[0,1],[1,0],[1,1],[1,-1]].some(([dr,dc])=>[1,2].every(t=>{const rr=r+dr*t,cc=c+dc*t;return rr>=0&&cc>=0&&cc<7&&set.has(rr*7+cc+1);}));});}
export function crowding(a:number[],previous:number[]=[]) {const total=a.reduce((s,n)=>s+n,0);const raw={birthday:a.filter(n=>n<=31).length/6,consecutive:consecutivePairs(a)/5,sum:Number(total>=100&&total<=180),arithmetic:Number(arithmetic(a)),line:Number(line(a)),previous:Number(a.filter(n=>previous.includes(n)).length>=3),extreme:Number(a.every(n=>n%2===0)||a.every(n=>n%2===1)||new Set(a.map(n=>n%10)).size===1)};const details=Object.entries(WEIGHTS).map(([key,weight])=>({key,weight,value:raw[key as keyof typeof raw],points:100*weight*raw[key as keyof typeof raw]}));return {score:Math.round(details.reduce((s,x)=>s+x.points,0)),details};}
export const defaultFilters:Filters={include:[],exclude:[],odd:null,min:21,max:255,consecutive:true,endingLimit:6};
export function matches(a:number[],f:Filters) {return f.include.every(n=>a.includes(n))&&!f.exclude.some(n=>a.includes(n))&&(f.odd===null||a.filter(n=>n%2).length===f.odd)&&a.reduce((s,n)=>s+n,0)>=f.min&&a.reduce((s,n)=>s+n,0)<=f.max&&(f.consecutive||consecutivePairs(a)===0)&&Array.from({length:10},(_,d)=>a.filter(n=>n%10===d).length).every(n=>n<=f.endingLimit);}
export type RandomInt=(max:number)=>Promise<number>;
// Rejection sampling removes modulo bias. Seeded HMAC counter streams are reproducible.
export function randomSource(seed?:string):RandomInt {let counter=0;let key:Promise<CryptoKey>|undefined;if(seed)key=crypto.subtle.importKey('raw',new TextEncoder().encode(seed),{name:'HMAC',hash:'SHA-256'},false,['sign']);return async max=>{const limit=Math.floor(2**32/max)*max;for(;;){let x:number;if(key){const bytes=await crypto.subtle.sign('HMAC',await key,new TextEncoder().encode(String(counter++)));x=new DataView(bytes).getUint32(0);}else{x=crypto.getRandomValues(new Uint32Array(1))[0];}if(x<limit)return x%max;}};}
export async function generate(count:number,mode:Mode,f:Filters,previous:number[]=[],seed?:string):Promise<number[][]> {if(!Number.isInteger(count)||count<1||count>5)throw Error('1~5게임만 생성할 수 있습니다');if(!validNumbers(f.include,f.include.length)||!validNumbers(f.exclude,f.exclude.length)||f.include.length>6||f.include.some(n=>f.exclude.includes(n))||45-f.exclude.length<6||f.min>f.max)throw Error('포함·제외 및 합계 조건을 확인하세요');const random=randomSource(seed);const out:number[][]=[];const seen=new Set<string>();let best:number[]|undefined;let score=Infinity;for(let attempt=0;attempt<10000&&out.length<count;attempt++){const pool=Array.from({length:45},(_,i)=>i+1).filter(n=>!f.exclude.includes(n)&&!f.include.includes(n));const a=[...f.include];while(a.length<6)a.push(pool.splice(await random(pool.length),1)[0]);a.sort((x,y)=>x-y);const key=a.join(',');if(seen.has(key)||!matches(a,f))continue;if(mode==='avoid'){const s=crowding(a,previous).score;if(s<score){best=a;score=s;}if(attempt%64!==63&&attempt<9999)continue;if(!best)continue;out.push(best);seen.add(best.join(','));best=undefined;score=Infinity;}else{out.push(a);seen.add(key);}}if(out.length<count)throw Error('조건을 만족하는 서로 다른 조합이 부족합니다. 조건을 완화하세요.');return out;}
export function statistics(draws:Draw[]) {const frequency=Array(45).fill(0) as number[],bonus=Array(45).fill(0) as number[],endings=Array(10).fill(0) as number[],odd=Array(7).fill(0) as number[],sums=Array(6).fill(0) as number[];for(const d of draws){d.numbers.forEach(n=>{frequency[n-1]++;endings[n%10]++;});bonus[d.bonus-1]++;odd[d.numbers.filter(n=>n%2).length]++;sums[Math.min(5,Math.floor(d.numbers.reduce((s,n)=>s+n,0)/50))]++;}return {frequency,bonus,endings,odd,sums,consecutiveRate:draws.length?draws.filter(d=>consecutivePairs(d.numbers)>0).length/draws.length:0,winners:draws.filter(d=>d.winners!==undefined).map(d=>({round:d.round,winners:d.winners}))};}
export const firstPercent=()=>100/TOTAL;

```

## lib/provider.ts

```ts
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

```

## lib/storage.ts

```ts
import type {Game,Purchase} from './types';
export type Snapshot={games:Game[];purchases:Purchase[];budget:number};
export interface StorageAdapter {load():Promise<Snapshot|null>;save(value:Snapshot):Promise<void>}
export class LocalAdapter implements StorageAdapter {async load(){const raw=localStorage.getItem('lotto-export');return raw?JSON.parse(raw) as Snapshot:null;}async save(value:Snapshot){localStorage.setItem('lotto-export',JSON.stringify(value));}}
// A future server adapter can implement this contract without changing calculations.

```

## lib/store.ts

```ts
'use client';
import {create} from 'zustand';
import {persist,createJSONStorage} from 'zustand/middleware';
import {canSpend} from './budget';
import type {Game,Purchase} from './types';
type Store={games:Game[];purchases:Purchase[];budget:number;dark:boolean;setBudget:(n:number)=>void;toggleTheme:()=>void;saveGame:(g:Game)=>'saved'|'duplicate'|'budget';remove:(id:string)=>void;favorite:(id:string)=>void;purchase:(amount:number)=>boolean};
export const useStore=create<Store>()(persist((set,get)=>({games:[],purchases:[],budget:20000,dark:false,setBudget:n=>{if(Number.isFinite(n)&&n>=0)set({budget:Math.floor(n)});},toggleTheme:()=>set({dark:!get().dark}),saveGame:g=>{const s=get();if(s.games.some(x=>x.round===g.round&&x.numbers.join(',')===g.numbers.join(',')))return 'duplicate';if(!canSpend(s.budget,s.purchases,1000))return 'budget';set({games:[g,...s.games]});return 'saved';},remove:id=>set({games:get().games.filter(g=>g.id!==id)}),favorite:id=>set({games:get().games.map(g=>g.id===id?{...g,favorite:!g.favorite}:g)}),purchase:amount=>{const s=get();if(!canSpend(s.budget,s.purchases,amount))return false;set({purchases:[{id:crypto.randomUUID(),amount,at:new Date().toISOString()},...s.purchases]});return true;}}),{name:'lotto-notebook-v1',storage:createJSONStorage(()=>localStorage),version:1}));

```

## lib/types.ts

```ts
export type Selection = '자동' | '수동' | '반자동';
export type Mode = 'random' | 'filter' | 'avoid';
export type Draw = { round:number; date:string; numbers:number[]; bonus:number; winners?:number; prizes:Partial<Record<1|2|3|4|5,number>>; source:string };
export type Game = { id:string; round:number; numbers:number[]; selection:Selection; note:string; favorite:boolean; createdAt:string; seed?:string };
export type Purchase = { id:string; amount:number; at:string };
export type Filters = { include:number[]; exclude:number[]; odd:number|null; min:number; max:number; consecutive:boolean; endingLimit:number };
export type ResponseData = { draws:Draw[]; warning:string; source:string };

```

## next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.

```

## next.config.mjs

```mjs
export default { experimental: { cpus: 2 }, poweredByHeader: false };

```

## package-lock.json

```json
{
  "name": "lotto-notebook",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "lotto-notebook",
      "version": "1.0.0",
      "dependencies": {
        "cheerio": "^1.0.0",
        "framer-motion": "^11.18.2",
        "next": "^14.2.35",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "recharts": "^2.15.4",
        "zustand": "^4.5.7"
      },
      "devDependencies": {
        "@types/node": "^22.10.0",
        "@types/react": "^18.3.18",
        "@types/react-dom": "^18.3.5",
        "autoprefixer": "^10.4.20",
        "postcss": "^8.5.1",
        "tailwindcss": "^3.4.17",
        "typescript": "^5.7.3",
        "vitest": "^3.2.4"
      }
    },
    "node_modules/@alloc/quick-lru": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/@alloc/quick-lru/-/quick-lru-5.3.0.tgz",
      "integrity": "sha512-U4+70Pc5ZS9osnCBCE5Jha/ciHM+Yp+CNMNC/7HvYbNRk1Ldd+f7qO65W5qfhu/TCv+/ozljlXXe9Nj8419DMA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.29.10",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.29.10.tgz",
      "integrity": "sha512-NpugTzbKgGrNe45Ui32cN8vCFFMxVtP/9rtfwv0nP5FRDAjvYBxJcLVpYA9mr1jxP6cnIT7x9LUzuDTbWYYNRA==",
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@esbuild/aix-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/aix-ppc64/-/aix-ppc64-0.28.2.tgz",
      "integrity": "sha512-XExcO+dvLKvVtNTibSTBej1NCAbaGhWn9Ww1ZPx80qsahhPFe/8jgWP0IchNe0F3HwkU7n8ejhH8bjonqht8mQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "aix"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm/-/android-arm-0.28.2.tgz",
      "integrity": "sha512-kXXoiPVVGQcnIYGOeaovwOURpniDBpSq4A03qkQ+BMQqtGG6HYap3xne9C1O1yo4TR3qxlCX5IqqmX6fFo2Lqg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-arm64/-/android-arm64-0.28.2.tgz",
      "integrity": "sha512-5YfKeeI8qWfBZIX+u2xZC3Zlb3Os/gLS2sbEKM+I4ZOcsWmHS2WLysCcQZDAFRslDUU5Oiq44gf6PYN1vGwG5A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/android-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/android-x64/-/android-x64-0.28.2.tgz",
      "integrity": "sha512-O387ite7SzUyCcy3JQX4P4bLtEA7bLLkx+esve5JHnyYfNTxcVpXZo9jhdB0lTKN44gztELTdU7nS8Nr16Fs1Q==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.28.2.tgz",
      "integrity": "sha512-n4KqkOQrraxHJcgjM1RvwbigfQKIKJVpM7xp+KsxiyUSrRdIXnt73VhrPAx0fV44hgfmIVKjxMN9J1t5jySVkw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/darwin-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/darwin-x64/-/darwin-x64-0.28.2.tgz",
      "integrity": "sha512-uq6suIWYP37qzGddBKPw5QEQPi6HiLGsO7UmkpfyaYNQ3D+rN6w6WfwH+nuqcGXWvawGwxOEroO4YGnFh95azw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-arm64/-/freebsd-arm64-0.28.2.tgz",
      "integrity": "sha512-n+I0BTSRIoy+d6RPKnEVwql5UwBJolytvY4mAOIEJorKlqgPII8ix6slVVrfZ5Tnj7glIZvloylbB/EJPMWEXw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/freebsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/freebsd-x64/-/freebsd-x64-0.28.2.tgz",
      "integrity": "sha512-78XJTJkvPs0kz2w61301PJjXl4g7q3JqiYMZ/M/yVI73EHBrCRTgkhu9oqG7vPqq+a/yadEW8aD+agKlk5xrmg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm/-/linux-arm-0.28.2.tgz",
      "integrity": "sha512-XlDnu2q5yoqems+xay6wSAcg9DDD7K9RLKZEBOMZm3ckNpJBvOX20tSfby8KfrrhINDyv9V2YVZKY/SpoGJI8w==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-arm64/-/linux-arm64-0.28.2.tgz",
      "integrity": "sha512-pW4AC0P3it8c7do9MVM4p51FzHzdM/TZrerurgRcHJ2WTa1VQ1CIq18xncfpBJw4ojkiZZrKW2yIBWBP92j6Ug==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ia32/-/linux-ia32-0.28.2.tgz",
      "integrity": "sha512-CYbnj78HsIeA+DhgUKgFCfvNsTHFhMMrinUrMZpDXJXKN8T3XViTZ/+wtHeVxEWY8ewSzTFN+nRmSwO2tZaLUQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-loong64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-loong64/-/linux-loong64-0.28.2.tgz",
      "integrity": "sha512-buwkd8nsph4R+ajRvw0qM5Hja/TXQow3ptzWO2EbG/cqcIkHloRrdlBtQlshyYGTNFvfkfJ5tpPLVkY4DtsPfQ==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-mips64el": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-mips64el/-/linux-mips64el-0.28.2.tgz",
      "integrity": "sha512-ZVykbDyk7519VwiNb9Lcj9m8XM6v5V9uKPvrEMkkEedVewf+0itkhahp4HDpgERXhwLRpWFypsGbG/J8s0QjJA==",
      "cpu": [
        "mips64el"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-ppc64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-ppc64/-/linux-ppc64-0.28.2.tgz",
      "integrity": "sha512-CAXl+Dtd9UUuJd8pKKdwh6MLm3MUMiqMPmhZ3tTSXPqfyQ3vDl6R5hZdZ/kYojK4ofXtdfSv1tFq8XzWx3heNQ==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-riscv64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-riscv64/-/linux-riscv64-0.28.2.tgz",
      "integrity": "sha512-GeXCej4IQtU1B+QlDV8W/RRvbzI3O/Stss+/bCXv4lZls5WGRtu2a+3JkA3i4qIUlMXpcHebWpF8AkJhATowuA==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-s390x": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-s390x/-/linux-s390x-0.28.2.tgz",
      "integrity": "sha512-3H1weTYZPxt/WOhByszQZybS9w5lKzUn1FDMsgEChbHWQwHYQQRfBxgCcZvPhjHfKyJjIievvMmEUawJrdY9Dg==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/linux-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/linux-x64/-/linux-x64-0.28.2.tgz",
      "integrity": "sha512-4xTZr1FUmSoQW4XIWmit3tzQrUTZM+N3P0XV8xROKYF50XfI7xeO90+1bZvNwxIufQ9hDQVRJH5YhgPVF8A/HQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-arm64/-/netbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-sSATRjPeDBg3pdgHoQfoYBob11Kk1FGa9lui5RIHZCoCkJa9QKlvl3/vKz2usCmYYjs7ymJR/2Nnsqe+Hjt5nw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/netbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/netbsd-x64/-/netbsd-x64-0.28.2.tgz",
      "integrity": "sha512-lqnzCV+mM0gIADaKihiCg6ifgfU2L3h5E33rNQBN1Y4MaVGnzryzmvvf7UHxprpQdE8hpqLolJ9Rl+SkIRDpyw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "netbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-arm64/-/openbsd-arm64-0.28.2.tgz",
      "integrity": "sha512-AL2qJILH7lNjrDmCQDvdxMfAUIv8KMNZOvrwAQ8i8//ntL9FflhOyMJ8OZSMBb8/AWXe3/5v5S20y3zCoZWKoQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openbsd-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openbsd-x64/-/openbsd-x64-0.28.2.tgz",
      "integrity": "sha512-QtiuPytchRyC4rwUKhexJdQKvDuZ6hWloi3igqPQNUJCS1/v9EiO3UTOXR6A3FoMo4fnAKbWJdqaIwhOzh8qEw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/openharmony-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/openharmony-arm64/-/openharmony-arm64-0.28.2.tgz",
      "integrity": "sha512-WkhYDmpTjLvGlScA1rwjRUmhl4k8oXR3cIbtqWmELgU/dFeHHlEllxDvdWcNJV9rbzCexB5vz8gtNewWLgCT7Q==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/sunos-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/sunos-x64/-/sunos-x64-0.28.2.tgz",
      "integrity": "sha512-GPMSkTOtMnv2U2F8gxe4Io6qmVs+YKyp832Etqqxr0hFngmXQ3rzwytelm3GIn7T4VviRUlf3sOgBOiTdvaf7g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "sunos"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-arm64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-arm64/-/win32-arm64-0.28.2.tgz",
      "integrity": "sha512-PIhhEkE9uPBleRBrQEJpUn7MBnibZzbGzYWPmY3x+YoVg/95zbjB4CxPPOQ8l5tYYM4mMaCthF8/1DIfBQQyWQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-ia32": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-ia32/-/win32-ia32-0.28.2.tgz",
      "integrity": "sha512-YmJbfTlvU7Sdn9BB+4PRES4oB6pxgS37MAONj+hBr/cpXS1aBPKXxNnDbu+QCWPj0o9dgyxeq79g6c5P8KeuYA==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@esbuild/win32-x64": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.28.2.tgz",
      "integrity": "sha512-5ebpxr3nWMzrL/rnUI755Jkuee0bHL/Gq0WTF9lvcpv73wAp5eu8MfBUgWK9bhWvZjj7yX8etf/8tI8Ney695g==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.13",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.13.tgz",
      "integrity": "sha512-2kkt/7niJ6MgEPxF0bYdQ6etZaA+fQvDcLKckhy1yIQOzaoKjBBjSj63/aLVjYE3qhRt5dvM+uUyfCg6UKCBbA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.0",
        "@jridgewell/trace-mapping": "^0.3.24"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.2.tgz",
      "integrity": "sha512-bRISgCIjP20/tbWSPWMEi54QVPRZExkuD9lJL+UIxUKtwVJA8wW1Trb1jMs1RFXo1CBTNZ/5hpC9QvmKWdopKw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.6.0.tgz",
      "integrity": "sha512-T7jf+5zgsZHwNJ4lvQ7/aezbyk0nNX+zJVWpmHA7VYsEx7a7qr5Rg5IbtJFqkgze5Y2sruq1RUY8Q837Od7iFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.31",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.31.tgz",
      "integrity": "sha512-zzNR+SdQSDJzc8joaeP8QQoCQr8NuYx2dIIytl1QeBEZHJ9uW6hebsrYgbz8hJwUQao3TWCMtmfV8Nu1twOLAw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.1.0",
        "@jridgewell/sourcemap-codec": "^1.4.14"
      }
    },
    "node_modules/@napi-rs/lzma-linux-x64-gnu": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/@napi-rs/lzma-linux-x64-gnu/-/lzma-linux-x64-gnu-1.5.1.tgz",
      "integrity": "sha512-oTXEIha4SsuXdTA4Iyskj0kpdx2yVXdhd75c2v3xGrHFfVMsbhTPZU/nMPL4sWKo4pBHm3aucLaqGlF696dTyQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": "^22.20 || ^24.12 || >=25"
      }
    },
    "node_modules/@next/env": {
      "version": "14.2.35",
      "resolved": "https://registry.npmjs.org/@next/env/-/env-14.2.35.tgz",
      "integrity": "sha512-DuhvCtj4t9Gwrx80dmz2F4t/zKQ4ktN8WrMwOuVzkJfBilwAwGr6v16M5eI8yCuZ63H9TTuEU09Iu2HqkzFPVQ==",
      "license": "MIT"
    },
    "node_modules/@next/swc-darwin-arm64": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-arm64/-/swc-darwin-arm64-14.2.33.tgz",
      "integrity": "sha512-HqYnb6pxlsshoSTubdXKu15g3iivcbsMXg4bYpjL2iS/V6aQot+iyF4BUc2qA/J/n55YtvE4PHMKWBKGCF/+wA==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-darwin-x64": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-darwin-x64/-/swc-darwin-x64-14.2.33.tgz",
      "integrity": "sha512-8HGBeAE5rX3jzKvF593XTTFg3gxeU4f+UWnswa6JPhzaR6+zblO5+fjltJWIZc4aUalqTclvN2QtTC37LxvZAA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-gnu": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-gnu/-/swc-linux-arm64-gnu-14.2.33.tgz",
      "integrity": "sha512-JXMBka6lNNmqbkvcTtaX8Gu5by9547bukHQvPoLe9VRBx1gHwzf5tdt4AaezW85HAB3pikcvyqBToRTDA4DeLw==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-arm64-musl": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-arm64-musl/-/swc-linux-arm64-musl-14.2.33.tgz",
      "integrity": "sha512-Bm+QulsAItD/x6Ih8wGIMfRJy4G73tu1HJsrccPW6AfqdZd0Sfm5Imhgkgq2+kly065rYMnCOxTBvmvFY1BKfg==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-gnu": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-gnu/-/swc-linux-x64-gnu-14.2.33.tgz",
      "integrity": "sha512-FnFn+ZBgsVMbGDsTqo8zsnRzydvsGV8vfiWwUo1LD8FTmPTdV+otGSWKc4LJec0oSexFnCYVO4hX8P8qQKaSlg==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-linux-x64-musl": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-linux-x64-musl/-/swc-linux-x64-musl-14.2.33.tgz",
      "integrity": "sha512-345tsIWMzoXaQndUTDv1qypDRiebFxGYx9pYkhwY4hBRaOLt8UGfiWKr9FSSHs25dFIf8ZqIFaPdy5MljdoawA==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-arm64-msvc": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-arm64-msvc/-/swc-win32-arm64-msvc-14.2.33.tgz",
      "integrity": "sha512-nscpt0G6UCTkrT2ppnJnFsYbPDQwmum4GNXYTeoTIdsmMydSKFz9Iny2jpaRupTb+Wl298+Rh82WKzt9LCcqSQ==",
      "cpu": [
        "arm64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-ia32-msvc": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-ia32-msvc/-/swc-win32-ia32-msvc-14.2.33.tgz",
      "integrity": "sha512-pc9LpGNKhJ0dXQhZ5QMmYxtARwwmWLpeocFmVG5Z0DzWq5Uf0izcI8tLc+qOpqxO1PWqZ5A7J1blrUIKrIFc7Q==",
      "cpu": [
        "ia32"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@next/swc-win32-x64-msvc": {
      "version": "14.2.33",
      "resolved": "https://registry.npmjs.org/@next/swc-win32-x64-msvc/-/swc-win32-x64-msvc-14.2.33.tgz",
      "integrity": "sha512-nOjfZMy8B94MdisuzZo9/57xuFVLHJaDj5e/xrduJp9CV2/HrfxTRH2fbyLe+K9QT41WBLUd4iXX3R7jBp0EUg==",
      "cpu": [
        "x64"
      ],
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ],
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@rollup/rollup-android-arm-eabi": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm-eabi/-/rollup-android-arm-eabi-4.65.0.tgz",
      "integrity": "sha512-t2AnVba25baFdq7gczzS13JyVcdubLVbFX1X04mxrggDrTQPUXNv3XM0k9H1hr5tqvg7AVvtQ720QHAj0iYqhg==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-android-arm64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-android-arm64/-/rollup-android-arm64-4.65.0.tgz",
      "integrity": "sha512-dNONUaEwPGhl/nuO2KV8VABWlcjYyU6KtZGN8dQv5OS5JU7JSCxPijVNKXbRJd0iuTzTiJ4TjPt/4bbvDRNiMQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "android"
      ]
    },
    "node_modules/@rollup/rollup-darwin-arm64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-arm64/-/rollup-darwin-arm64-4.65.0.tgz",
      "integrity": "sha512-zWQqUH+9zavr2Bxuzfpuv2SIF3X31cr58TvSQC9o1GhpOvkqRwr60GkZdQcudyT/BEgdpdSafjgd2I13MbTL7g==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-darwin-x64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-darwin-x64/-/rollup-darwin-x64-4.65.0.tgz",
      "integrity": "sha512-RQYreBFWtO4//hIuOaZkYUnF/lPU4lz35dveDimDshWCJvVisVtJ/shmT9bkXK8wFJY+FJF89X6F3Cq1qI3LCw==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-arm64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-arm64/-/rollup-freebsd-arm64-4.65.0.tgz",
      "integrity": "sha512-A0NfMj6Cuh/9BE5k3awJKv6HoxFVXIcLAb6SZqAMoxUHPA1ZNNK4RsGuUPD/vL7nEAm9LG+ZzXWWTrnC0XtkpA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-freebsd-x64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-freebsd-x64/-/rollup-freebsd-x64-4.65.0.tgz",
      "integrity": "sha512-BI6/H7q3aP0I7S7GOrjyxTjgEJlSnovXE38+bdxBpuKN6z+d//uF+T+VQ3Q7ltJL/71p17ufartARX9Ja5gOGQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "freebsd"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-gnueabihf": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-gnueabihf/-/rollup-linux-arm-gnueabihf-4.65.0.tgz",
      "integrity": "sha512-W1vUprf09RWaVWnsFP1vlUkEWJzTZlpObOEAYZXt9Fq0UVAOYEkeGr7wBX7McKqqIQskXdBnpiOMgwPujordgA==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm-musleabihf": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm-musleabihf/-/rollup-linux-arm-musleabihf-4.65.0.tgz",
      "integrity": "sha512-s8QTcZWgrl9haFzEGIqyE5BWyo89pFDGLMBFZ752WYxk8DJwNU/O1X6pZgPw829d9/sm6CCHyrMP3aurt76p1Q==",
      "cpu": [
        "arm"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-gnu/-/rollup-linux-arm64-gnu-4.65.0.tgz",
      "integrity": "sha512-ke1f6dLRzkqveyjjF2fkEwQYZvxHtNNwjegY8nJrwcO0Bdqr8CzFO/pKE0Bns13cx0qz2Ba2Y0Hs3dSwMdnHxA==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-arm64-musl": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-arm64-musl/-/rollup-linux-arm64-musl-4.65.0.tgz",
      "integrity": "sha512-926SMeUcy4y18Rz/w2aJiUKOnyAnm6czg72bXkQEaeemsll+Wr0hnsjb2BGRpHvWgwAMYy5ACJCotbvfLCfj0A==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-gnu/-/rollup-linux-loong64-gnu-4.65.0.tgz",
      "integrity": "sha512-6T7JNRP1hc4hqF2dUsEoVLOt9K8tmODoCLldtQRYnrddGGQY8Gqe2pM/qMMUo7EMowpP7oa2N95k0/8sYK/ipw==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-loong64-musl": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-loong64-musl/-/rollup-linux-loong64-musl-4.65.0.tgz",
      "integrity": "sha512-SImGFl1Je5kpyAgOCPONVT7h6ASV8mAUwGRjY7eZvVjPg//PfHOXgI+P241RF/+HqsA4PP3qD527ysWFKNQyhQ==",
      "cpu": [
        "loong64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-gnu/-/rollup-linux-ppc64-gnu-4.65.0.tgz",
      "integrity": "sha512-XeDTbmPF1Yu5asfXGPrMkWoxTDhgryQbmw5Q1+R582O51VNCk23J6f2pDrsAp5YkneBVBwtExx6ZGOb9D2aQ6A==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-ppc64-musl": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-ppc64-musl/-/rollup-linux-ppc64-musl-4.65.0.tgz",
      "integrity": "sha512-VS55JUI/1nsljmV/jfqNkLZXFw8uMO8nNlfoHmSevNf6fO3neuhyDvx9dv3c/Ytt8r/431SL8Qax1dpYvOMZTg==",
      "cpu": [
        "ppc64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-gnu/-/rollup-linux-riscv64-gnu-4.65.0.tgz",
      "integrity": "sha512-Vblw84TbX7RS4la1Y4+yQ7aore/oSyaNtFbppuBr5Vs/4LfBeXKq9dIfoExw6zOvRERqd2rRAjnZRaMhH/0x5w==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-riscv64-musl": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-riscv64-musl/-/rollup-linux-riscv64-musl-4.65.0.tgz",
      "integrity": "sha512-7+gHjtONvKgwR9InTKFaLq53f6YzBJkgeMRBENdWTsQr+spahGqQm8HF5aXpq8i4JaRrOqYyv6Zn1WltDTxaZQ==",
      "cpu": [
        "riscv64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-s390x-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-s390x-gnu/-/rollup-linux-s390x-gnu-4.65.0.tgz",
      "integrity": "sha512-KvNDC0J6s4vVHhtJ6KrDXU0Er0au/hmRIBq/+1maCV8TseGupeKizq0bWcrbp2HE1T8xoknvN0Q/KZ/YF0qX3w==",
      "cpu": [
        "s390x"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-gnu/-/rollup-linux-x64-gnu-4.65.0.tgz",
      "integrity": "sha512-GExdD15WPvu/x/drELjVam7vX8EsPgvTMOa/iJL/p/4m/oOqzbb7JXZg8fXR4hlXtg/sF2zyTZ3bR0AEtEMlhQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-linux-x64-musl": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-linux-x64-musl/-/rollup-linux-x64-musl-4.65.0.tgz",
      "integrity": "sha512-8sT9PemIZfIMED4Vd4KGoOXVDj5CMSWNcGdbheRUx9TYS03yOWdT2Q0lXPyEyNBB9YTilwewIQKNIBk6Nxi0Kg==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "linux"
      ]
    },
    "node_modules/@rollup/rollup-openbsd-x64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openbsd-x64/-/rollup-openbsd-x64-4.65.0.tgz",
      "integrity": "sha512-pO6Ehi0jo5yE0R6PltKhJhv9mlIiyzBJk5N5NUF2OF6xtVKI+1bdXxj/rb0jGXy3hck1ELVT0QPY3tzkAm360w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openbsd"
      ]
    },
    "node_modules/@rollup/rollup-openharmony-arm64": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-openharmony-arm64/-/rollup-openharmony-arm64-4.65.0.tgz",
      "integrity": "sha512-vo7N3/+cjjPDYr8vtxC+qSNgWa9sDvJ7g8N8R5SWqFY4WiNH1ULcAU70SKVyHeiIZOYYwNP9pTipmhN5sl1NPw==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "openharmony"
      ]
    },
    "node_modules/@rollup/rollup-win32-arm64-msvc": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-arm64-msvc/-/rollup-win32-arm64-msvc-4.65.0.tgz",
      "integrity": "sha512-ArwvgFAbjKcDM7qqotZ4OVYf+UMT9xH2YzkCzK4+AuZSDihMlz1Ekoe4INwBVXzn2mnJzuIYOcSx07iTBijGRQ==",
      "cpu": [
        "arm64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-ia32-msvc": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-ia32-msvc/-/rollup-win32-ia32-msvc-4.65.0.tgz",
      "integrity": "sha512-QGMmK4/cxKE/36FoLMSHQBCyymv/eFTnsCvvsBF0rgmOvVbvX78VWZRerL3dHa77f4pM6Xcc2iGDhJ10w/svKQ==",
      "cpu": [
        "ia32"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-gnu": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-gnu/-/rollup-win32-x64-gnu-4.65.0.tgz",
      "integrity": "sha512-XfKYFWHIPs4HPODIMsGF1IKlS3H1e3WokUZIgpmn4+uNnZBlnRDDHEylNyazbQXwhMKZre68OjtRYbKqb5+j8w==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@rollup/rollup-win32-x64-msvc": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/@rollup/rollup-win32-x64-msvc/-/rollup-win32-x64-msvc-4.65.0.tgz",
      "integrity": "sha512-wPWi++K4Bs1VR4XihOhfGi4IGX6Cub7FlerTf8X2v+2BtDHddgSqWCXwGD+h2yAe4/niIhNDwAltioOC+wEogQ==",
      "cpu": [
        "x64"
      ],
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "win32"
      ]
    },
    "node_modules/@swc/counter": {
      "version": "0.1.3",
      "resolved": "https://registry.npmjs.org/@swc/counter/-/counter-0.1.3.tgz",
      "integrity": "sha512-e2BR4lsJkkRlKZ/qCHPw9ZaSxc0MVUd7gtbtaB7aMvHeJVYe8sOB8DBZkP2DtISHGSku9sCK6T6cnY0CtXrOCQ==",
      "license": "Apache-2.0"
    },
    "node_modules/@swc/helpers": {
      "version": "0.5.5",
      "resolved": "https://registry.npmjs.org/@swc/helpers/-/helpers-0.5.5.tgz",
      "integrity": "sha512-KGYxvIOXcceOAbEk4bi/dVLEK9z8sZ0uBB3Il5b1rhfClSpcX0yfRO0KmTkqR2cnQDymwLB+25ZyMzICg/cm/A==",
      "license": "Apache-2.0",
      "dependencies": {
        "@swc/counter": "^0.1.3",
        "tslib": "^2.4.0"
      }
    },
    "node_modules/@types/chai": {
      "version": "5.2.3",
      "resolved": "https://registry.npmjs.org/@types/chai/-/chai-5.2.3.tgz",
      "integrity": "sha512-Mw558oeA9fFbv65/y4mHtXDs9bPnFMZAL/jxdPFUpOHHIXX91mcgEHbS5Lahr+pwZFR8A7GQleRWeI6cGFC2UA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/deep-eql": "*",
        "assertion-error": "^2.0.1"
      }
    },
    "node_modules/@types/d3-array": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/@types/d3-array/-/d3-array-3.2.2.tgz",
      "integrity": "sha512-hOLWVbm7uRza0BYXpIIW5pxfrKe0W+D5lrFiAEYR+pb6w3N2SwSMaJbXdUfSEv+dT4MfHBLtn5js0LAWaO6otw==",
      "license": "MIT"
    },
    "node_modules/@types/d3-color": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/@types/d3-color/-/d3-color-3.1.3.tgz",
      "integrity": "sha512-iO90scth9WAbmgv7ogoq57O9YpKmFBbmoEoCHDB2xMBY0+/KVrqAaCDyCE16dUspeOvIxFFRI+0sEtqDqy2b4A==",
      "license": "MIT"
    },
    "node_modules/@types/d3-ease": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-ease/-/d3-ease-3.0.2.tgz",
      "integrity": "sha512-NcV1JjO5oDzoK26oMzbILE6HW7uVXOHLQvHshBUW4UMdZGfiY6v5BeQwh9a9tCzv+CeefZQHJt5SRgK154RtiA==",
      "license": "MIT"
    },
    "node_modules/@types/d3-interpolate": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-interpolate/-/d3-interpolate-3.0.4.tgz",
      "integrity": "sha512-mgLPETlrpVV1YRJIglr4Ez47g7Yxjl1lj7YKsiMCb27VJH9W8NVM6Bb9d8kkpG/uAQS5AmbA48q2IAolKKo1MA==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-color": "*"
      }
    },
    "node_modules/@types/d3-path": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/@types/d3-path/-/d3-path-3.1.1.tgz",
      "integrity": "sha512-VMZBYyQvbGmWyWVea0EHs/BwLgxc+MKi1zLDCONksozI4YJMcTt8ZEuIR4Sb1MMTE8MMW49v0IwI5+b7RmfWlg==",
      "license": "MIT"
    },
    "node_modules/@types/d3-scale": {
      "version": "4.0.9",
      "resolved": "https://registry.npmjs.org/@types/d3-scale/-/d3-scale-4.0.9.tgz",
      "integrity": "sha512-dLmtwB8zkAeO/juAMfnV+sItKjlsw2lKdZVVy6LRr0cBmegxSABiLEpGVmSJJ8O08i4+sGR6qQtb6WtuwJdvVw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-time": "*"
      }
    },
    "node_modules/@types/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@types/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-kVd74ta9eof3eJOvbNd1vGKS/XERRyQbT26Og63hIsvDO84cjD5gEOhsXf26w3FSoNlPVz84DOFcKv/oou+fMw==",
      "license": "MIT",
      "dependencies": {
        "@types/d3-path": "*"
      }
    },
    "node_modules/@types/d3-time": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/@types/d3-time/-/d3-time-3.0.4.tgz",
      "integrity": "sha512-yuzZug1nkAAaBlBBikKZTgzCeA+k1uy4ZFwWANOfKw5z5LRhV0gNA7gNkKm7HoK+HRN0wX3EkxGk0fpbWhmB7g==",
      "license": "MIT"
    },
    "node_modules/@types/d3-timer": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/@types/d3-timer/-/d3-timer-3.0.2.tgz",
      "integrity": "sha512-Ps3T8E8dZDam6fUyNiMkekK3XUsaUEik+idO9/YjPtfj2qruF8tFBXS7XhtE4iIXBLxhmLjP3SXpLhVf21I9Lw==",
      "license": "MIT"
    },
    "node_modules/@types/deep-eql": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@types/deep-eql/-/deep-eql-4.0.2.tgz",
      "integrity": "sha512-c9h9dVVMigMPc4bwTvC5dxqtqJZwQPePsWjPlpSOnojbor6pGqdk541lfA7AqFQr5pB1BRdq0juY9db81BwyFw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/estree": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-1.0.9.tgz",
      "integrity": "sha512-GhdPgy1el4/ImP05X05Uw4cw2/M93BCUmnEvWZNStlCzEKME4Fkk+YpoA5OiHNQmoS7Cafb8Xa3Pya8m1Qrzeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "22.20.5",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.20.5.tgz",
      "integrity": "sha512-U2+DNr+wSjpsTS/wZGYHq7GcwfuSmKiKvoPvK22zwTlRhU91yOniN4qRR5KhIjvif7ysw/dz/hKmfDH0Ris4aA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/prop-types": {
      "version": "15.7.15",
      "resolved": "https://registry.npmjs.org/@types/prop-types/-/prop-types-15.7.15.tgz",
      "integrity": "sha512-F6bEyamV9jKGAFBEmlQnesRPGOQqS2+Uwi0Em15xenOxHaf2hv6L8YCVn3rPdPJOiJfPiCnLIRyvwVaqMY3MIw==",
      "devOptional": true,
      "license": "MIT"
    },
    "node_modules/@types/react": {
      "version": "18.3.31",
      "resolved": "https://registry.npmjs.org/@types/react/-/react-18.3.31.tgz",
      "integrity": "sha512-vfEqpXTvwT91yhmwdfouStN2hSKwTvyRs8qpLfADyrq/kxDw0hZM7Wk9Ug1FELj8hIby+S/+kQCSRFF32nv2Qw==",
      "devOptional": true,
      "license": "MIT",
      "dependencies": {
        "@types/prop-types": "*",
        "csstype": "^3.2.2"
      }
    },
    "node_modules/@types/react-dom": {
      "version": "18.3.7",
      "resolved": "https://registry.npmjs.org/@types/react-dom/-/react-dom-18.3.7.tgz",
      "integrity": "sha512-MEe3UeoENYVFXzoXEWsvcpg6ZvlrFNlOQ7EOsvhI3CfAXwzPfO8Qwuxd40nepsYKqyyVQnTdEfv68q91yLcKrQ==",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "@types/react": "^18.0.0"
      }
    },
    "node_modules/@vitest/expect": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/expect/-/expect-3.2.7.tgz",
      "integrity": "sha512-E8eBXaKibuvH2pSZErOjdVb5vF4PbKYcrnluBTYxEk1l/VhhwZg1kZQsdtjq+CsF5CFydf2Rdkz7jDHKSisi3w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/spy": "3.2.7",
        "@vitest/utils": "3.2.7",
        "chai": "^5.2.0",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/mocker": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/mocker/-/mocker-3.2.7.tgz",
      "integrity": "sha512-Trr0hYO9CM3Wj6ksWHRhK9IZpIY6wTMO5u/MqXurMxT57sWBaOPEtP3Oq60ihZuh5JsiagKfz95OcxdEP6dBrA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/spy": "3.2.7",
        "estree-walker": "^3.0.3",
        "magic-string": "^0.30.17"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "msw": "^2.4.9",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "peerDependenciesMeta": {
        "msw": {
          "optional": true
        },
        "vite": {
          "optional": true
        }
      }
    },
    "node_modules/@vitest/pretty-format": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/pretty-format/-/pretty-format-3.2.7.tgz",
      "integrity": "sha512-KUHlwqVu0sRlhCdyPdQ/wBoTfRahjUky1MubOmYw9fWfIZy1gNoHpuaaQBPAaMaVYdQYHJLurzj8ECCj5OwTqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/runner": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/runner/-/runner-3.2.7.tgz",
      "integrity": "sha512-sB9y4ovltoQP+WaUPwmSxO9WIg9Ig694Di5PalVPsYHklAdE027mehpWF2SQSVq+k6sFgaivbTjTJwZLSHbedA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/utils": "3.2.7",
        "pathe": "^2.0.3",
        "strip-literal": "^3.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/snapshot": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/snapshot/-/snapshot-3.2.7.tgz",
      "integrity": "sha512-7C+MwShwtBSI5Buwoyg3s/iY1eHL9PKAf+O1wVh/TdnjXUtkoL/9YQtre90i4MtNXM6edP1wJ2zOBpfCyhIS7g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.7",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/spy": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/spy/-/spy-3.2.7.tgz",
      "integrity": "sha512-Q2eQGI6d2L/hBtZ0qNuKcAGid68XK6cv1xsoaIma6PaJhHPoqcEJhYpXZ/5myCMqkNgtP6UKuBhbc0nHKnrkuQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "tinyspy": "^4.0.3"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/@vitest/utils": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/@vitest/utils/-/utils-3.2.7.tgz",
      "integrity": "sha512-x6BDOd7dyo3PFLY3I9/HJ25X/6OurhGXk2/B9gOZNPF7XDVjeBK4k01lQE5uvDpbuheErh91qYuE1E2OEjK3Rw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@vitest/pretty-format": "3.2.7",
        "loupe": "^3.1.4",
        "tinyrainbow": "^2.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/any-promise": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz",
      "integrity": "sha512-7UvmKalWRt1wgjL1RrGxoSJW/0QZFIegpeGvZG9kjp8vrRu55XTHbwnqq2GpXm9uLbcuhxm3IqX9OB4MZR1b2A==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/anymatch": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/anymatch/-/anymatch-3.1.3.tgz",
      "integrity": "sha512-KMReFUr0B4t+D+OBkjR3KYqvocp2XaSzO55UcB6mgQMd3KbcE+mWTyvVV7D/zsdEbNnV6acZUutkiHQXvTr1Rw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/arg": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/arg/-/arg-5.0.2.tgz",
      "integrity": "sha512-PYjyFOLKQ9y57JvQ6QLo8dAgNqswh8M1RMJYdQduT6xbWSgK36P/Z/v+p888pM69jMMfS8Xd8F6I1kQ/I9HUGg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/assertion-error": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/assertion-error/-/assertion-error-2.0.1.tgz",
      "integrity": "sha512-Izi8RQcffqCeNVgFigKli1ssklIbpHnCYc6AknXGYoB6grJqyeby7jv12JUQgmTAnIDnbck1uxksT4dzN3PWBA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/autoprefixer": {
      "version": "10.6.1",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.6.1.tgz",
      "integrity": "sha512-cL1Qz6ADZhcEbny/8HPfe99J6HhNoYtpX2LFLIbhgGE7Q1hlQVkYFdetDN7Id3KiQxhDrHwzlHr/YQCnZ8+xSA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/autoprefixer"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "browserslist": "^4.28.9",
        "caniuse-lite": "^1.0.30001810",
        "fraction.js": "^5.3.4",
        "picocolors": "^1.1.1",
        "postcss-value-parser": "^4.2.0"
      },
      "bin": {
        "autoprefixer": "bin/autoprefixer"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/baseline-browser-mapping": {
      "version": "2.11.32",
      "resolved": "https://registry.npmjs.org/baseline-browser-mapping/-/baseline-browser-mapping-2.11.32.tgz",
      "integrity": "sha512-UvuxFU9P3hM29LrQdwu0cD6w6/+SFr+UlB9s/knI7+O2rK9xFxKUwSDWxGdbbqQ9/V7BJ5s0NI5nQAE4uJp3gQ==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "baseline-browser-mapping": "dist/cli.cjs"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/binary-extensions": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/binary-extensions/-/binary-extensions-2.3.0.tgz",
      "integrity": "sha512-Ceh+7ox5qe7LJuLHoY0feh3pHuUDHAcRUeyL2VYghZwfpkNIy/+8Ocg0a3UuSoYzavmylwuLWQOf3hl0jjMMIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/boolbase": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/boolbase/-/boolbase-1.0.0.tgz",
      "integrity": "sha512-JZOSA7Mo9sNGB8+UjSgzdLtokWAky1zbztM3WRLCbZ70/3cTANmQmOdR7y2g+J0e2WXywy1yS468tY+IruqEww==",
      "license": "ISC"
    },
    "node_modules/braces": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/braces/-/braces-3.0.3.tgz",
      "integrity": "sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.1.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browserslist": {
      "version": "4.29.4",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.29.4.tgz",
      "integrity": "sha512-2TcbbiwXEq+N0kD36tykpCfyyQigUXmuwNQbnPp4Xk4PX9JOqVIKjJlIDjpH7uY6tmRGoAd+apeT1p60T8wsdA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "baseline-browser-mapping": "^2.11.29",
        "caniuse-lite": "^1.0.30001816",
        "electron-to-chromium": "^1.5.459",
        "node-releases": "^2.0.59",
        "update-browserslist-db": "^1.3.4"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/busboy": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/busboy/-/busboy-1.6.0.tgz",
      "integrity": "sha512-8SFQbg/0hQ9xy3UNTB0YEnsNBbWfhf7RtnzpL7TkBiTBRfrQ9Fxcnz7VJsleJpyp6rVLvXiuORqjlHi5q+PYuA==",
      "dependencies": {
        "streamsearch": "^1.1.0"
      },
      "engines": {
        "node": ">=10.16.0"
      }
    },
    "node_modules/cac": {
      "version": "6.7.14",
      "resolved": "https://registry.npmjs.org/cac/-/cac-6.7.14.tgz",
      "integrity": "sha512-b6Ilus+c3RrdDk+JhLKUAQfzzgLEPy6wcXqS7f/xe1EETvsDP6GORG7SFuOs6cID5YkqchW/LXZbX5bc8j7ZcQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/camelcase-css": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/camelcase-css/-/camelcase-css-2.0.1.tgz",
      "integrity": "sha512-QOSvevhslijgYwRx6Rv7zKdMF8lbRmx+uQGx2+vDc+KI/eBnsy9kit5aj23AgGu3pa4t9AgwbnXWqS+iOY+2aA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001819",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001819.tgz",
      "integrity": "sha512-LFUqIIAwpzsIuevnKnsR9qnStBcgzPShTX61lBwN9uFkkf8o8zLiebEjbW8AYtZiF+1YKDWfdt/pWDtMuG8Xwg==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "CC-BY-4.0"
    },
    "node_modules/chai": {
      "version": "5.3.3",
      "resolved": "https://registry.npmjs.org/chai/-/chai-5.3.3.tgz",
      "integrity": "sha512-4zNhdJD/iOjSH0A05ea+Ke6MU5mmpQcbQsSOkgdaUMJ9zTlDTD/GYlwohmIE2u0gaxHYiVHEn1Fw9mZ/ktJWgw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assertion-error": "^2.0.1",
        "check-error": "^2.1.1",
        "deep-eql": "^5.0.1",
        "loupe": "^3.1.0",
        "pathval": "^2.0.0"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/check-error": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/check-error/-/check-error-2.1.3.tgz",
      "integrity": "sha512-PAJdDJusoxnwm1VwW07VWwUN1sl7smmC3OKggvndJFadxxDRyFJBX/ggnu/KE4kQAB7a3Dp8f/YXC1FlUprWmA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 16"
      }
    },
    "node_modules/cheerio": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/cheerio/-/cheerio-1.2.0.tgz",
      "integrity": "sha512-WDrybc/gKFpTYQutKIK6UvfcuxijIZfMfXaYm8NMsPQxSYvf+13fXUJ4rztGGbJcBQ/GF55gvrZ0Bc0bj/mqvg==",
      "license": "MIT",
      "dependencies": {
        "cheerio-select": "^2.1.0",
        "dom-serializer": "^2.0.0",
        "domhandler": "^5.0.3",
        "domutils": "^3.2.2",
        "encoding-sniffer": "^0.2.1",
        "htmlparser2": "^10.1.0",
        "parse5": "^7.3.0",
        "parse5-htmlparser2-tree-adapter": "^7.1.0",
        "parse5-parser-stream": "^7.1.2",
        "undici": "^7.19.0",
        "whatwg-mimetype": "^4.0.0"
      },
      "engines": {
        "node": ">=20.18.1"
      },
      "funding": {
        "url": "https://github.com/cheeriojs/cheerio?sponsor=1"
      }
    },
    "node_modules/cheerio-select": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/cheerio-select/-/cheerio-select-2.1.0.tgz",
      "integrity": "sha512-9v9kG0LvzrlcungtnJtpGNxY+fzECQKhK4EGJX2vByejiMX84MFNQw4UxPJl3bFbTMw+Dfs37XaIkCwTZfLh4g==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "boolbase": "^1.0.0",
        "css-select": "^5.1.0",
        "css-what": "^6.1.0",
        "domelementtype": "^2.3.0",
        "domhandler": "^5.0.3",
        "domutils": "^3.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/chokidar": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.6.0.tgz",
      "integrity": "sha512-7VT13fmjotKpGipCW9JEQAusEPE+Ei8nl6/g4FBAmIm0GOOLMua9NDDo/DWp0ZAxCr3cPq5ZpBqmPAQgDda2Pw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "funding": {
        "url": "https://paulmillr.com/funding/"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/chokidar/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/client-only": {
      "version": "0.0.1",
      "resolved": "https://registry.npmjs.org/client-only/-/client-only-0.0.1.tgz",
      "integrity": "sha512-IV3Ou0jSMzZrd3pZ48nLkT9DA7Ag1pnPzaiQhpW7c3RbcqqzvzzVu+L8gfqMp/8IM2MQtSiqaCxrrcfu8I8rMA==",
      "license": "MIT"
    },
    "node_modules/clsx": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/clsx/-/clsx-2.1.1.tgz",
      "integrity": "sha512-eYm0QWBtUrBWZWG0d386OGAw16Z995PiOVo2B7bjWSbHedGl5e0ZWaq65kOGgUSNesEIDkB9ISbTg/JK9dhCZA==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/commander": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/commander/-/commander-4.1.1.tgz",
      "integrity": "sha512-NOKm8xhkzAjzFx8B2v5OAHT+u5pRQc2UCa2Vq9jYL/31o2wi9mxBA7LIFs3sV5VSC49z6pEhfbMULvShKj26WA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/css-select": {
      "version": "5.2.2",
      "resolved": "https://registry.npmjs.org/css-select/-/css-select-5.2.2.tgz",
      "integrity": "sha512-TizTzUddG/xYLA3NXodFM0fSbNizXjOKhqiQQwvhlspadZokn1KDy0NZFS0wuEubIYAV5/c1/lAr0TaaFXEXzw==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "boolbase": "^1.0.0",
        "css-what": "^6.1.0",
        "domhandler": "^5.0.2",
        "domutils": "^3.0.1",
        "nth-check": "^2.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/css-what": {
      "version": "6.2.2",
      "resolved": "https://registry.npmjs.org/css-what/-/css-what-6.2.2.tgz",
      "integrity": "sha512-u/O3vwbptzhMs3L1fQE82ZSLHQQfto5gyZzwteVIEyeaY5Fc7R4dapF/BvRoSYFeqfBk4m0V1Vafq5Pjv25wvA==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">= 6"
      },
      "funding": {
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/cssesc": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/cssesc/-/cssesc-3.0.0.tgz",
      "integrity": "sha512-/Tb/JcjK111nNScGob5MNtsntNM1aCNUDipB/TkwZFhyDrrE47SOx/18wF2bbjgc3ZzCSKW1T5nt5EbFoAz/Vg==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "cssesc": "bin/cssesc"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/csstype": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
      "integrity": "sha512-z1HGKcYy2xA8AGQfwrn0PAy+PB7X/GSj3UVJW9qKyn43xWa+gl5nXmU4qqLMRzWVLFC8KusUX8T/0kCiOYpAIQ==",
      "license": "MIT"
    },
    "node_modules/d3-array": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/d3-array/-/d3-array-3.2.4.tgz",
      "integrity": "sha512-tdQAmyA18i4J7wprpYq8ClcxZy3SC31QMeByyCFyRt7BVHdREQZ5lpzoe5mFEYZUWe+oq8HBvk9JjpibyEV4Jg==",
      "license": "ISC",
      "dependencies": {
        "internmap": "1 - 2"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-color": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-color/-/d3-color-3.1.0.tgz",
      "integrity": "sha512-zg/chbXyeBtMQ1LbD/WSoW2DpC3I0mpmPdW+ynRTj/x2DAWYrIY7qeZIHidozwV24m4iavr15lNwIwLxRmOxhA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-ease": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-ease/-/d3-ease-3.0.1.tgz",
      "integrity": "sha512-wR/XK3D3XcLIZwpbvQwQ5fK+8Ykds1ip7A2Txe0yxncXSdq1L9skcG7blcedkOX+ZcgxGAmLX1FrRGbADwzi0w==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-format": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/d3-format/-/d3-format-3.1.2.tgz",
      "integrity": "sha512-AJDdYOdnyRDV5b6ArilzCPPwc1ejkHcoyFarqlPqT7zRYjhavcT3uSrqcMvsgh2CgoPbK3RCwyHaVyxYcP2Arg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-interpolate": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-interpolate/-/d3-interpolate-3.0.1.tgz",
      "integrity": "sha512-3bYs1rOD33uo8aqJfKP3JWPAibgw8Zm2+L9vBKEHJ2Rg+viTR7o5Mmv5mZcieN+FRYaAOWX5SJATX6k1PWz72g==",
      "license": "ISC",
      "dependencies": {
        "d3-color": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-path": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-path/-/d3-path-3.1.0.tgz",
      "integrity": "sha512-p3KP5HCf/bvjBSSKuXid6Zqijx7wIfNW+J/maPs+iwR35at5JCbLUT0LzF1cnjbCHWhqzQTIN2Jpe8pRebIEFQ==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-scale": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/d3-scale/-/d3-scale-4.0.2.tgz",
      "integrity": "sha512-GZW464g1SH7ag3Y7hXjf8RoUuAFIqklOAq3MRl4OaWabTFJY9PN/E1YklhXLh+OQ3fM9yS2nOkCoS+WLZ6kvxQ==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2.10.0 - 3",
        "d3-format": "1 - 3",
        "d3-interpolate": "1.2.0 - 3",
        "d3-time": "2.1.1 - 3",
        "d3-time-format": "2 - 4"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-shape": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/d3-shape/-/d3-shape-3.2.0.tgz",
      "integrity": "sha512-SaLBuwGm3MOViRq2ABk3eLoxwZELpH6zhl3FbAoJ7Vm1gofKx6El1Ib5z23NUEhF9AsGl7y+dzLe5Cw2AArGTA==",
      "license": "ISC",
      "dependencies": {
        "d3-path": "^3.1.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/d3-time/-/d3-time-3.1.0.tgz",
      "integrity": "sha512-VqKjzBLejbSMT4IgbmVgDjpkYrNWUYJnbCGo874u7MMKIWsILRX+OpX/gTk8MqjpT1A/c6HY2dCA77ZN0lkQ2Q==",
      "license": "ISC",
      "dependencies": {
        "d3-array": "2 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-time-format": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/d3-time-format/-/d3-time-format-4.1.0.tgz",
      "integrity": "sha512-dJxPBlzC7NugB2PDLwo9Q8JiTR3M3e4/XANkreKSUxF8vvXKqm1Yfq4Q5dl8budlunRVlUUaDUgFt7eA8D6NLg==",
      "license": "ISC",
      "dependencies": {
        "d3-time": "1 - 3"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/d3-timer": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/d3-timer/-/d3-timer-3.0.1.tgz",
      "integrity": "sha512-ndfJ/JxxMd3nw31uyKoY2naivF+r29V+Lc0svZxe1JvvIRmi8hUsrMvdOwgS1o6uBHmiz91geQ0ylPP0aj1VUA==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decimal.js-light": {
      "version": "2.5.1",
      "resolved": "https://registry.npmjs.org/decimal.js-light/-/decimal.js-light-2.5.1.tgz",
      "integrity": "sha512-qIMFpTMZmny+MMIitAB6D7iVPEorVw6YQRWkvarTkT4tBeSLLiHzcwj6q0MmYSFCiVpiqPJTJEYIrpcPzVEIvg==",
      "license": "MIT"
    },
    "node_modules/deep-eql": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/deep-eql/-/deep-eql-5.0.2.tgz",
      "integrity": "sha512-h5k/5U50IJJFpzfL6nO9jaaumfjO/f2NjK/oYB2Djzm4p9L+3T9qWpZqZ2hAbLPuuYq9wrU08WQyBTL5GbPk5Q==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/didyoumean": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/didyoumean/-/didyoumean-1.2.2.tgz",
      "integrity": "sha512-gxtyfqMg7GKyhQmb056K7M3xszy/myH8w+B4RT+QXBQsvAOdc3XymqDDPHx1BgPgsdAA5SIifona89YtRATDzw==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/dlv": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/dlv/-/dlv-1.1.3.tgz",
      "integrity": "sha512-+HlytyjlPKnIG8XuRG8WvmBP8xs8P71y+SKKS6ZXWoEgLuePxtDoUEiH7WkdePWrQ5JBpE6aoVqfZfJUQkjXwA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/dom-helpers": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/dom-helpers/-/dom-helpers-5.2.1.tgz",
      "integrity": "sha512-nRCa7CK3VTrM2NmGkIy4cbK7IZlgBE/PYMn55rrXefr5xXDP0LdtfPnblFDoVdcAfslJ7or6iqAUnx0CCGIWQA==",
      "license": "MIT",
      "dependencies": {
        "@babel/runtime": "^7.8.7",
        "csstype": "^3.0.2"
      }
    },
    "node_modules/dom-serializer": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/dom-serializer/-/dom-serializer-2.0.0.tgz",
      "integrity": "sha512-wIkAryiqt/nV5EQKqQpo3SToSOV9J0DnbJqwK7Wv/Trc92zIAYZ4FlMu+JPFW1DfGFt81ZTCGgDEabffXeLyJg==",
      "license": "MIT",
      "dependencies": {
        "domelementtype": "^2.3.0",
        "domhandler": "^5.0.2",
        "entities": "^4.2.0"
      },
      "funding": {
        "url": "https://github.com/cheeriojs/dom-serializer?sponsor=1"
      }
    },
    "node_modules/domelementtype": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/domelementtype/-/domelementtype-2.3.0.tgz",
      "integrity": "sha512-OLETBj6w0OsagBwdXnPdN0cnMfF9opN69co+7ZrbfPGrdpPVNBUj02spi6B1N7wChLQiPn4CSH/zJvXw56gmHw==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fb55"
        }
      ],
      "license": "BSD-2-Clause"
    },
    "node_modules/domhandler": {
      "version": "5.0.3",
      "resolved": "https://registry.npmjs.org/domhandler/-/domhandler-5.0.3.tgz",
      "integrity": "sha512-cgwlv/1iFQiFnU96XXgROh8xTeetsnJiDsTc7TYCLFd9+/WNkIqPTxiM/8pSd8VIrhXGTf1Ny1q1hquVqDJB5w==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "domelementtype": "^2.3.0"
      },
      "engines": {
        "node": ">= 4"
      },
      "funding": {
        "url": "https://github.com/fb55/domhandler?sponsor=1"
      }
    },
    "node_modules/domutils": {
      "version": "3.2.2",
      "resolved": "https://registry.npmjs.org/domutils/-/domutils-3.2.2.tgz",
      "integrity": "sha512-6kZKyUajlDuqlHKVX1w7gyslj9MPIXzIFiz/rGu35uC1wMi+kMhQwGhl4lt9unC9Vb9INnY9Z3/ZA3+FhASLaw==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "dom-serializer": "^2.0.0",
        "domelementtype": "^2.3.0",
        "domhandler": "^5.0.3"
      },
      "funding": {
        "url": "https://github.com/fb55/domutils?sponsor=1"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.5.464",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.5.464.tgz",
      "integrity": "sha512-nRa65aFge40viPAKxMKULIY8tcXKwKboJWNn4RoKwyWXJ6SP7BnrDGKUTzc64818jIciH0PK7LSF8QzZes19GA==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/encoding-sniffer": {
      "version": "0.2.1",
      "resolved": "https://registry.npmjs.org/encoding-sniffer/-/encoding-sniffer-0.2.1.tgz",
      "integrity": "sha512-5gvq20T6vfpekVtqrYQsSCFZ1wEg5+wW0/QaZMWkFr6BqD3NfKs0rLCx4rrVlSWJeZb5NBJgVLswK/w2MWU+Gw==",
      "license": "MIT",
      "dependencies": {
        "iconv-lite": "^0.6.3",
        "whatwg-encoding": "^3.1.1"
      },
      "funding": {
        "url": "https://github.com/fb55/encoding-sniffer?sponsor=1"
      }
    },
    "node_modules/entities": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/entities/-/entities-4.5.0.tgz",
      "integrity": "sha512-V0hjH4dGPh9Ao5p0MoRY6BVqtwCjhz6vI5LT8AJ55H+4g9/4vbHx1I54fS0XuclLhDHArPQCiMjDxjaL8fPxhw==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.12"
      },
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-module-lexer": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/es-module-lexer/-/es-module-lexer-1.7.0.tgz",
      "integrity": "sha512-jEQoCwk8hyb2AZziIOLhDqpm5+2ww5uIE6lkO/6jcOCusfk6LhMHpXXfBLXTZ7Ydyt0j4VoUQv6uGNYbdW+kBA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/esbuild": {
      "version": "0.28.2",
      "resolved": "https://registry.npmjs.org/esbuild/-/esbuild-0.28.2.tgz",
      "integrity": "sha512-HKVLS8dvII+xoKW9kmqxbRKrnWEXfJJr/FZhhJmiqIB0e053QNYFqOBouTMO/k5sID4MvCiUCvv8b9M4h32wIA==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "bin": {
        "esbuild": "bin/esbuild"
      },
      "engines": {
        "node": ">=18"
      },
      "optionalDependencies": {
        "@esbuild/aix-ppc64": "0.28.2",
        "@esbuild/android-arm": "0.28.2",
        "@esbuild/android-arm64": "0.28.2",
        "@esbuild/android-x64": "0.28.2",
        "@esbuild/darwin-arm64": "0.28.2",
        "@esbuild/darwin-x64": "0.28.2",
        "@esbuild/freebsd-arm64": "0.28.2",
        "@esbuild/freebsd-x64": "0.28.2",
        "@esbuild/linux-arm": "0.28.2",
        "@esbuild/linux-arm64": "0.28.2",
        "@esbuild/linux-ia32": "0.28.2",
        "@esbuild/linux-loong64": "0.28.2",
        "@esbuild/linux-mips64el": "0.28.2",
        "@esbuild/linux-ppc64": "0.28.2",
        "@esbuild/linux-riscv64": "0.28.2",
        "@esbuild/linux-s390x": "0.28.2",
        "@esbuild/linux-x64": "0.28.2",
        "@esbuild/netbsd-arm64": "0.28.2",
        "@esbuild/netbsd-x64": "0.28.2",
        "@esbuild/openbsd-arm64": "0.28.2",
        "@esbuild/openbsd-x64": "0.28.2",
        "@esbuild/openharmony-arm64": "0.28.2",
        "@esbuild/sunos-x64": "0.28.2",
        "@esbuild/win32-arm64": "0.28.2",
        "@esbuild/win32-ia32": "0.28.2",
        "@esbuild/win32-x64": "0.28.2"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/estree-walker": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/estree-walker/-/estree-walker-3.0.3.tgz",
      "integrity": "sha512-7RUKfXgSMMkzt6ZuXmqapOurLGPPfgj6l9uRZ7lRGolvk0y2yocc35LdcxKC5PQZdn2DMqioAQ2NoWcrTKmm6g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "^1.0.0"
      }
    },
    "node_modules/eventemitter3": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/eventemitter3/-/eventemitter3-4.0.7.tgz",
      "integrity": "sha512-8guHBZCwKnFhYdHr2ysuRWErTwhoN2X8XELRlrRwpmfeY2jjuUN4taQMsULKUVo1K4DvZl+0pgfyoysHxvmvEw==",
      "license": "MIT"
    },
    "node_modules/expect-type": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/expect-type/-/expect-type-1.4.0.tgz",
      "integrity": "sha512-KfYbmpRm0VbLjEvVa9yGwCi9GI34xvi7A/HXYWQO65CSD2u3MczUJSuwXKFIxlGsgBQizV9q5J9NHj4VG0n+pA==",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/fast-equals": {
      "version": "5.4.5",
      "resolved": "https://registry.npmjs.org/fast-equals/-/fast-equals-5.4.5.tgz",
      "integrity": "sha512-yKEpcFuRPu/pTQL2VB8YKE2yFldrLlIsoWtJeBnAdqEhvu21OgkFT0C8njf/xYc2LSZGEr3K9JGjthHJxnVLvQ==",
      "license": "MIT",
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/fast-glob": {
      "version": "3.3.3",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.3.3.tgz",
      "integrity": "sha512-7MptL8U0cqcFdzIzwOTHoilX9x5BrNqye7Z/LuC7kCMRio1EMSyqRK3BEAUD7sXRq4iT4AzTVuZdhgQ2TCvYLg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.8"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fastq": {
      "version": "1.20.3",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.20.3.tgz",
      "integrity": "sha512-XKv5nnLs6nLF71NgiKJLIZFLkPyIEuOselLG7ujZnGrRfQK8HpvY+WqKhAJUAdLomwVHErVS4LfxFlPq0/FTAw==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/fill-range": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/fill-range/-/fill-range-7.1.1.tgz",
      "integrity": "sha512-YsGpe3WHLK8ZYi4tWDg2Jy3ebRz2rXowDxnld4bkQB00cc/1Zw9AWnC0i9ztDJitivtQvaI9KaLyKrc+hBW0yg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/fraction.js": {
      "version": "5.3.4",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-5.3.4.tgz",
      "integrity": "sha512-1X1NTtiJphryn/uLQz3whtY6jK3fTqoE3ohKs0tT+Ujr1W59oopxmoEh7Lu5p6vBaPbgoM0bzveAW4Qi5RyWDQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/rawify"
      }
    },
    "node_modules/framer-motion": {
      "version": "11.18.2",
      "resolved": "https://registry.npmjs.org/framer-motion/-/framer-motion-11.18.2.tgz",
      "integrity": "sha512-5F5Och7wrvtLVElIpclDT0CBzMVg3dL22B64aZwHtsIY8RB4mXICLrkajK4G9R+ieSAGcgrLeae2SeUTg2pr6w==",
      "license": "MIT",
      "dependencies": {
        "motion-dom": "^11.18.1",
        "motion-utils": "^11.18.1",
        "tslib": "^2.4.0"
      },
      "peerDependencies": {
        "@emotion/is-prop-valid": "*",
        "react": "^18.0.0 || ^19.0.0",
        "react-dom": "^18.0.0 || ^19.0.0"
      },
      "peerDependenciesMeta": {
        "@emotion/is-prop-valid": {
          "optional": true
        },
        "react": {
          "optional": true
        },
        "react-dom": {
          "optional": true
        }
      }
    },
    "node_modules/fsevents": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.3.tgz",
      "integrity": "sha512-5xoDfX+fL7faATnagmWPpbFtwh/R77WmMMqqHGS65C3vvB0YHrgF+B1YmZ3441tMj5n63k0212XNoJwzlhffQw==",
      "dev": true,
      "hasInstallScript": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "dev": true,
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-6.0.2.tgz",
      "integrity": "sha512-XxwI8EOhVQgWp6iDL+3b0r86f4d6AX6zSU55HfB4ydCEuXLXc5FcYeOu+nnGftS4TEju/11rt4KJPTMgbfmv4A==",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.11",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
      "integrity": "sha512-RbJ5/jmFcNNCcDV5o9eTnBLJ/HszWV0P73bc+Ff4nS/rJj+YaS6IGyiOL0VoBYX+l1Wrl3k63h/KrH+nhJ0XvQ==",
      "license": "ISC"
    },
    "node_modules/hasown": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
      "integrity": "sha512-T2UbfbBEF32wiepXIsMlTW9+dDYC6wMh/t/vYA4tuOMKqWz/n3vr1NFSxQiyP+zk2mXsoMA/i/7qV6LKut1t1A==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/htmlparser2": {
      "version": "10.1.0",
      "resolved": "https://registry.npmjs.org/htmlparser2/-/htmlparser2-10.1.0.tgz",
      "integrity": "sha512-VTZkM9GWRAtEpveh7MSF6SjjrpNVNNVJfFup7xTY3UpFtm67foy9HDVXneLtFVt4pMz5kZtgNcvCniNFb1hlEQ==",
      "funding": [
        "https://github.com/fb55/htmlparser2?sponsor=1",
        {
          "type": "github",
          "url": "https://github.com/sponsors/fb55"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "domelementtype": "^2.3.0",
        "domhandler": "^5.0.3",
        "domutils": "^3.2.2",
        "entities": "^7.0.1"
      }
    },
    "node_modules/htmlparser2/node_modules/entities": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/entities/-/entities-7.0.1.tgz",
      "integrity": "sha512-TWrgLOFUQTH994YUyl1yT4uyavY5nNB5muff+RtWaqNVCAK408b5ZnnbNAUEWLTCpum9w6arT70i1XdQ4UeOPA==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.12"
      },
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/internmap": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/internmap/-/internmap-2.0.3.tgz",
      "integrity": "sha512-5Hh7Y1wQbvY5ooGgPbDaL5iYLAPzMTUrjMulskHLH6wnv/A+1q5rgEaiuqEjB+oxGXIVZs1FF+R/KPN3ZSQYYg==",
      "license": "ISC",
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-binary-path/-/is-binary-path-2.1.0.tgz",
      "integrity": "sha512-ZMERYes6pDydyuGidse7OsHxtbI7WVeUEozgR/g7rd0xUimYNlvZRE/K2MgZTjWy725IfelLeVcEM97mmtRGXw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.17.0",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.17.0.tgz",
      "integrity": "sha512-J/vG0zBCbIKOQFfufSwyXdMrsohyJIUNkrnmo6WZGzoM7tr/lsbfW5b2BvisL6zsyMzK9UxV9L6c7AoFbyXHOA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "hasown": "^2.0.4"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/is-extglob/-/is-extglob-2.1.1.tgz",
      "integrity": "sha512-SbKbANkN603Vi4jEZv49LeVJMn4yGwsbzZworEoyEiutsN3nJYdbO36zfhGJ6QEDpOZIFkDtnq5JRxmvl3jsoQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
      "integrity": "sha512-41Cifkg6e8TylSpdtTpeLVMqvSBEVzTttHvERD741+pnZ8ANv0004MRL43QKPDlK9cGvNp6NZWZUBlbGXYxxng==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/jiti": {
      "version": "1.21.7",
      "resolved": "https://registry.npmjs.org/jiti/-/jiti-1.21.7.tgz",
      "integrity": "sha512-/imKNG4EbWNrVjoNC/1H5/9GFy+tqjGBHCaSsN+P2RnPqjsLmv6UD3Ej+Kj8nBWaRAwyk7kK5ZUc+OEatnTR3A==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "jiti": "bin/jiti.js"
      }
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-4.0.0.tgz",
      "integrity": "sha512-RdJUflcE3cUzKiMqQgsCu06FPu9UdIJO0beYbPhHN4k6apgJtifcoCtT9bcxOpYBtpD2kCM6Sbzg4CausW/PKQ==",
      "license": "MIT"
    },
    "node_modules/lilconfig": {
      "version": "3.1.4",
      "resolved": "https://registry.npmjs.org/lilconfig/-/lilconfig-3.1.4.tgz",
      "integrity": "sha512-zJZyBmQhArDRefuWTypZxwDpFDIYmrj8ypSBvwGD5P13Y95s6DjzKgu4DVdGbeQa5PDEsAOCAPNk4X+QOR006w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14"
      },
      "funding": {
        "url": "https://github.com/sponsors/antonk52"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "1.2.4",
      "resolved": "https://registry.npmjs.org/lines-and-columns/-/lines-and-columns-1.2.4.tgz",
      "integrity": "sha512-7ylylesZQ/PV29jhEDl3Ufjo6ZX7gCqJr5F7PKrqc93v7fzSymt1BpwEU8nAUXs8qzzvqhbjhK5QZg6Mt/HkBg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lodash": {
      "version": "4.18.1",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz",
      "integrity": "sha512-dMInicTPVE8d1e5otfwmmjlxkZoUpiVLwyeTdUsi/Caj/gfzzblBcCE5sRHV/AsjuCmxWrte2TNGSYuCeCq+0Q==",
      "license": "MIT"
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/loose-envify/-/loose-envify-1.4.0.tgz",
      "integrity": "sha512-lyuxPGr/Wfhrlem2CL/UcnUc1zcqKAImBDzukY7Y5F/yQiNdko6+fRLevlw1HgMySw7f611UIY408EtxRSoK3Q==",
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^3.0.0 || ^4.0.0"
      },
      "bin": {
        "loose-envify": "cli.js"
      }
    },
    "node_modules/loupe": {
      "version": "3.2.1",
      "resolved": "https://registry.npmjs.org/loupe/-/loupe-3.2.1.tgz",
      "integrity": "sha512-CdzqowRJCeLU72bHvWqwRBBlLcMEtIvGrlvef74kMnV2AolS9Y8xUv1I0U/MNAWMhBlKIoyuEgoJ0t/bbwHbLQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/magic-string": {
      "version": "0.30.21",
      "resolved": "https://registry.npmjs.org/magic-string/-/magic-string-0.30.21.tgz",
      "integrity": "sha512-vd2F4YUyEXKGcLHoq+TEyCjxueSeHnFxyyjNp80yg0XV4vUhnDer/lvvlqM/arB5bXQN5K2/3oinyCRyx8T2CQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/sourcemap-codec": "^1.5.5"
      }
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.8",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.8.tgz",
      "integrity": "sha512-PXwfBhYu0hBCPw8Dn0E+WDYb7af3dSLVWKi3HGv84IdF4TyFoC0ysxFd0Goxw7nSv4T/PzEJQxsYsEiFCKo2BA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "braces": "^3.0.3",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/motion-dom": {
      "version": "11.18.1",
      "resolved": "https://registry.npmjs.org/motion-dom/-/motion-dom-11.18.1.tgz",
      "integrity": "sha512-g76KvA001z+atjfxczdRtw/RXOM3OMSdd1f4DL77qCTF/+avrRJiawSG4yDibEQ215sr9kpinSlX2pCTJ9zbhw==",
      "license": "MIT",
      "dependencies": {
        "motion-utils": "^11.18.1"
      }
    },
    "node_modules/motion-utils": {
      "version": "11.18.1",
      "resolved": "https://registry.npmjs.org/motion-utils/-/motion-utils-11.18.1.tgz",
      "integrity": "sha512-49Kt+HKjtbJKLtgO/LKj9Ld+6vw9BjH5d9sc40R/kVyH8GLAXgT42M2NnuPcJNuA3s9ZfZBUcwIgpmZWGEE+hA==",
      "license": "MIT"
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/mz": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/mz/-/mz-2.7.0.tgz",
      "integrity": "sha512-z81GNO7nnYMEhrGh9LeymoE4+Yr0Wn5McHIZMK5cfQCl+NDX08sCZgUc9/6MHni9IWuFLm1Z3HTCXu2z9fN62Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0",
        "object-assign": "^4.0.1",
        "thenify-all": "^1.0.0"
      }
    },
    "node_modules/nanoid": {
      "version": "3.3.20",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.20.tgz",
      "integrity": "sha512-uKdg2G3GNCKQn9byYOpxbGqrT2fGO5KRt5J/8b3pok8rT6qxGWF6hxMyJiEYtAf+FVyYuD9hRaDqX5uPFYJ4ZQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/next": {
      "version": "14.2.35",
      "resolved": "https://registry.npmjs.org/next/-/next-14.2.35.tgz",
      "integrity": "sha512-KhYd2Hjt/O1/1aZVX3dCwGXM1QmOV4eNM2UTacK5gipDdPN/oHHK/4oVGy7X8GMfPMsUTUEmGlsy0EY1YGAkig==",
      "license": "MIT",
      "dependencies": {
        "@next/env": "14.2.35",
        "@swc/helpers": "0.5.5",
        "busboy": "1.6.0",
        "caniuse-lite": "^1.0.30001579",
        "graceful-fs": "^4.2.11",
        "postcss": "8.4.31",
        "styled-jsx": "5.1.1"
      },
      "bin": {
        "next": "dist/bin/next"
      },
      "engines": {
        "node": ">=18.17.0"
      },
      "optionalDependencies": {
        "@next/swc-darwin-arm64": "14.2.33",
        "@next/swc-darwin-x64": "14.2.33",
        "@next/swc-linux-arm64-gnu": "14.2.33",
        "@next/swc-linux-arm64-musl": "14.2.33",
        "@next/swc-linux-x64-gnu": "14.2.33",
        "@next/swc-linux-x64-musl": "14.2.33",
        "@next/swc-win32-arm64-msvc": "14.2.33",
        "@next/swc-win32-ia32-msvc": "14.2.33",
        "@next/swc-win32-x64-msvc": "14.2.33"
      },
      "peerDependencies": {
        "@opentelemetry/api": "^1.1.0",
        "@playwright/test": "^1.41.2",
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "sass": "^1.3.0"
      },
      "peerDependenciesMeta": {
        "@opentelemetry/api": {
          "optional": true
        },
        "@playwright/test": {
          "optional": true
        },
        "sass": {
          "optional": true
        }
      }
    },
    "node_modules/next/node_modules/postcss": {
      "version": "8.4.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.31.tgz",
      "integrity": "sha512-PS08Iboia9mts/2ygV3eLpY5ghnUcfLV/EXTOW1E2qYxJKGGBUtNjN76FYHnMs36RmARn41bC0AZmn+rR0OVpQ==",
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.6",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/node-releases": {
      "version": "2.0.60",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.60.tgz",
      "integrity": "sha512-OmO8+GM1JUZqXET720VrJCwkjUCXmCMQm0Z3UDDRbfNLHS4NEAvY60j5jiFv0tkKw2PNNlqOLhahVmwJIOLDIQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/normalize-path/-/normalize-path-3.0.0.tgz",
      "integrity": "sha512-6eZs5Ls3WtCisHWp9S2GUy8dqkpGi4BVSz3GaqiE6ezub0512ESztXUwUB6C6IKbQkY2Pnb/mD4WYojCRwcwLA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/nth-check": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/nth-check/-/nth-check-2.1.1.tgz",
      "integrity": "sha512-lqjrjmaOoAnWfMmBPL+XNnynZh2+swxiX3WUE0s4yEHI6m+AwrK2UZOimIRl3X/4QctVqS8AiZjFqyOGrMXb/w==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "boolbase": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/fb55/nth-check?sponsor=1"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-hash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/object-hash/-/object-hash-3.0.0.tgz",
      "integrity": "sha512-RSn9F68PjH9HqtltsSnqYC1XXoWe9Bju5+213R98cNGttag9q9yAOTzdbsqvIa7aNm5WffBZFpWYr2aWrklWAw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/parse5": {
      "version": "7.3.0",
      "resolved": "https://registry.npmjs.org/parse5/-/parse5-7.3.0.tgz",
      "integrity": "sha512-IInvU7fabl34qmi9gY8XOVxhYyMyuH2xUNpb2q8/Y+7552KlejkRvqvD19nMoUW/uQGGbqNpA6Tufu5FL5BZgw==",
      "license": "MIT",
      "dependencies": {
        "entities": "^6.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/parse5-htmlparser2-tree-adapter": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/parse5-htmlparser2-tree-adapter/-/parse5-htmlparser2-tree-adapter-7.1.0.tgz",
      "integrity": "sha512-ruw5xyKs6lrpo9x9rCZqZZnIUntICjQAd0Wsmp396Ul9lN/h+ifgVV1x1gZHi8euej6wTfpqX8j+BFQxF0NS/g==",
      "license": "MIT",
      "dependencies": {
        "domhandler": "^5.0.3",
        "parse5": "^7.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/parse5-parser-stream": {
      "version": "7.1.2",
      "resolved": "https://registry.npmjs.org/parse5-parser-stream/-/parse5-parser-stream-7.1.2.tgz",
      "integrity": "sha512-JyeQc9iwFLn5TbvvqACIF/VXG6abODeB3Fwmv/TGdLk2LfbWkaySGY72at4+Ty7EkPZj854u4CrICqNk2qIbow==",
      "license": "MIT",
      "dependencies": {
        "parse5": "^7.0.0"
      },
      "funding": {
        "url": "https://github.com/inikulin/parse5?sponsor=1"
      }
    },
    "node_modules/parse5/node_modules/entities": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/entities/-/entities-6.0.1.tgz",
      "integrity": "sha512-aN97NXWF6AWBTahfVOIrB/NShkzi5H7F9r1s9mD3cDj4Ko5f2qhhVoYMibXF7GlLveb/D2ioWay8lxI97Ven3g==",
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.12"
      },
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/pathe": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/pathe/-/pathe-2.0.3.tgz",
      "integrity": "sha512-WUjGcAqP1gQacoQe+OBJsFA7Ld4DyXuUIjZ5cc75cLHvJ7dtNsTugphxIADwspS+AraAUePCKrSVtPLFj/F88w==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/pathval": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/pathval/-/pathval-2.0.1.tgz",
      "integrity": "sha512-//nshmD55c46FuFw26xV/xFAaB5HF9Xdap7HJBBnrKdAd6/GxDBaNA1870O79+9ueg61cZLSVc+OaFlfmObYVQ==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 14.16"
      }
    },
    "node_modules/picocolors": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/picocolors/-/picocolors-1.1.1.tgz",
      "integrity": "sha512-xceH2snhtb5M9liqDsmEw56le376mTZkEX/jEb/RxNFyegNul7eNslCXP9FDj/Lcu0X8KEyMceP2ntpaHrDEVA==",
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.2",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.2.tgz",
      "integrity": "sha512-V7+vQEJ06Z+c5tSye8S+nHUfI51xoXIXjHQ99cQtKUkQqqO1kO/KCJUfZXuB47h/YBlDhah2H3hdUGXn8ie0oA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pirates": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/pirates/-/pirates-4.0.7.tgz",
      "integrity": "sha512-TfySrs/5nm8fQJDcBDuUng3VOUKsd7S+zqvbOTiGXHfxX4wK31ard+hoNuvkicM/2YFzlpDgABOevKSsB4G/FA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/postcss": {
      "version": "8.5.31",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.5.31.tgz",
      "integrity": "sha512-YUbWYCgErwnMAVkjUnYa+KlMBzGpHwiIt/DE7f0G33AuX2LH9UcTk6KgWxd3zRU+pN3u/C+Xl3EnMLM4Hea7Sg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "nanoid": "^3.3.20",
        "picocolors": "^1.1.1",
        "source-map-js": "^1.2.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss-import": {
      "version": "15.1.0",
      "resolved": "https://registry.npmjs.org/postcss-import/-/postcss-import-15.1.0.tgz",
      "integrity": "sha512-hpr+J05B2FVYUAXHeK1YyI267J/dDDhMU6B6civm8hSY1jYJnBXxzKDKDswzJmtLHryrjhnDjqqp/49t8FALew==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "postcss-value-parser": "^4.0.0",
        "read-cache": "^1.0.0",
        "resolve": "^1.1.7"
      },
      "engines": {
        "node": ">=14.0.0"
      },
      "peerDependencies": {
        "postcss": "^8.0.0"
      }
    },
    "node_modules/postcss-js": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/postcss-js/-/postcss-js-4.1.0.tgz",
      "integrity": "sha512-oIAOTqgIo7q2EOwbhb8UalYePMvYoIeRY2YKntdpFQXNosSu3vLrniGgmH9OKs/qAkfoj5oB3le/7mINW1LCfw==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "camelcase-css": "^2.0.1"
      },
      "engines": {
        "node": "^12 || ^14 || >= 16"
      },
      "peerDependencies": {
        "postcss": "^8.4.21"
      }
    },
    "node_modules/postcss-load-config": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/postcss-load-config/-/postcss-load-config-6.0.1.tgz",
      "integrity": "sha512-oPtTM4oerL+UXmx+93ytZVN82RrlY/wPUV8IeDxFrzIjXOLF1pN+EmKPLbubvKHT2HC20xXsCAH2Z+CKV6Oz/g==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "lilconfig": "^3.1.1"
      },
      "engines": {
        "node": ">= 18"
      },
      "peerDependencies": {
        "jiti": ">=1.21.0",
        "postcss": ">=8.0.9",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "jiti": {
          "optional": true
        },
        "postcss": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/postcss-nested": {
      "version": "6.2.0",
      "resolved": "https://registry.npmjs.org/postcss-nested/-/postcss-nested-6.2.0.tgz",
      "integrity": "sha512-HQbt28KulC5AJzG+cZtj9kvKB93CFCdLvog1WFLf1D+xmMvPGlBstkpTEZfK5+AN9hfJocyBFCNiqyS48bpgzQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "postcss-selector-parser": "^6.1.1"
      },
      "engines": {
        "node": ">=12.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.14"
      }
    },
    "node_modules/postcss-selector-parser": {
      "version": "6.1.5",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.1.5.tgz",
      "integrity": "sha512-TEHFzb5KRDKaOgJ4TYE+0jyJtFbjLvkdVOu0fZ2b6MTWzoqZd4Le+61aEppWkvTlYePgOX4ATL1wsAIPMLTw6Q==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/postcss-value-parser": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/postcss-value-parser/-/postcss-value-parser-4.2.0.tgz",
      "integrity": "sha512-1NNCs6uurfkVbeXG4S8JFT9t19m45ICnif8zWLd5oPSZ50QnwMfK+H3jv408d4jw/7Bttv5axS5IiHoLaVNHeQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/prop-types": {
      "version": "15.8.1",
      "resolved": "https://registry.npmjs.org/prop-types/-/prop-types-15.8.1.tgz",
      "integrity": "sha512-oj87CgZICdulUohogVAR7AjlC0327U4el4L6eAvOqCeudMDVU0NThNaV+b9Df4dXgSP1gXMTnPdhfe/2qDH5cg==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.4.0",
        "object-assign": "^4.1.1",
        "react-is": "^16.13.1"
      }
    },
    "node_modules/prop-types/node_modules/react-is": {
      "version": "16.13.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-16.13.1.tgz",
      "integrity": "sha512-24e6ynE2H+OKt4kqsOvNd8kBpV65zoxbA4BVsEOB3ARVWQki/DHzaUoC5KuON/BiccDaCCTZBuOcfZs70kR8bQ==",
      "license": "MIT"
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/react": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react/-/react-18.3.1.tgz",
      "integrity": "sha512-wS+hAgJShR0KhEvPJArfuPVN1+Hz1t0Y6n5jLrGQbkb4urgPE/0Rve+1kMB1v/oWgHgm4WIcV+i7F2pTVj+2iQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/react-dom": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-dom/-/react-dom-18.3.1.tgz",
      "integrity": "sha512-5m4nQKp+rZRb09LNH59GM4BxTh9251/ylbKIbpe7TpGxfJ+9kv6BLkLBXIjjspbgbnIBNqlI23tRnTWT0snUIw==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0",
        "scheduler": "^0.23.2"
      },
      "peerDependencies": {
        "react": "^18.3.1"
      }
    },
    "node_modules/react-is": {
      "version": "18.3.1",
      "resolved": "https://registry.npmjs.org/react-is/-/react-is-18.3.1.tgz",
      "integrity": "sha512-/LLMVyas0ljjAtoYiPqYiL8VWXzUUdThrmU5+n20DZv+a+ClRoevUzw5JxU+Ieh5/c87ytoTBV9G1FiKfNJdmg==",
      "license": "MIT"
    },
    "node_modules/react-smooth": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/react-smooth/-/react-smooth-4.0.4.tgz",
      "integrity": "sha512-gnGKTpYwqL0Iii09gHobNolvX4Kiq4PKx6eWBCYYix+8cdw+cGo3do906l1NBPKkSWx1DghC1dlWG9L2uGd61Q==",
      "license": "MIT",
      "dependencies": {
        "fast-equals": "^5.0.1",
        "prop-types": "^15.8.1",
        "react-transition-group": "^4.4.5"
      },
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/react-transition-group": {
      "version": "4.4.5",
      "resolved": "https://registry.npmjs.org/react-transition-group/-/react-transition-group-4.4.5.tgz",
      "integrity": "sha512-pZcd1MCJoiKiBR2NRxeCRg13uCXbydPnmB4EOeRrY7480qNWO8IIgQG6zlDkm6uRMsURXPuKq0GWtiM59a5Q6g==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@babel/runtime": "^7.5.5",
        "dom-helpers": "^5.0.1",
        "loose-envify": "^1.4.0",
        "prop-types": "^15.6.2"
      },
      "peerDependencies": {
        "react": ">=16.6.0",
        "react-dom": ">=16.6.0"
      }
    },
    "node_modules/read-cache": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/read-cache/-/read-cache-1.0.2.tgz",
      "integrity": "sha512-/peqiBB/n07gQGLsWaHho3WfvUyRscw0gYTsEFMhrIe/nWLkYaf5SbKYjGYqtRV3aPwykJgF2VEMo1ac4bnsGA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "resolved": "https://registry.npmjs.org/readdirp/-/readdirp-3.6.0.tgz",
      "integrity": "sha512-hOS089on8RduqdbhvQ5Z37A0ESjsqz6qnRcffsMU3495FuTdqSm+7bhJ29JvIOsBDEEnan5DPu9t3To9VRlMzA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/recharts": {
      "version": "2.15.4",
      "resolved": "https://registry.npmjs.org/recharts/-/recharts-2.15.4.tgz",
      "integrity": "sha512-UT/q6fwS3c1dHbXv2uFgYJ9BMFHu3fwnd7AYZaEQhXuYQ4hgsxLvsUXzGdKeZrW5xopzDCvuA2N41WJ88I7zIw==",
      "deprecated": "1.x and 2.x branches are no longer active. Bump to Recharts v3 to receive latest features and bugfixes. See https://github.com/recharts/recharts/wiki/3.0-migration-guide",
      "license": "MIT",
      "dependencies": {
        "clsx": "^2.0.0",
        "eventemitter3": "^4.0.1",
        "lodash": "^4.17.21",
        "react-is": "^18.3.1",
        "react-smooth": "^4.0.4",
        "recharts-scale": "^0.4.4",
        "tiny-invariant": "^1.3.1",
        "victory-vendor": "^36.6.8"
      },
      "engines": {
        "node": ">=14"
      },
      "peerDependencies": {
        "react": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0",
        "react-dom": "^16.0.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/recharts-scale": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/recharts-scale/-/recharts-scale-0.4.5.tgz",
      "integrity": "sha512-kivNFO+0OcUNu7jQquLXAxz1FIwZj8nrj+YkOKc5694NbjCvcT6aSZiIzNzd2Kul4o4rTto8QVR9lMNtxD4G1w==",
      "license": "MIT",
      "dependencies": {
        "decimal.js-light": "^2.4.1"
      }
    },
    "node_modules/resolve": {
      "version": "1.22.13",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.13.tgz",
      "integrity": "sha512-Dj/cW9zBV2aRj6XzCxuGIs3ESZKv02jixne3q6jFZYZ3/Tg09gHHviSMDL4kObh9pqSahdRHEnDoaP2gn8YLhA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "is-core-module": "^2.17.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/reusify": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.1.0.tgz",
      "integrity": "sha512-g6QUff04oZpHs0eG5p83rFLhHeV00ug/Yf9nZM6fLeUrPguBTkTQOdpAWWspMh55TZfVQDPaN3NQJfbVRAxdIw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rollup": {
      "version": "4.65.0",
      "resolved": "https://registry.npmjs.org/rollup/-/rollup-4.65.0.tgz",
      "integrity": "sha512-QVCvQUTGDN6JRwi3jVGCY3H4aTHvi9rX0LyoBMkGUvdh/Z6O51CzcLz85BWZaTCDGhl6ySGqYZs+xI1jmPqGcw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/estree": "1.0.9"
      },
      "bin": {
        "rollup": "dist/bin/rollup"
      },
      "engines": {
        "node": ">=18.0.0",
        "npm": ">=8.0.0"
      },
      "optionalDependencies": {
        "@napi-rs/lzma-linux-x64-gnu": "1.5.1",
        "@rollup/rollup-android-arm-eabi": "4.65.0",
        "@rollup/rollup-android-arm64": "4.65.0",
        "@rollup/rollup-darwin-arm64": "4.65.0",
        "@rollup/rollup-darwin-x64": "4.65.0",
        "@rollup/rollup-freebsd-arm64": "4.65.0",
        "@rollup/rollup-freebsd-x64": "4.65.0",
        "@rollup/rollup-linux-arm-gnueabihf": "4.65.0",
        "@rollup/rollup-linux-arm-musleabihf": "4.65.0",
        "@rollup/rollup-linux-arm64-gnu": "4.65.0",
        "@rollup/rollup-linux-arm64-musl": "4.65.0",
        "@rollup/rollup-linux-loong64-gnu": "4.65.0",
        "@rollup/rollup-linux-loong64-musl": "4.65.0",
        "@rollup/rollup-linux-ppc64-gnu": "4.65.0",
        "@rollup/rollup-linux-ppc64-musl": "4.65.0",
        "@rollup/rollup-linux-riscv64-gnu": "4.65.0",
        "@rollup/rollup-linux-riscv64-musl": "4.65.0",
        "@rollup/rollup-linux-s390x-gnu": "4.65.0",
        "@rollup/rollup-linux-x64-gnu": "4.65.0",
        "@rollup/rollup-linux-x64-musl": "4.65.0",
        "@rollup/rollup-openbsd-x64": "4.65.0",
        "@rollup/rollup-openharmony-arm64": "4.65.0",
        "@rollup/rollup-win32-arm64-msvc": "4.65.0",
        "@rollup/rollup-win32-ia32-msvc": "4.65.0",
        "@rollup/rollup-win32-x64-gnu": "4.65.0",
        "@rollup/rollup-win32-x64-msvc": "4.65.0",
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/scheduler": {
      "version": "0.23.2",
      "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.23.2.tgz",
      "integrity": "sha512-UOShsPwz7NrMUqhR6t0hWjFduvOzbtv7toDH1/hIrfRNIDBnnBWd0CwJTGvTpngVlmwGCdP9/Zl/tVrDqcuYzQ==",
      "license": "MIT",
      "dependencies": {
        "loose-envify": "^1.1.0"
      }
    },
    "node_modules/siginfo": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/siginfo/-/siginfo-2.0.0.tgz",
      "integrity": "sha512-ybx0WO1/8bSBLEWXZvEd7gMW3Sn3JFlW3TvX1nREbDLRNQNaeNN8WK0meBwPdAaOI7TtRRRJn/Es1zhrrCHu7g==",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/source-map-js": {
      "version": "1.2.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.2.2.tgz",
      "integrity": "sha512-KGj/8Y43x35aZVDtt+J4mK1hoLGHULMYfSkODJNQjNDC3oW1PqPoxMwo0pLUsWM/UEGzON/NxeHywEfNXNP3Vw==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/stackback": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/stackback/-/stackback-0.0.2.tgz",
      "integrity": "sha512-1XMJE5fQo1jGH6Y/7ebnwPOBEkIEnT4QF32d5R1+VXdXveM0IBMJt8zfaxX1P3QhVwrYe+576+jkANtSS2mBbw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/std-env": {
      "version": "3.10.0",
      "resolved": "https://registry.npmjs.org/std-env/-/std-env-3.10.0.tgz",
      "integrity": "sha512-5GS12FdOZNliM5mAOxFRg7Ir0pWz8MdpYm6AY6VPkGpbA7ZzmbzNcBJQ0GPvvyWgcY7QAhCgf9Uy89I03faLkg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/streamsearch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/streamsearch/-/streamsearch-1.1.0.tgz",
      "integrity": "sha512-Mcc5wHehp9aXz1ax6bZUyY5afg9u2rv5cqQI3mRrYkGC8rW2hM02jWuwjtL++LS5qinSyhj2QfLyNsuc+VsExg==",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/strip-literal": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/strip-literal/-/strip-literal-3.1.0.tgz",
      "integrity": "sha512-8r3mkIM/2+PpjHoOtiAW8Rg3jJLHaV7xPwG+YRGrv6FP0wwk/toTpATxWYOW0BKdWwl82VT2tFYi5DlROa0Mxg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "js-tokens": "^9.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/antfu"
      }
    },
    "node_modules/strip-literal/node_modules/js-tokens": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/js-tokens/-/js-tokens-9.0.1.tgz",
      "integrity": "sha512-mxa9E9ITFOt0ban3j6L5MpjwegGz6lBQmM1IJkWeBZGcMxto50+eWdjC/52xDbS2vy0k7vIMK0Fe2wfL9OQSpQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/styled-jsx": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/styled-jsx/-/styled-jsx-5.1.1.tgz",
      "integrity": "sha512-pW7uC1l4mBZ8ugbiZrcIsiIvVx1UmTfw7UkC3Um2tmfUq9Bhk8IiyEIPl6F8agHgjzku6j0xQEZbfA5uSgSaCw==",
      "license": "MIT",
      "dependencies": {
        "client-only": "0.0.1"
      },
      "engines": {
        "node": ">= 12.0.0"
      },
      "peerDependencies": {
        "react": ">= 16.8.0 || 17.x.x || ^18.0.0-0"
      },
      "peerDependenciesMeta": {
        "@babel/core": {
          "optional": true
        },
        "babel-plugin-macros": {
          "optional": true
        }
      }
    },
    "node_modules/sucrase": {
      "version": "3.35.1",
      "resolved": "https://registry.npmjs.org/sucrase/-/sucrase-3.35.1.tgz",
      "integrity": "sha512-DhuTmvZWux4H1UOnWMB3sk0sbaCVOoQZjv8u1rDoTV0HTdGem9hkAZtl4JZy8P2z4Bg0nT+YMeOFyVr4zcG5Tw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.2",
        "commander": "^4.0.0",
        "lines-and-columns": "^1.1.6",
        "mz": "^2.7.0",
        "pirates": "^4.0.1",
        "tinyglobby": "^0.2.11",
        "ts-interface-checker": "^0.1.9"
      },
      "bin": {
        "sucrase": "bin/sucrase",
        "sucrase-node": "bin/sucrase-node"
      },
      "engines": {
        "node": ">=16 || 14 >=14.17"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/tailwindcss": {
      "version": "3.4.19",
      "resolved": "https://registry.npmjs.org/tailwindcss/-/tailwindcss-3.4.19.tgz",
      "integrity": "sha512-3ofp+LL8E+pK/JuPLPggVAIaEuhvIz4qNcf3nA1Xn2o/7fb7s/TYpHhwGDv1ZU3PkBluUVaF8PyCHcm48cKLWQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@alloc/quick-lru": "^5.2.0",
        "arg": "^5.0.2",
        "chokidar": "^3.6.0",
        "didyoumean": "^1.2.2",
        "dlv": "^1.1.3",
        "fast-glob": "^3.3.2",
        "glob-parent": "^6.0.2",
        "is-glob": "^4.0.3",
        "jiti": "^1.21.7",
        "lilconfig": "^3.1.3",
        "micromatch": "^4.0.8",
        "normalize-path": "^3.0.0",
        "object-hash": "^3.0.0",
        "picocolors": "^1.1.1",
        "postcss": "^8.4.47",
        "postcss-import": "^15.1.0",
        "postcss-js": "^4.0.1",
        "postcss-load-config": "^4.0.2 || ^5.0 || ^6.0",
        "postcss-nested": "^6.2.0",
        "postcss-selector-parser": "^6.1.2",
        "resolve": "^1.22.8",
        "sucrase": "^3.35.0"
      },
      "bin": {
        "tailwind": "lib/cli.js",
        "tailwindcss": "lib/cli.js"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/thenify": {
      "version": "3.3.1",
      "resolved": "https://registry.npmjs.org/thenify/-/thenify-3.3.1.tgz",
      "integrity": "sha512-RVZSIV5IG10Hk3enotrhvz0T9em6cyHBLkH/YAZuKqd8hRkKhSfCGIcP2KUY0EPxndzANBmNllzWPwak+bheSw==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "any-promise": "^1.0.0"
      }
    },
    "node_modules/thenify-all": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/thenify-all/-/thenify-all-1.6.0.tgz",
      "integrity": "sha512-RNxQH/qI8/t3thXJDwcstUO4zeqo64+Uy/+sNVRBx4Xn2OX+OZ9oP+iJnNFqplFra2ZUVeKCSa2oVWi3T4uVmA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "thenify": ">= 3.1.0 < 4"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tiny-invariant": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/tiny-invariant/-/tiny-invariant-1.3.3.tgz",
      "integrity": "sha512-+FbBPE1o9QAYvviau/qC5SE3caw21q3xkvWKBtja5vgqOWIHHJ3ioaq1VPfn/Szqctz2bU/oYeKd9/z5BL+PVg==",
      "license": "MIT"
    },
    "node_modules/tinybench": {
      "version": "2.9.0",
      "resolved": "https://registry.npmjs.org/tinybench/-/tinybench-2.9.0.tgz",
      "integrity": "sha512-0+DUvqWMValLmha6lr4kD8iAMK1HzV0/aKnCtWb9v9641TnP/MFb7Pc2bxoxQjTXAErryXVgUOfv2YqNllqGeg==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tinyexec": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/tinyexec/-/tinyexec-0.3.2.tgz",
      "integrity": "sha512-KQQR9yN7R5+OSwaK0XQoj22pwHoTlgYqmUscPYoknOoWCWfj/5/ABTMRi69FrKU5ffPVh5QcFikpWJI/P1ocHA==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/tinyglobby": {
      "version": "0.2.17",
      "resolved": "https://registry.npmjs.org/tinyglobby/-/tinyglobby-0.2.17.tgz",
      "integrity": "sha512-wXR/dYpcqKmfWpEdZjiKJOwCNFndD0DMnrW/cYjVGttEkBfVgcLFHoNrlj47mjOVic9yyNu65alsgF4NQyTa2g==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fdir": "^6.5.0",
        "picomatch": "^4.0.4"
      },
      "engines": {
        "node": ">=12.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/SuperchupuDev"
      }
    },
    "node_modules/tinyglobby/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/tinyglobby/node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/tinypool": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/tinypool/-/tinypool-1.1.1.tgz",
      "integrity": "sha512-Zba82s87IFq9A9XmjiX5uZA/ARWDrB03OHlq+Vw1fSdt0I+4/Kutwy8BP4Y/y/aORMo61FQ0vIb5j44vSo5Pkg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "^18.0.0 || >=20.0.0"
      }
    },
    "node_modules/tinyrainbow": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/tinyrainbow/-/tinyrainbow-2.0.0.tgz",
      "integrity": "sha512-op4nsTR47R6p0vMUUoYl/a+ljLFVtlfaXkLQmqfLR1qHma1h/ysYk4hEXZ880bf2CYgTskvTa/e196Vd5dDQXw==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/tinyspy": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/tinyspy/-/tinyspy-4.0.6.tgz",
      "integrity": "sha512-u8KszXvGfU68hVcZpRHKG28T0krMuv2G5nDhiHaMLen/gIuFEgIJhaJuO69qjnXg5paSrbPMFfx3brNuN8eVSg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/to-regex-range/-/to-regex-range-5.0.1.tgz",
      "integrity": "sha512-65P7iz6X5yEr1cwcgvQxbbIw7Uk3gOy5dIdtZ4rDveLqhrdJP+Li/Hx6tyK0NEb+2GCyneCMJiGqrADCSNk8sQ==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/ts-interface-checker": {
      "version": "0.1.13",
      "resolved": "https://registry.npmjs.org/ts-interface-checker/-/ts-interface-checker-0.1.13.tgz",
      "integrity": "sha512-Y/arvbn+rrz3JCKl9C4kVNfTfSm2/mEp5FSz5EsZSANGPSlQrpRI5M4PKF+mJnE52jOO90PnPSc3Ur3bTQw0gA==",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/undici": {
      "version": "7.30.1",
      "resolved": "https://registry.npmjs.org/undici/-/undici-7.30.1.tgz",
      "integrity": "sha512-03KrMbjIFDWQR5RNPrSw3bd1r12JpyFQl9/yxjUbJtqkjmllqC5lFjZh6ujeuJCKr8EOQvRW872Oy/az+nLYxg==",
      "license": "MIT",
      "engines": {
        "node": ">=20.18.1"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/update-browserslist-db": {
      "version": "1.3.4",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.3.4.tgz",
      "integrity": "sha512-t8wonIOdQyOjtPd2VktlBu6QjTVTks6v8bSi7kd0r2Vll8TK1JYDZtRRdbmCHOAMphkZgrzK+L+vXK4pyZ8t4A==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        },
        {
          "type": "github",
          "url": "https://github.com/sponsors/ai"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "escalade": "^3.2.0",
        "picocolors": "^1.1.1"
      },
      "bin": {
        "update-browserslist-db": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/use-sync-external-store": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/use-sync-external-store/-/use-sync-external-store-1.7.0.tgz",
      "integrity": "sha512-6L+EeigHMQhdaIPNIFUKwfWJSwWFQ8gJbJ2DLOs5sDIegTwR9fRxvnM3uciHKjIZhFz+KAv2emhWMRvDmMcY8A==",
      "license": "MIT",
      "peerDependencies": {
        "react": "^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/victory-vendor": {
      "version": "36.9.2",
      "resolved": "https://registry.npmjs.org/victory-vendor/-/victory-vendor-36.9.2.tgz",
      "integrity": "sha512-PnpQQMuxlwYdocC8fIJqVXvkeViHYzotI+NJrCuav0ZYFoq912ZHBk3mCeuj+5/VpodOjPe1z0Fk2ihgzlXqjQ==",
      "license": "MIT AND ISC",
      "dependencies": {
        "@types/d3-array": "^3.0.3",
        "@types/d3-ease": "^3.0.0",
        "@types/d3-interpolate": "^3.0.1",
        "@types/d3-scale": "^4.0.2",
        "@types/d3-shape": "^3.1.0",
        "@types/d3-time": "^3.0.0",
        "@types/d3-timer": "^3.0.0",
        "d3-array": "^3.1.6",
        "d3-ease": "^3.0.1",
        "d3-interpolate": "^3.0.1",
        "d3-scale": "^4.0.2",
        "d3-shape": "^3.1.0",
        "d3-time": "^3.0.0",
        "d3-timer": "^3.0.1"
      }
    },
    "node_modules/vite": {
      "version": "7.3.7",
      "resolved": "https://registry.npmjs.org/vite/-/vite-7.3.7.tgz",
      "integrity": "sha512-AHEzTORMbi7/7aXp7w7KZ5+DCUdSeLsJz0grY8xHpc9DHdYb0vQu6DqJfm2tOw3gDExNgPgnJTXxM6syYFHaCA==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "esbuild": "^0.27.0 || ^0.28.0",
        "fdir": "^6.5.0",
        "picomatch": "^4.0.3",
        "postcss": "^8.5.6",
        "rollup": "^4.43.0",
        "tinyglobby": "^0.2.15"
      },
      "bin": {
        "vite": "bin/vite.js"
      },
      "engines": {
        "node": "^20.19.0 || >=22.12.0"
      },
      "funding": {
        "url": "https://github.com/vitejs/vite?sponsor=1"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.3"
      },
      "peerDependencies": {
        "@types/node": "^20.19.0 || >=22.12.0",
        "jiti": ">=1.21.0",
        "less": "^4.0.0",
        "lightningcss": "^1.21.0",
        "sass": "^1.70.0",
        "sass-embedded": "^1.70.0",
        "stylus": ">=0.54.8",
        "sugarss": "^5.0.0",
        "terser": "^5.16.0",
        "tsx": "^4.8.1",
        "yaml": "^2.4.2"
      },
      "peerDependenciesMeta": {
        "@types/node": {
          "optional": true
        },
        "jiti": {
          "optional": true
        },
        "less": {
          "optional": true
        },
        "lightningcss": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        },
        "stylus": {
          "optional": true
        },
        "sugarss": {
          "optional": true
        },
        "terser": {
          "optional": true
        },
        "tsx": {
          "optional": true
        },
        "yaml": {
          "optional": true
        }
      }
    },
    "node_modules/vite-node": {
      "version": "3.2.4",
      "resolved": "https://registry.npmjs.org/vite-node/-/vite-node-3.2.4.tgz",
      "integrity": "sha512-EbKSKh+bh1E1IFxeO0pg1n4dvoOTt0UDiXMd/qn++r98+jPO1xtJilvXldeuQ8giIB5IkpjCgMleHMNEsGH6pg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cac": "^6.7.14",
        "debug": "^4.4.1",
        "es-module-lexer": "^1.7.0",
        "pathe": "^2.0.3",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0"
      },
      "bin": {
        "vite-node": "vite-node.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      }
    },
    "node_modules/vite/node_modules/fdir": {
      "version": "6.5.0",
      "resolved": "https://registry.npmjs.org/fdir/-/fdir-6.5.0.tgz",
      "integrity": "sha512-tIbYtZbucOs0BRGqPJkshJUYdL+SDH7dVM8gjy+ERp3WAUjLEFJE+02kanyHtwjWOnwrKYBiwAmM0p4kLJAnXg==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12.0.0"
      },
      "peerDependencies": {
        "picomatch": "^3 || ^4"
      },
      "peerDependenciesMeta": {
        "picomatch": {
          "optional": true
        }
      }
    },
    "node_modules/vite/node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/vitest": {
      "version": "3.2.7",
      "resolved": "https://registry.npmjs.org/vitest/-/vitest-3.2.7.tgz",
      "integrity": "sha512-KrxIJ62Fd89gfysR4WotlgZABiz2dqFPgqGzX7s+CwsqLFomRH7777ZcrOD6+WVAh7khPQP41A+BKbpcJFrdEg==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/chai": "^5.2.2",
        "@vitest/expect": "3.2.7",
        "@vitest/mocker": "3.2.7",
        "@vitest/pretty-format": "^3.2.7",
        "@vitest/runner": "3.2.7",
        "@vitest/snapshot": "3.2.7",
        "@vitest/spy": "3.2.7",
        "@vitest/utils": "3.2.7",
        "chai": "^5.2.0",
        "debug": "^4.4.1",
        "expect-type": "^1.2.1",
        "magic-string": "^0.30.17",
        "pathe": "^2.0.3",
        "picomatch": "^4.0.2",
        "std-env": "^3.9.0",
        "tinybench": "^2.9.0",
        "tinyexec": "^0.3.2",
        "tinyglobby": "^0.2.14",
        "tinypool": "^1.1.1",
        "tinyrainbow": "^2.0.0",
        "vite": "^5.0.0 || ^6.0.0 || ^7.0.0-0",
        "vite-node": "3.2.4",
        "why-is-node-running": "^2.3.0"
      },
      "bin": {
        "vitest": "vitest.mjs"
      },
      "engines": {
        "node": "^18.0.0 || ^20.0.0 || >=22.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/vitest"
      },
      "peerDependencies": {
        "@edge-runtime/vm": "*",
        "@types/debug": "^4.1.12",
        "@types/node": "^18.0.0 || ^20.0.0 || >=22.0.0",
        "@vitest/browser": "3.2.7",
        "@vitest/ui": "3.2.7",
        "happy-dom": "*",
        "jsdom": "*"
      },
      "peerDependenciesMeta": {
        "@edge-runtime/vm": {
          "optional": true
        },
        "@types/debug": {
          "optional": true
        },
        "@types/node": {
          "optional": true
        },
        "@vitest/browser": {
          "optional": true
        },
        "@vitest/ui": {
          "optional": true
        },
        "happy-dom": {
          "optional": true
        },
        "jsdom": {
          "optional": true
        }
      }
    },
    "node_modules/vitest/node_modules/picomatch": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-4.0.7.tgz",
      "integrity": "sha512-qcJu88Q2IWqJsDD529JKMdwGm/dvInW4HvQnRwiH9JtihJvzGOscDtHE3x1pBKeUOTysQ8kVmLnJ2kJu7yhcGA==",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/whatwg-encoding": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/whatwg-encoding/-/whatwg-encoding-3.1.1.tgz",
      "integrity": "sha512-6qN4hJdMwfYBtE3YBTTHhoeuUrDBPZmbQaxWAqSALV/MeEnR5z1xd8UKud2RAkFoPkmB+hli1TZSnyi84xz1vQ==",
      "deprecated": "Use @exodus/bytes instead for a more spec-conformant and faster implementation",
      "license": "MIT",
      "dependencies": {
        "iconv-lite": "0.6.3"
      },
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/whatwg-mimetype": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-mimetype/-/whatwg-mimetype-4.0.0.tgz",
      "integrity": "sha512-QaKxh0eNIi2mE9p2vEdzfagOKHCcj1pJ56EEHGQOVxp8r9/iszLUUV7v89x9O1p/T+NlTM5W7jW6+cz4Fq1YVg==",
      "license": "MIT",
      "engines": {
        "node": ">=18"
      }
    },
    "node_modules/why-is-node-running": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/why-is-node-running/-/why-is-node-running-2.3.0.tgz",
      "integrity": "sha512-hUrmaWBdVDcxvYqnyh09zunKzROWjbZTiNy8dBEjkS7ehEDQibXJ7XvlmtbwuTclUiIyN+CyXQD4Vmko8fNm8w==",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "siginfo": "^2.0.0",
        "stackback": "0.0.2"
      },
      "bin": {
        "why-is-node-running": "cli.js"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/zustand": {
      "version": "4.5.7",
      "resolved": "https://registry.npmjs.org/zustand/-/zustand-4.5.7.tgz",
      "integrity": "sha512-CHOUy7mu3lbD6o6LJLfllpjkzhHXSBlX8B9+qPddUsIfeF5S/UZ5q0kmCsnRqT1UHFQZchNFDDzMbQsuesHWlw==",
      "license": "MIT",
      "dependencies": {
        "use-sync-external-store": "^1.2.2"
      },
      "engines": {
        "node": ">=12.7.0"
      },
      "peerDependencies": {
        "@types/react": ">=16.8",
        "immer": ">=9.0.6",
        "react": ">=16.8"
      },
      "peerDependenciesMeta": {
        "@types/react": {
          "optional": true
        },
        "immer": {
          "optional": true
        },
        "react": {
          "optional": true
        }
      }
    }
  }
}

```

## package.json

```json
{"name":"lotto-notebook","version":"1.0.0","private":true,"scripts":{"dev":"next dev","build":"next build","start":"next start","test":"vitest run","typecheck":"tsc --noEmit"},"dependencies":{"next":"^14.2.35","react":"^18.3.1","react-dom":"^18.3.1","zustand":"^4.5.7","recharts":"^2.15.4","framer-motion":"^11.18.2","cheerio":"^1.0.0"},"devDependencies":{"typescript":"^5.7.3","@types/node":"^22.10.0","@types/react":"^18.3.18","@types/react-dom":"^18.3.5","tailwindcss":"^3.4.17","postcss":"^8.5.1","autoprefixer":"^10.4.20","vitest":"^3.2.4"}}

```

## postcss.config.mjs

```mjs
export default {plugins:{tailwindcss:{},autoprefixer:{}}};

```

## tailwind.config.ts

```ts
import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}'],darkMode:'class',theme:{extend:{}},plugins:[]} satisfies Config;

```

## tests/core.test.ts

```ts
import {describe,it,expect} from 'vitest';
import {choose,rank,prize,generate,defaultFilters,crowding,statistics,matches,validNumbers} from '../lib/math';
import {TOTAL,ODDS,PROVIDED_ODDS,WEIGHTS} from '../lib/constants';
import {canSpend,monthSpent,weekSpent} from '../lib/budget';
import {useStore} from '../lib/store';
import type {Draw,Game} from '../lib/types';
const draw:Draw={round:1,date:'2002-12-07',numbers:[1,2,3,4,5,6],bonus:7,prizes:{1:1000000,2:200000,3:100000},source:'test'};
describe('당첨 판정',()=>{
 it.each([[ [1,2,3,4,5,6],1],[[1,2,3,4,5,7],2],[[1,2,3,4,5,8],3],[[1,2,3,4,7,8],4],[[1,2,3,7,8,9],5],[[1,2,7,8,9,10],0]])('보너스를 포함해 %j → %i',(a,r)=>expect(rank(a as number[],draw)).toBe(r));
 it('중복·범위 오류는 거부',()=>{expect(()=>rank([1,1,2,3,4,5],draw)).toThrow();expect(()=>rank([1,2,3,4,5,46],draw)).toThrow();});
 it('공식 변동 당첨금만 사용, 미확보는 null',()=>{expect(prize([1,2,3,4,5,7],draw).gross).toBe(200000);expect(prize([1,2,3,4,5,7],{...draw,prizes:{}}).gross).toBeNull();expect(prize([1,2,3,4,7,8],draw).gross).toBe(50000);});
});
describe('조합과 확률',()=>{it('6/45 조합 수',()=>expect(choose(45,6)).toBe(TOTAL));it('등위별 조합 수 계산',()=>{expect([1,6,choose(6,5)*38,choose(6,4)*choose(39,2),choose(6,3)*choose(39,3)]).toEqual(ODDS.map(x=>x.count));expect(ODDS.reduce((s,x)=>s+x.count,0)).toBe(194130);});it('표기 확률과 반올림 허용 오차',()=>{ODDS.forEach(o=>expect(Math.abs(o.count/TOTAL*100-Number(o.percent))).toBeLessThan(.0005));expect(ODDS.map(x=>x.denominator)).toEqual(['8,145,060','1,357,510','35,723.9','732.8','44.6']);});});
describe('생성',()=>{it('암호학적 난수 조합 유효·중복 없음',async()=>{const a=await generate(5,'random',defaultFilters);expect(new Set(a.map(x=>x.join(','))).size).toBe(5);expect(a.every(x=>validNumbers(x))).toBe(true);});it('동일 시드 재현',async()=>expect(await generate(5,'random',defaultFilters,[],'test')).toEqual(await generate(5,'random',defaultFilters,[],'test')));it('필터 준수',async()=>{const f={...defaultFilters,include:[2,44],exclude:[1,3],odd:3,min:100,max:190,consecutive:false,endingLimit:2};const a=await generate(5,'filter',f);expect(a.every(x=>matches(x,f))).toBe(true);});it('불가능한 조건 종료',async()=>{await expect(generate(1,'filter',{...defaultFilters,include:[1],exclude:[1]})).rejects.toThrow();await expect(generate(2,'random',{...defaultFilters,include:[1,2,3,4,5,6]})).rejects.toThrow();});it('회피 모드도 유효한 서로 다른 조합',async()=>{const a=await generate(5,'avoid',defaultFilters,[],'avoid');expect(new Set(a.map(x=>x.join(','))).size).toBe(5);expect(a.every(x=>validNumbers(x))).toBe(true);});});
describe('점수·통계',()=>{it('가중치 합 1 및 점수 범위',()=>{expect(Object.values(WEIGHTS).reduce((s,x)=>s+x,0)).toBeCloseTo(1);expect(crowding([1,2,3,4,5,6]).score).toBeLessThanOrEqual(100);});it('격자 줄바꿈은 직선 아님',()=>{expect(crowding([6,7,8,20,31,45]).details.find(x=>x.key==='line')?.value).toBe(0);expect(crowding([1,8,15,28,37,45]).details.find(x=>x.key==='line')?.value).toBe(1);});it('보너스와 본번호 통계 분리',()=>{const s=statistics([draw]);expect(s.frequency[6]).toBe(0);expect(s.bonus[6]).toBe(1);expect(s.frequency.reduce((s,x)=>s+x,0)).toBe(6);expect(s.consecutiveRate).toBe(1);});});
describe('예산',()=>{const now=new Date('2026-10-25T12:00:00+09:00'),entries=[{id:'a',at:'2026-10-01T01:00:00+09:00',amount:19000}];it('잔여 금액까지 허용·초과 차단',()=>{expect(canSpend(20000,entries,1000,now)).toBe(true);expect(canSpend(20000,entries,2000,now)).toBe(false);expect(canSpend(0,[],1000,now)).toBe(false);});it('한국 월 경계',()=>{expect(monthSpent([{id:'x',at:'2026-09-30T15:01:00Z',amount:1000}],now)).toBe(1000);});it('이번 주 월요일 경계',()=>expect(weekSpent([{id:'x',at:'2026-10-18T15:00:00Z',amount:5000}],now)).toBe(5000));it('실제 저장·구매 액션에서 초과 차단',()=>{useStore.setState({budget:0,purchases:[],games:[]});const g:Game={id:'x',round:1,numbers:[1,2,3,4,5,6],selection:'수동',note:'',favorite:false,createdAt:now.toISOString()};expect(useStore.getState().saveGame(g)).toBe('budget');expect(useStore.getState().purchase(1000)).toBe(false);expect(useStore.getState().games).toHaveLength(0);useStore.setState({budget:1000});expect(useStore.getState().saveGame(g)).toBe('saved');expect(useStore.getState().saveGame(g)).toBe('duplicate');expect(useStore.getState().purchase(1000)).toBe(true);expect(useStore.getState().purchase(1000)).toBe(false);});});

it('요청 원본 표는 참고용으로 보존',()=>expect(PROVIDED_ODDS.map(o=>o.count)).toEqual([1,6,234,11115,182780]));

```

## tsconfig.json

```json
{"compilerOptions":{"target":"ES2022","lib":["dom","dom.iterable","esnext"],"allowJs":true,"skipLibCheck":true,"strict":true,"noEmit":true,"esModuleInterop":true,"module":"esnext","moduleResolution":"bundler","resolveJsonModule":true,"isolatedModules":true,"jsx":"preserve","incremental":true,"plugins":[{"name":"next"}],"paths":{"@/*":["./*"]}},"include":["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"],"exclude":["node_modules"]}

```

## vercel.cron.example.json

```json
{"crons":[{"path":"/api/cron","schedule":"0 12 * * 6"}]}

```

