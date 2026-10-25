import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/provider';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(req:NextRequest){const end=Number(req.nextUrl.searchParams.get('round')||1247),n=Number(req.nextUrl.searchParams.get('n')||100);if(!Number.isInteger(end)||end<1||end>10000||!Number.isInteger(n)||n<1||n>100)return NextResponse.json({error:'회차 1~10000, 조회 수 1~100'}, {status:400});return NextResponse.json(await getResults(end,n));}
