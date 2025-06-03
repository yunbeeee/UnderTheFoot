export default function ChartPanel() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="bg-zinc-200 h-[160px] rounded p-2">
        <p className="text-sm font-semibold mb-1">원인별 발생 빈도</p>
        {/* 여기에 bar chart 삽입 */}
      </div>
      <div className="bg-zinc-200 h-[160px] rounded p-2">
        <p className="text-sm font-semibold mb-1">월별 사고</p>
        {/* 여기에 bar chart 삽입 */}
      </div>
      <div className="bg-zinc-200 h-[160px] rounded p-2">
        <p className="text-sm font-semibold mb-1">시간별 강수량 변화</p>
        {/* 여기에 line chart 삽입 */}
      </div>
      <div className="bg-zinc-200 h-[160px] rounded p-2">
        <p className="text-sm font-semibold mb-1">폭 vs 깊이</p>
        {/* 여기에 scatter plot 삽입 */}
      </div>
    </div>
  );
}
