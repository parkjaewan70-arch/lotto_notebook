import {NextRequest,NextResponse} from 'next/server';
import {getResults} from '@/lib/provider';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:'인증 필요'},{status:401});const round=Math.floor((Date.now()-Date.parse('2002-12-07T20:40:00+09:00'))/604800000)+1;return NextResponse.json(await getResults(round,1));}
