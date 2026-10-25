import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'로또 노트 | 6/45 정보·번호관리',description:'공식 결과를 참고하고 번호와 예산을 기록하는 도구'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
