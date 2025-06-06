import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, useMap } from 'react-leaflet';
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
  iconSize: [30, 42],        // 적당히 조절 가능
  iconAnchor: [15, 42],      // 마커의 "끝"이 좌표 중심에 위치하도록
  popupAnchor: [0, -35],     // 팝업 위치 조절
  shadowUrl: null,
  shadowSize: null,
  shadowAnchor: null,
  className: ''
});

const MapControlButtons = ({ onReset, onShowAll }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.control({ position: 'topright' });

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
const [selectedGu, setSelectedGu] = useState(null);
const mapRef = useRef(); // leaflet Map 인스턴스 접근용
const SeoulMap = ({ 
  setSelectedSinkhole, selectedCauses, selectedMonths,
  depthRange, areaRange 
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


    return withinArea && withinDepth && matchCause && matchMonth; // 모두 만족해야 마커 표시
  });

  const [selectedGu, setSelectedGu] = useState(null);
  const mapRef = useRef(); // leaflet Map 인스턴스 접근용
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
        const bounds = layer.getBounds();
        // const center = bounds.getCenter();
        setSelectedGu(feature.properties.SGG_NM.replace('서울특별시 ', '').trim());
       
        console.log('mapRef:', mapRef.current);  // 클릭 이벤트 안에서

        mapRef.current?.fitBounds(bounds, { padding: [15, 15] });

      }
    });
  };

  return (
    <div>
      <h1>🕳️ 싱크홀 발생 현황</h1>

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

            return (
              <Marker
                key={`label-${idx}`}
                // position={center}
                position={[center[1], center[0]]}
                icon={L.divIcon({
                  className: 'gu-label',
                  html: `<div>${guName}</div>`,
                  iconSize: [80, 24],
                  iconAnchor: [20, 5],
                })}
                interactive={false}
                eventHandlers={{
                  click: () => setSelectedSinkhole(item)
                }}
              />
            );
          })}

        {sinkholes
          .filter(item => {
            if (!selectedGu) return false; // 아무것도 선택 안한 상태
            if (selectedGu === 'ALL') return true;
            const guName = item.sigungu?.replace('서울특별시 ', '');
            return guName === selectedGu;
          })
          .map((item, idx) => {
            const guName = item.sigungu?.replace('서울특별시 ', '');
            const isSelected = selectedGu === 'ALL' || guName === selectedGu;

          return (
            <Marker
              key={idx}
              position={[item.sagoLat, item.sagoLon]}
              icon={L.divIcon({
                html: `<img src="${redPinImg}" style="width: 30px; opacity: ${isSelected ? 1 : 0.3}" />`,
                className: '',
                iconSize: [30, 42],
                iconAnchor: [15, 42],
              })}
            ></Marker>
          );
        })}
        <MapControlButtons
          onReset={() => {
            setSelectedGu(null);
            mapRef.current?.setView([37.5665, 126.9780], 11);
          }}
          onShowAll={() => {
            setSelectedGu('ALL');
            mapRef.current?.setView([37.5665, 126.9780], 11);
          }}
        />
      </MapContainer>
    </div>
  );
};

export default SeoulMap;