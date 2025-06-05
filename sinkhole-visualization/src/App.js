import React from 'react';
import KakaoMap from './components/KakaoMap';
import SeoulMap from './components/SeoulMap';
import ChartPanel from './components/ChartPanel';
import InfoBox from './components/InfoBox';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 타이틀 */}
      <h1 className="text-3xl font-bold mb-6">
        Under the foot: <span className="text-black">당신의 발 밑은 안전한가요?</span>
      </h1>

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
            <SeoulMap />
          </div>
            <InfoBox />
        </div>
        {/* 오른쪽 (차트) */}
        <div className="w-60 h-[806px] bg-white p-4 rounded shadow overflow-auto">
          <ChartPanel />
        </div>
      </div>

    </div>
  );
}

export default App;
