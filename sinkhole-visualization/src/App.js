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
  const [selectedCauses, setSelectedCauses] = useState([]); // 중복 선택 허용 -> 배열로 관리
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [depthRange, setDepthRange] = useState([0, 20])
  const [areaRange, setAreaRange] = useState([0, 300])
  const [dateRange, setDateRange] = useState([null, null]); // [startDate, endDate]
  
  const [selectedGu, setSelectedGu] = useState(null);

  const mapRef = useRef(); // leaflet Map 인스턴스 접근용
  const [isReset, setIsReset] = useState(true); // 초기화 여부
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

  const handleSinkholeSelect = (sinkhole) => {
  if (!sinkhole) {
    // 초기화 시 사용됨
    setSelectedSinkhole(null);
    setSelectedCauses([]);
    setSelectedMonths([]);
    return;
    }
    // 아래 3줄 이지지
    if (clickedFromMap) {
      setSelectedSinkhole(sinkhole);
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
    setSelectedMonths(month ? [month] : []);
    // 아래 두 줄 이지지
    // setSelectedMonths([month]);
    setClickedFromMap(false);
    
  };


  

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 타이틀 */}
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">
          Under the foot: <span className="text-black">당신의 발 밑은 안전한가요?</span>
        </h1>
        <div className="w-[55%] flex justify-end space-x-4 text-sm">
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
        <div className="w-96 h-[903px] bg-white p-4 rounded shadow overflow-auto">
          <KakaoMap />
        </div>

        {/* 가운데 (서울 지도) */}

        <div className="flex flex-col w-[701px] bg-white p-4 rounded shadow">
          <div className="h-[596px]">
            <SeoulMap 
              // setSelectedSinkhole={setSelectedSinkhole}
              setSelectedSinkhole={handleSinkholeSelect} 
              selectedGu={selectedGu}
              setSelectedGu={setSelectedGu}
              mapRef={mapRef}
              selectedCauses={selectedCauses}
              setSelectedCauses={setSelectedCauses}
              selectedMonths={selectedMonths}
              setSelectedMonths={setSelectedMonths}
              depthRange={depthRange}
              areaRange={areaRange}
              selectedSinkhole={selectedSinkhole}
              clickedFromMap={clickedFromMap}
              setClickedFromMap={setClickedFromMap}
              showRain={showRain}
              showRepaired={showRepaired}
              showDamaged={showDamaged}
              setShowRain={setShowRain}
              setShowRepaired={setShowRepaired}
              setShowDamaged={setShowDamaged}
              dateRange={dateRange}
              setDateRange={setDateRange}
              isReset={isReset}
              setIsReset={setIsReset}
              setAreaRange={setAreaRange}
              setDepthRange={setDepthRange}
            />
          </div>

          <div className="mt-3">
            <h2 className="text-base font-semibold mb-2 mt-4">
              🗂️ 싱크홀 상세 정보
              <span className="text-gray-500 text-sm font-normal ml-2">
                (지도의 핀을 클릭하면 정보가 표시됩니다)
              </span>
            </h2>
            <InfoBox sinkhole={selectedSinkhole} weatherMap={weatherMap} />
          </div>
        </div>
        {/* 오른쪽 (차트) */}
        <div className="w-100 h-[903px] bg-white p-4 rounded shadow overflow-auto">
          <ChartPanel 
            selectedCauses={selectedCauses} 
            setSelectedCauses={setSelectedCauses}
            selectedMonths={selectedMonths}
            setSelectedMonths={setSelectedMonths}
            depthRange={depthRange} 
            setDepthRange={setDepthRange}
            areaRange={areaRange}
            setAreaRange={setAreaRange}
            selectedSinkhole={selectedSinkhole}
            setSelectedSinkhole={setSelectedSinkhole}
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