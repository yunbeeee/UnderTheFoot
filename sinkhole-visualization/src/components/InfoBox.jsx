export default function InfoBox({ sinkhole, weatherMap }) {
  if (!sinkhole) {
    return null;
  }

  // 원인 파싱
  let causes = [];
  try {
    let raw = sinkhole.sagoDetailProcessed;
    if (typeof raw === 'string') raw = JSON.parse(raw.replace(/'/g, '"'));
    causes = Array.isArray(raw) ? raw.map(d => d.trim()) : [raw.trim()];
  } catch {
    causes = typeof sinkhole.sagoDetailProcessed === 'string'
      ? [sinkhole.sagoDetailProcessed.trim()]
      : [];
  }

  let weatherInfo = null;
  if (sinkhole && weatherMap) {
    const dateStr = sinkhole.sagoDate?.toString().slice(0, 8); // e.g., "20180101"
    const region = sinkhole.sigungu;
    const key = `${dateStr}_${region}`; // Match App.js convention
    weatherInfo = weatherMap[key];
    console.log("Weather key:", key, "Matched weather info:", weatherInfo);
  }

  return (
    <div className="mt-4 p-4 bg-red-50 rounded shadow text-sm">


      <p className="mb-2"><strong>주소:</strong> {sinkhole.addr}</p>
      <p className="mb-2"><strong>시기:</strong> {sinkhole.sagoDate}</p>
      <p className="mb-2"><strong>날씨:</strong> 평균기온 {weatherInfo?.temp ?? '-'}°C | 강수량 {weatherInfo?.rain ?? '-'}mm</p>
      <p className="mb-2"><strong>발생 원인:</strong> {causes.join(' | ')}</p>
      <p className="mb-2"><strong>규모:</strong> 너비 {sinkhole.sinkWidth ?? '-'}m × 길이 {sinkhole.sinkExtend ?? '-'}m × 깊이 {sinkhole.sinkDepth ?? '-'}m</p>

      <p className="mb-2"><strong>피해정도:</strong> {
        [
          `사망자 ${sinkhole.deathCnt > 0 ? `${sinkhole.deathCnt}명` : '-'}`,
          `부상자 ${sinkhole.injuryCnt > 0 ? `${sinkhole.injuryCnt}명` : '-'}`,
          `피해 차량 ${sinkhole.vehicleCnt > 0 ? `${sinkhole.vehicleCnt}대` : '-'}`
        ].join(' | ')
      }</p>
    </div>
  );
}