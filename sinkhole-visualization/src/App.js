import React, { useState } from 'react';
import KakaoMap from './components/KakaoMap';
import SeoulMap from './components/SeoulMap';
import ChartPanel from './components/ChartPanel';
import InfoBox from './components/InfoBox';

function App() {
  const [selectedSinkhole, setSelectedSinkhole] = useState(null);
  const [selectedCauses, setSelectedCauses] = useState([]); // 중복 선택 허용 -> 배열로 관리
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [depthRange, setDepthRange] = useState([0, 20])
  const [areaRange, setAreaRange] = useState([0, 300])

  const handleSinkholeSelect = (sinkhole) => {
    setSelectedSinkhole(sinkhole);
  
    // 원인을 배열로 파싱
    let raw = sinkhole?.sagoDetailProcessed;
    let parsed = [];
  
    try {
      if (typeof raw === 'string') raw = JSON.parse(raw.replace(/'/g, '"'));
      parsed = Array.isArray(raw) ? raw : [raw];
    } catch {
      parsed = typeof raw === 'string' ? [raw] : [];
    }
  
    // 항상 배열 형태로 trim 적용 후 저장 <- 단일 원인에도 적용하기 위함
    const causes = parsed.map(d => d.trim()).filter(Boolean);
    setSelectedCauses(causes);

    // 발생 월 처리
    const dateStr = sinkhole.sagoDate?.toString();
    const month = dateStr && dateStr.length >= 6 ? dateStr.substring(4, 6) : null;
    setSelectedMonths([month]);
  };


  

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 타이틀 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Under the foot: <span className="text-black">당신의 발 밑은 안전한가요?</span>
        </h1>
        <div className="flex space-x-4 text-sm">
          <a
            href="https://www.safekorea.go.kr/idsiSFK/neo/main/main.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📩 신고하기
          </a>
          <a
            href="https://www.safekorea.go.kr/idsiSFK/neo/bbs/docs/view.do?bbs_cd=1005&seq=14127"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            📘 대처법 보기
          </a>
        </div>
      </div>

      {/* 3단 고정 레이아웃 */}
      <div className="flex gap-4 mx-auto max-w-[2000px]">
        {/* 왼쪽 (검색 + 카카오맵) */}
        <div className="w-96 h-[806px] bg-white p-4 rounded shadow overflow-auto">
          <KakaoMap />
        </div>

        {/* 가운데 (서울 지도) */}
        {/* <div className="w-[701px] h-[596px] bg-white p-4 rounded shadow">
          <SeoulMap />
          <InfoBox />
        </div> */}
        <div className="flex flex-col w-[701px] bg-white p-4 rounded shadow">
          <div className="h-[596px]">
            <SeoulMap 
            setSelectedSinkhole={handleSinkholeSelect} 
            selectedCauses={selectedCauses} 
            selectedMonths={selectedMonths}
            depthRange={depthRange}
            areaRange={areaRange}
            />
          </div>
          <InfoBox sinkhole={selectedSinkhole} />
        </div>
        {/* 오른쪽 (차트) */}
        <div className="w-60 h-[806px] bg-white p-4 rounded shadow overflow-auto">
          <ChartPanel 
          selectedCauses={selectedCauses} 
          setSelectedCauses={setSelectedCauses}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          depthRange={depthRange} 
          setDepthRange={setDepthRange}
          areaRange={areaRange}
          setAreaRange={setAreaRange}
          />
        </div>
      </div>

    </div>
  );
}

export default App;