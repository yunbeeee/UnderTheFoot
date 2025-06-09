import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, setISODay } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import seoulGeoJson from '../data/seoul_gu_boundary.json'
import sinkholes from '../sinkholes.json';
import redPinImg from '../asset/redpin.png'; // 이미지 경로에 맞게 import
import * as d3 from 'd3';
import centroid from '@turf/centroid';
// import { point } from '@turf/helpers';

// 커스텀 빨간 핀 아이콘 정의
const redIcon = new L.Icon({
  iconUrl: redPinImg,
  iconSize: [30, 30],        // 적당히 조절 가능
  iconAnchor: [15, 30],      // 마커의 "끝"이 좌표 중심에 위치하도록
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  className: ''
});

// 커스텀 페이드 블루 아이콘 정의 (faded-blue-marker 스타일 적용)
const fadedBlueIcon = new L.Icon({
  iconUrl: redPinImg,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -35],
  className: 'faded-blue-marker'
});

const MapControlButtons = ({ onReset, onShowAll }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'topleft' });

    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      container.style.display = 'flex';
      container.style.flexDirection = 'row';
      container.style.gap = '4px';

      const resetBtn = L.DomUtil.create('button', '', container);
      resetBtn.innerHTML = '🧭 초기화';
      resetBtn.style.padding = '6px';
      resetBtn.style.background = 'white';
      resetBtn.onclick = () => onReset();

      const allBtn = L.DomUtil.create('button', '', container);
      allBtn.innerHTML = '🔍 전체 핀';
      allBtn.style.padding = '6px';
      allBtn.style.background = 'white';
      allBtn.onclick = () => onShowAll();

      return container;
    };

    control.addTo(map);
    return () => control.remove();
  }, [map, onReset, onShowAll]);

  return null;
};

function calculateRiskScores(data) {
  const countByDistrict = {};

  // 1. 각 자치구별로 발생 건수 세기
  data.forEach((entry) => {
    const district = entry.sigungu;
    if (!district) return; // null 값 제외
    countByDistrict[district] = (countByDistrict[district] || 0) + 1;
  });

  // 2. 건수 기준으로 정규화 (0 ~ 1)
  const values = Object.values(countByDistrict);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const normalizedScores = {};
  Object.entries(countByDistrict).forEach(([district, count]) => {
    // min == max인 경우 모두 1로 처리 (예외 방지)
    const score = (max === min) ? 1 : (count - min) / (max - min);
    normalizedScores[district] = parseFloat(score.toFixed(2));
  });

  return normalizedScores;
}

// 사용 예시
const riskScores = calculateRiskScores(sinkholes);

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);

