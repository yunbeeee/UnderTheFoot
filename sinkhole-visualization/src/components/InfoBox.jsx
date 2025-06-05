export default function InfoBox({ sinkhole }) {
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

  return (
    <div className="mt-4 p-4 bg-red-50 rounded shadow text-sm">
      <p><strong>주소:</strong> {sinkhole.addr}</p>
      <p><strong>시기:</strong> {sinkhole.sagoDate}</p>
      <p><strong>날씨:</strong> 폭우</p>
      <p><strong>발생 원인:</strong> {causes.join(', ')}</p>
      <p><strong>면적:</strong> {sinkhole.sinkArea}</p>
      <p><strong>깊이:</strong> {sinkhole.sinkDepth}</p>
      

      {sinkhole.deathCnt > 0 || sinkhole.injuryCnt > 0 || sinkhole.vehicleCnt > 0 ? (
        <div>
          <p><strong>피해정도:</strong></p>
          {sinkhole.deathCnt > 0 && <p>사망자 {sinkhole.deathCnt}명</p>}
          {sinkhole.injuryCnt > 0 && <p>부상자 {sinkhole.injuryCnt}명</p>}
          {sinkhole.vehicleCnt > 0 && <p>피해 차량 {sinkhole.vehicleCnt}대</p>}
        </div>
      ) : (
        <p><strong>피해정도:</strong> -</p>
      )}
    </div>
  );
}