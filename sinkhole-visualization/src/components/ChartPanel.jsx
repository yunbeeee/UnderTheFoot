import React, { useState } from 'react';
import RangeSlider from '../interactions/RangeSlider';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter } from 'recharts';
import sinkholes from '../sinkholes.json';
import * as d3 from 'd3';
import { parse } from 'json5';
import './ChartPanel.css';

const ChartPanel = ({ 
  selectedCauses, setSelectedCauses, 
  selectedMonths, setSelectedMonths,
  depthRange, setDepthRange, 
  areaRange, setAreaRange,
  selectedSinkhole, setSelectedSinkhole,
}) => {

  // 원인 카테고리별 카운트
  const causeCounts = {};
  sinkholes.forEach(item => {
    let details = item.sagoDetailProcessed;
    try {
      if (typeof details === 'string') {
        details = JSON.parse(details.replace(/'/g, '"')); // 문자열 리스트 처리
      }
    } catch {
      details = [details];
    }

    if (!Array.isArray(details)) {
      details = [details];
    }

    details.forEach(cause => {
      const cleaned = cause.trim();
      if (cleaned) {
        causeCounts[cleaned] = (causeCounts[cleaned] || 0) + 1;
      }
    });
  });


  const chartData = Object.entries(causeCounts).map(([name, count]) => ({
    name,
    count,
  })).sort((a, b) => b.count - a.count);

  const handleClick = (name) => {
    if (selectedCauses.includes(name)) {
      setSelectedCauses(selectedCauses.filter(cause => cause !== name));
    } else {
      setSelectedCauses([...selectedCauses, name]);
    }
  };

  // 월별 사고 건수 카운트
  const monthCounts = new Array(12).fill(0); // 0~11: 1월~12월
  sinkholes.forEach(item => {
    const dateStr = String(item.sagoDate);
    if (dateStr.length >= 6) {
      const month = parseInt(dateStr.slice(4, 6), 10); // "YYYYMMDD" → MM
      if (month >= 1 && month <= 12) {
        monthCounts[month - 1]++;
      }
    }
  });

  // 차트용 데이터로 변환
  const monthChartData = monthCounts.map((count, index) => {
    const paddedMonth = (index + 1).toString().padStart(2, '0'); // '01' ~ '12'
    return {
      month: paddedMonth,
      count,
    };
  });
  
  const handleMonthClick = (month) => {
    if (selectedMonths.includes(month)) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  };
  

  return (
    <div className="chart-panel-container" /* w-full p-4 bg-white rounded shadow overflow-y-auto max-h-[800px] */>
      <h2 className="chart-panel-title-main" /* text-lg font-semibold mb-4 */>📊 싱크홀 데이터 분석</h2>
      <div className="chart-header-note" /* text-sm text-gray-500 */>
        ※ 차트는 선택한 범위에 따라 동적으로 렌더링됩니다.
      </div>
      {/* 여기에 차트 넣기 */}
      <h3 className="chart-section-title" /* mt-8 text-base font-semibold */>🧭 발생 원인별 카운트</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart className='chart-area'
          data={chartData}         >
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 7 }} 
            interval={0}
            angle={-30}
            textAnchor='end'
          />
          <YAxis 
            type="number" 
            tick={{ fontSize: 7 }} 
            width={20}
          />
          <Tooltip />
          <Bar dataKey="count">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                cursor="pointer"
                fill="#ef4444"
                fillOpacity={ 
                  selectedCauses.length === 0 || selectedCauses.includes(entry.name)
                    ? 1
                    : 0.4
                }
                onClick={() => handleClick(entry.name)}
              />            
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <h3 className="chart-section-title" /* mt-8 text-base font-semibold */>📅 월별 사고 건수</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart className='chart-area'
          data={monthChartData} 
        >
          <XAxis 
            dataKey="month" 
            tickFormatter={m => `${parseInt(m, 10)}월`}
            tick={{ fontSize: 6 }}
            interval={0} 
            angle={-30}
            textAnchor="end"
          />
          <YAxis 
            type="number"
            tick={{ fontSize: 7 }}
            width={20}
          />
          <Tooltip />
          <Bar dataKey="count">
            {monthChartData.map((entry, index) => (
              <Cell
                key={`month-cell-${index}`}
                cursor="pointer"
                fill="#60a5fa"
                fillOpacity={
                  selectedMonths.length === 0 || selectedMonths.includes(entry.month)
                    ? 1
                    : 0.4
                }
                onClick={() => handleMonthClick(entry.month)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <h3 className="chart-section-title" /* text-base font-semibold mb-2 */>📍 면적(m²) vs. 깊이(m) 산점도</h3>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart className='chart-area'
        >
          <XAxis 
            type="number" 
            dataKey="sinkArea" 
            name="면적" 
            tick={{ fontSize: 7 }}
            axisLine={true}
            interval={0}
            // unit='m²'
            angle={-30}
            tickMargin={4}
          />
          {/* XAxis label for 면적 (m²) */}
          {/* <XAxis
            hide
            label={{ value: '면적 (m²)', position: 'insideBottomRight', offset: -10 }}
          /> */}
          <YAxis 
            type="number" 
            dataKey="sinkDepth" 
            name="깊이" 
            tick={{ fontSize: 7 }}
            axisLine={true}
            // unit='m'
            tickMargin={4}
            width={20}
          />
          {/* YAxis label for 깊이 (m) */}
          {/* <YAxis
            hide
            label={{ value: '깊이 (m)', angle: -90, position: 'insideLeft' }}
          /> */}
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            name="싱크홀"
            data={sinkholes
              .filter(hole => {
                const area = Number(hole.sinkArea);
                const depth = Number(hole.sinkDepth);
                return (
                  !isNaN(area) &&
                  !isNaN(depth) &&
                  area >= areaRange[0] &&
                  area <= areaRange[1] &&
                  depth >= depthRange[0] &&
                  depth <= depthRange[1]
                );
              })
              .map(hole => ({
                ...hole,
                opacity:
                  selectedSinkhole && selectedSinkhole.sinkNo !== hole.sinkNo
                    ? 0.3
                    : 1,
              }))}
            fill="#10b981"
            onClick={(e) => {
              if (e && e.payload) {
                setSelectedSinkhole(e.payload);
              }
            }}
          >
            {sinkholes
              .filter(hole => {
                const area = Number(hole.sinkArea);
                const depth = Number(hole.sinkDepth);
                return (
                  !isNaN(area) &&
                  !isNaN(depth) &&
                  area >= areaRange[0] &&
                  area <= areaRange[1] &&
                  depth >= depthRange[0] &&
                  depth <= depthRange[1]
                );
              })
              .map((entry, index) => {
                const isSelected =
                  !selectedSinkhole || selectedSinkhole.sinkNo === entry.sinkNo;
                return (
                  <Cell
                    key={`scatter-point-${index}`}
                    fillOpacity={isSelected ? 1 : 0.3}
                  />
                );
              })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <RangeSlider
        min={0}
        max={d3.max(sinkholes, d => Number(d.sinkDepth)) || 100}
        value={depthRange}
        onChange={setDepthRange}
        label={`깊이 범위: ${depthRange[0]}m - ${depthRange[1]}m`}
      />
      <RangeSlider
        min={0}
        max={d3.max(sinkholes, d => Number(d.sinkArea)) || 1000}
        value={areaRange}
        onChange={setAreaRange}
        label={`면적 범위: ${areaRange[0]}m² - ${areaRange[1]}m²`}
      />

    </div>
  );
};

export default ChartPanel;
