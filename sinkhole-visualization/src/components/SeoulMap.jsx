import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import seoulGeoJson from '../data/seoul_municipalities_geo_simple.json';
import sinkholes from '../sinkholes.json';
import redPinImg from '../asset/redpin.png'; // 이미지 경로에 맞게 import
import * as d3 from 'd3';

// 커스텀 빨간 핀 아이콘 정의
const redIcon = new L.Icon({
  iconUrl: redPinImg,
  iconSize: [30, 42],        // 적당히 조절 가능
  iconAnchor: [15, 42],      // 마커의 "끝"이 좌표 중심에 위치하도록
  popupAnchor: [0, -35],     // 팝업 위치 조절
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

// 위험도 예시값
const riskScores = {
  종로구: 0.12, 중구: 0.45, 용산구: 0.81, 성동구: 0.34, 광진구: 0.58,
  동대문구: 0.67, 중랑구: 0.23, 성북구: 0.75, 강북구: 0.19, 도봉구: 0.11,
  노원구: 0.29, 은평구: 0.63, 서대문구: 0.72, 마포구: 0.38, 양천구: 0.26,
  강서구: 0.44, 구로구: 0.53, 금천구: 0.36, 영등포구: 0.69, 동작구: 0.77,
  관악구: 0.55, 서초구: 0.49, 강남구: 0.95, 송파구: 0.41, 강동구: 0.33
};

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);

const SeoulMap = ({ 
  setSelectedSinkhole, selectedSinkhole, selectedCauses, selectedMonths,
  depthRange, areaRange, clickedFromMap, setClickedFromMap,
  showRain, showRepaired, showDamaged
}) => {
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
        details.map(d => d.trim()).includes(cause)
      );
    }

    // 월 조건
    let matchMonth = true;
    if (selectedMonths && selectedMonths.length > 0) {
      const dateStr = item.sagoDate?.toString();
      const month = dateStr && dateStr.length >= 6 ? dateStr.substring(4, 6) : null;
      matchMonth = month && selectedMonths.includes(month);
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

    return withinArea && withinDepth && matchCause && matchMonth && matchRain && matchRepaired && matchDamaged; // 모두 만족해야 마커 표시
  });

  const styleFeature = (feature) => {
    const guName = feature.properties.name;
    const risk = riskScores[guName] ?? 0;
    return {
      fillColor: colorScale(risk),
      weight: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  };

  return (
    <div>
      <h1>🕳️ 싱크홀 발생 현황</h1>
      <MapContainer center={[37.5665, 126.9780]} zoom={11} style={{ height: "560px", marginTop: '1rem' }} >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON data={seoulGeoJson} style={styleFeature} />
        
        {/* 클릭이 지도에서 발생한 경우 선택된 싱크홀만, 아니면 전체 필터된 싱크홀 표시 */}
        {(clickedFromMap && selectedSinkhole
          ? filteredSinkholes
          : filteredSinkholes
        ).map((item, idx) => (
          <Marker
            key={idx}
            position={[item.sagoLat, item.sagoLon]}
            icon={
              clickedFromMap && selectedSinkhole && item.sagoNo !== selectedSinkhole.sagoNo
                ? fadedBlueIcon
                : redIcon
            }
            opacity={
              clickedFromMap && selectedSinkhole
                ? item.sagoNo === selectedSinkhole.sagoNo ? 1 : 0.4
                : 1
            }
            eventHandlers={{
              click: () => {
                console.log('[SeoulMap] Marker clicked - clickedFromMap set to true');
                setClickedFromMap(true);
                setSelectedSinkhole(item);
                console.log('[SeoulMap] selectedSinkhole set to:', item);
              }
            }}
          />
        ))}
      </MapContainer>
      <style>{`
        .leaflet-marker-icon.faded-blue-marker {
          filter: hue-rotate(180deg) saturate(50%) brightness(1.2) opacity(0.7);
        }
      `}</style>
        {/* {filteredSinkholes.map((item, idx) => (
        <Marker
          key={idx}
          position={[item.sagoLat, item.sagoLon]}
          icon={redIcon}
          eventHandlers={{
            click: () => setSelectedSinkhole(item)
          }}
        >
        </Marker>
      ))}
      </MapContainer> */}
    </div>
  );
};

export default SeoulMap;