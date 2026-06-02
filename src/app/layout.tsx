import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "STOCK 30",
  description: "온라인 언급 흐름과 뉴스 노출 흐름을 기반으로 주식 랭킹을 보여주는 참고 정보 서비스입니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