const SeoulMap = ({
  selectedSinkhole,
  selectedGu, setSelectedGu, mapRef,
  setSelectedSinkhole,
  setSelectedCauses, selectedCauses,
  setSelectedMonths, selectedMonths,
  depthRange, areaRange,
  dateRange, setDateRange,
  isReset, setIsReset,
  clickedFromMap, setClickedFromMap,
  showRain, showRepaired, showDamaged,
  setShowRain, setShowRepaired, setShowDamaged
}) => {
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const isChartPanelActive = selectedCauses.length > 0 || selectedMonths.length > 0 || (startDate && endDate);
    
    if (selectedGu === null && isChartPanelActive) {
      mapRef.current?.setView([37.5665, 126.9780], 11); // 서울 전체 보기
    }
  }, [selectedGu, selectedCauses, selectedMonths, startDate, endDate]);

  // 해당 원인을 포함하는 싱크홀만 필터링
  const filteredSinkholes = sinkholes.filter(item => {

    // 깊이 조건
    let depth = item.sinkDepth;

    // 공백 또는 비정상적 값 처리
    if (typeof depth === 'string') {
      depth = depth.trim();
    }
    if (depth === '' || depth === null || depth === undefined) {
      return false;
    }

    const parsedDepth = parseFloat(depth);
    const withinDepth = !isNaN(parsedDepth) &&
      parsedDepth >= depthRange[0] &&
      parsedDepth <= depthRange[1];

    // 면적 조건
    let area = item.sinkArea;

    // 공백 또는 비정상적 값 처리
    if (typeof area === 'string') {
      area = area.trim();
    }
    if (area === '' || area === null || area === undefined) {
      return false;
    }

    const parsedArea = parseFloat(area);
    const withinArea = !isNaN(parsedArea) &&
      parsedArea >= areaRange[0] &&
      parsedArea <= areaRange[1];



    // 원인 조건
    let matchCause = true;
    if (selectedCauses && selectedCauses.length > 0) {
      let details = item.sagoDetailProcessed;
      try {
        if (typeof details === 'string') {
          details = JSON.parse(details.replace(/'/g, '"'));
        }
      } catch {
        details = [details];
      }
      if (!Array.isArray(details)) {
        details = [details];
      }

      matchCause = selectedCauses.every(cause =>
        details
          .filter(d => typeof d === 'string')
          .map(d => d.trim())
          .includes(cause)
      );
    }

    // 월 조건
    let matchMonth = true;
    if (selectedMonths && selectedMonths.length > 0) {
      const dateStr = item.sagoDate?.toString();
      const month = dateStr && dateStr.length >= 6 ? dateStr.substring(4, 6) : null;
      matchMonth = month && selectedMonths.includes(month);
    }
    
    // 날짜 picker
    let matchDate = true;
    if (startDate && endDate) {
      const sagoStr = item.sagoDate?.toString();
      const dateFormatted =
        sagoStr && sagoStr.length === 8
          ? new Date(`${sagoStr.slice(0, 4)}-${sagoStr.slice(4, 6)}-${sagoStr.slice(6, 8)}`)
          : null;

      matchDate =
        dateFormatted &&
        dateFormatted >= startDate &&
        dateFormatted <= endDate;
    }
    // 강수량 필터 (있음 only)
    let matchRain = true;
    if (showRain) {
      const rainRaw = item.rainfall;
      matchRain = !(rainRaw === '0.0' || rainRaw === 0 || rainRaw === 0.0 || rainRaw === undefined || rainRaw === null);
      // console.log('[SeoulMap Filter] Local Rain value:', rainRaw, '=>', matchRain);
    }

    // 복구 여부 필터 (복구 미완)
    let matchRepaired = true;
    if (showRepaired) {
      const status = (item.trStatus || '').trim();
      matchRepaired = !status.includes('복구완료');
      // console.log('[SeoulMap Filter] Repaired:', status, '=>', matchRepaired);
    }

    // 피해 여부 필터 (피해 있음 only)
    let matchDamaged = true;
    if (showDamaged) {
      const totalDamage = (parseInt(item.deathCnt) || 0) +
                          (parseInt(item.injuryCnt) || 0) +
                          (parseInt(item.vehicleCnt) || 0);
      matchDamaged = totalDamage > 0;
      // console.log('[SeoulMap Filter] Damage total:'ㄴ, totalDamage, '=>', matchDamaged);
    }
    return withinArea && withinDepth && matchCause && matchMonth && matchDate && matchRain && matchRepaired && matchDamaged; // 모두 만족해야 마커 표시
  });

  const styleFeature = (feature) => {
    const fullName = feature.properties.SGG_NM;
    const guName = fullName.replace('서울특별시 ', '').trim();
    const risk = riskScores[guName];
    const isSelected = selectedGu === guName;

    // 현재 선택된 구인지 확인
    // console.log('guName:', guName, 'risk:', riskScores[guName]);
    return {
      fillColor: risk !== undefined ? colorScale(risk) : '#ccc',
      weight: isSelected ? 4 : 2.0,
      color: isSelected ? '#000' : '#888',
      fillOpacity: selectedGu
        ? isSelected ? 0.7 : 0.4 // ✅ 선택된 구만 강조
        : 0.9
    };
  };
  
  const handleFeatureClick = (feature, layer) => {
    layer.on({
      click: () => {
        setIsReset(false);
        const bounds = layer.getBounds();
        // const center = bounds.getCenter();
        setSelectedGu(feature.properties.SGG_NM.replace('서울특별시 ', '').trim());
       
        console.log('mapRef:', mapRef.current);  // 클릭 이벤트 안에서

        mapRef.current?.fitBounds(bounds, { padding: [15, 15] });

      }
    });
  };
  const MIN_DATE = new Date('2018-01-01');
  const MAX_DATE = new Date('2025-12-31');
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1>🕳️ 싱크홀 발생 현황</h1>

        {/* 날짜 선택 영역 – 지도 상단 흰 공간 */}
        <div className="relative z-[1000] flex gap-1 items-center p-* bg-white rounded shadow" style={{ width: 'fit-content' }}>
          <label className="h-8 px-2 py-1 text-sm">시작일:</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => {
              setDateRange([date, endDate]);
              setIsReset(false); // ✅ 이게 핵심!
            }}
            dateFormat="yyyy-MM-dd"
            minDate={MIN_DATE}
            maxDate={MAX_DATE}
            placeholderText="시작일 선택"
            className="p-1 border rounded text-sm"
            popperClassName="datepicker-popper"
            popperPlacement="bottom-start"
            
          />
          <label className="-8 px-2 py-1 text-sm">종료일:</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => {
              setDateRange([startDate, date]);
              setIsReset(false); // ✅ 이것도!
            }}
            dateFormat="yyyy-MM-dd"
            minDate={startDate}
            maxDate={MAX_DATE}
            placeholderText="종료일 선택"
            className="p-1 border rounded text-sm"
            popperClassName="datepicker-popper"
            popperPlacement="bottom-start"
          />
        </div>
      </div>

      <MapContainer
        center={[37.5665, 126.9780]}
        zoom={11}
        style={{ height: "560px", marginTop: '1rem' }}
        ref={mapRef} // MapContainer에 ref 추가
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          key={selectedGu || 'all'}
          data={seoulGeoJson}
          style={styleFeature}
          onEachFeature={handleFeatureClick}
        />
        {/* 자치구 이름 텍스트 표시 */}
        {seoulGeoJson.features.map((feature, idx) => {
          const bounds = L.geoJSON(feature).getBounds();
          // const center = bounds.getCenter();      
          const center = centroid(feature).geometry.coordinates;
          const guName = feature.properties.SGG_NM.replace('서울특별시 ', '');


          const guOffsets = {
            '종로구': [0, -0.2],
            '중구': [9, 3],
            '용산구': [5, -8],
            '성동구': [5, -5],
            '광진구': [8, -7],
            '동대문구': [-1, -0.1],
            '중랑구': [8, -1],
            '성북구': [-3, -2],
            '강북구': [0.05, 0.1],
            '도봉구': [0.02, 8],
            '노원구': [6, 9],
            '은평구': [10, 5],
            '서대문구': [-3, -0.06],
            '마포구': [-15, 1],
            '양천구': [-3, -2],
            '강서구': [20, 3],
            '구로구': [-10, 3],
            '금천구': [4, 0],
            '영등포구': [7, 6],
            '동작구': [9, 8],
            '관악구': [9, -3],
            '서초구': [0.1, 5],
            '강남구': [-12, 10],
            '송파구': [-10, 9],
            '강동구': [-17, 0.06],
          };          

          const offset = guOffsets[guName] || [0, 0];
          const adjustedPosition = [
            center[1] + offset[1] * 0.001,
            center[0] + offset[0] * 0.001
          ];

          return (
            <Marker
              key={`label-${idx}`}
              // position={center}
              position={adjustedPosition}
              icon={L.divIcon({
                className: 'gu-label',
                html: `<div>${guName}</div>`,
                iconSize: [80, 24],
                iconAnchor: [20, 5],
              })}
              interactive={false}

            />
          );
        })}

        {sinkholes.map((item, idx) => {
          const guName = item.sigungu?.replace('서울특별시 ', '');
          const isInSelectedGu = selectedGu && guName === selectedGu;
          const isInFilteredList = filteredSinkholes.some(f => f.sagoNo === item.sagoNo);

          const isSelected = selectedSinkhole?.sagoNo === item.sagoNo;

          const hasFilters =
            selectedCauses.length > 0 ||
            selectedMonths.length > 0 ||
            (startDate && endDate) ||
            showRain || showRepaired || showDamaged ||
            depthRange[0] > 0 || depthRange[1] < Infinity ||
            areaRange[0] > 0 || areaRange[1] < Infinity;
          
          const shouldShow =
            selectedSinkhole
              ? isSelected
              : (
                !isReset &&
                (
                  hasFilters
                    ? (isInFilteredList && (!selectedGu || isInSelectedGu || selectedGu === 'ALL')) // 필터 + 자치구 일치
                    : (
                        selectedGu === 'ALL' ||
                        (!selectedGu && true) || // 자치구 선택 안 된 경우 전체
                        (selectedGu && isInSelectedGu) // 자치구 선택된 경우
                      )
                )
              );

          const isHighlighted =
            selectedGu === 'ALL' ||
            (selectedGu === null && isInFilteredList) ||
            isInSelectedGu;
            
          if (!shouldShow) return null;
            
          return (

            <Marker
              key={idx}
              position={[item.sagoLat, item.sagoLon]}
              icon={L.icon({
                ...redIcon.options, // redIcon의 설정 재사용
                className: isHighlighted ? '' : 'dimmed-pin' // ✅ 강조되지 않은 핀만 흐리게
              })}
              eventHandlers={{
                click: () => {
                  setSelectedSinkhole(prev =>
                    prev && prev.sagoNo === item.sagoNo ? null : item
                  );
                }
              }}
            />
          );
        })}
        <MapControlButtons
          onReset={() => {
            setSelectedSinkhole(null);
            setSelectedGu(null);
            setSelectedCauses([]);
            setSelectedMonths([]);
            setDateRange([null, null]);

            // 체크박스도 초기화
            setShowDamaged(false);
            setShowRepaired(false);
            setShowRain(false);
            
            setIsReset(true);
            mapRef.current?.setView([37.5665, 126.9780], 11);
          }}
          onShowAll={() => {
            setSelectedGu('ALL');
            setIsReset(false);
            mapRef.current?.setView([37.5665, 126.9780], 11);
          }}
        />
      </MapContainer>
    </div>
  );
};

export default SeoulMap;