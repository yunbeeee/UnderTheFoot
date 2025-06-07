import React, { useState, useEffect, useRef } from 'react';
import KakaoMap from './components/KakaoMap';
import SeoulMap from './components/SeoulMap';
import ChartPanel from './components/ChartPanel';
import InfoBox from './components/InfoBox';
import weatherCsv from './data/weather_with_sigungu.csv';
import * as d3 from 'd3';

function App() {
  const [selectedSinkhole, setSelectedSinkhole] = useState(null);
  useEffect(() => {
    console.log("[App] selectedSinkhole 변경:", selectedSinkhole);
  }, [selectedSinkhole]);
  //이지
  const [selectedCauses, setSelectedCauses] = useState([]); // 중복 선택 허용 -> 배열로 관리
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [depthRange, setDepthRange] = useState([0, 20])
  const [areaRange, setAreaRange] = useState([0, 300])
  const [weatherMap, setWeatherMap] = useState({});
  const [clickedFromMap, setClickedFromMap] = useState(false);
  const [showRain, setShowRain] = useState(false);
  const [showRepaired, setShowRepaired] = useState(false);
  const [showDamaged, setShowDamaged] = useState(false);
  useEffect(() => {
    console.log("[App] clickedFromMap 상태 변경:", clickedFromMap);
  }, [clickedFromMap]);

  useEffect(() => {
    d3.csv(weatherCsv).then(data => {
      const map = {};
      data.forEach(row => {
        const key = `${row['일시_modified']}_${row.sigungu}`;
        const temp = row['평균기온(°C)'];
        const rain = row['일강수량(mm)'];
        map[key] = { temp, rain };
        console.log('[App DEBUG] Weather key created:', key, '→', map[key]);
      });
      console.log('[App DEBUG] Total weatherMap keys:', Object.keys(map).length);
      setWeatherMap(map);
    }).catch(err => {
      console.error('[App ERROR] Failed to load weather CSV:', err);
    });
  }, []);

  // 윤희
  const [dateRange, setDateRange] = useState([null, null]); // [startDate, endDate]
  
  const [selectedGu, setSelectedGu] = useState(null);

  const mapRef = useRef(); // leaflet Map 인스턴스 접근용
  const [isReset, setIsReset] = useState(true); // 초기화 여부

  const handleSinkholeSelect = (sinkhole) => {
    if (!sinkhole) {
      // 초기화 시 사용됨
      setSelectedSinkhole(null);
      setSelectedCauses([]);
      setSelectedMonths([]);
      return;
    }
    // 같은 핀을 클릭해서 해제하는 경우
    if (selectedSinkhole && selectedSinkhole.sagoNo === sinkhole.sagoNo) {
      setSelectedSinkhole(null);
      return;
    }

    // 새로운 핀을 선택하는 경우
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
    const causes = parsed
      .map(d => (typeof d === 'string' ? d.trim() : ''))
      .filter(Boolean);   // 빈 문자열 제거
    setSelectedCauses(causes);

    // 발생 월 처리
    const dateStr = sinkhole.sagoDate?.toString();
    const month = dateStr && dateStr.length >= 6 ? dateStr.substring(4, 6) : null;
    setSelectedMonths([month]);
    setClickedFromMap(false);
    // 처리 필요
    // setSelectedMonths(month ? [month] : []);
    
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
              selectedGu={selectedGu}
              setSelectedGu={setSelectedGu}
              mapRef={mapRef}
              selectedSinkhole={selectedSinkhole}
              setSelectedSinkhole={handleSinkholeSelect} 
              selectedCauses={selectedCauses} 
              setSelectedCauses={setSelectedCauses}
              selectedMonths={selectedMonths}
              setSelectedMonths={setSelectedMonths}
              depthRange={depthRange}
              areaRange={areaRange}
              dateRange={dateRange}
              setDateRange={setDateRange}
              isReset={isReset}
              setIsReset={setIsReset}
              clickedFromMap={clickedFromMap}
              setClickedFromMap={setClickedFromMap}
              showRain={showRain}
              showRepaired={showRepaired}
              showDamaged={showDamaged}
            />
          </div>
          <InfoBox sinkhole={selectedSinkhole} weatherMap={weatherMap} />
        </div>
        {/* 오른쪽 (차트) */}
        <div className="w-60 h-[806px] bg-white p-4 rounded shadow overflow-auto">
          <ChartPanel 
            selectedSinkhole={selectedSinkhole}
            setSelectedSinkhole={setSelectedSinkhole}
            selectedCauses={selectedCauses} 
            setSelectedCauses={setSelectedCauses}
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            depthRange={depthRange} 
            setDepthRange={setDepthRange}
            areaRange={areaRange}
            setAreaRange={setAreaRange}
            clickedFromMap={clickedFromMap}
            setClickedFromMap={setClickedFromMap}
            showRain={showRain}
            setShowRain={setShowRain}
            showRepaired={showRepaired}
            setShowRepaired={setShowRepaired}
            showDamaged={showDamaged}
            setShowDamaged={setShowDamaged}
            weatherMap={weatherMap}
            setSelectedGu={setSelectedGu}
            setIsReset={setIsReset}
          />
        </div>
      </div>

    </div>
  );
}

export default App;