import type { Metadata } from "next";
import { TvDashboard } from "@/components/tv/TvDashboard";

export const metadata: Metadata = {
  title: "STOCK 30 TV",
  description: "온라인 언급 기반 주식 TOP 30을 16:9 방송 화면으로 보여주는 참고 정보 페이지입니다.",
};

export default function TvPage() {
  return <TvDashboard />;
}
