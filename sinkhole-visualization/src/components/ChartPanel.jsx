import React, { useState } from 'react';
import RangeSlider from '../interactions/RangeSlider';

const ChartPanel = () => {
  const [areaRange, setAreaRange] = useState([0, 100]); // 면적
  const [depthRange, setDepthRange] = useState([0, 30]); // 깊이

  return (
    <div className="w-full p-4 bg-white rounded shadow overflow-y-auto max-h-[800px]">
      <h2 className="text-lg font-semibold mb-4">📊 싱크홀 데이터 분석</h2>

      <RangeSlider
        min={0}
        max={100}
        value={areaRange}
        onChange={setAreaRange}
        label="면적 범위"
      />

      <RangeSlider
        min={0}
        max={30}
        value={depthRange}
        onChange={setDepthRange}
        label="깊이 범위"
      />

      {/* 여기에 차트 넣기 */}
      <div className="mt-8 text-sm text-gray-500">
        ※ 차트는 선택한 범위에 따라 동적으로 렌더링됩니다.
      </div>
    </div>
  );
};

export default ChartPanel;
