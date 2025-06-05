import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import seoulGeoJson from '../data/seoul_gu_boundary.json'
import sinkholes from '../sinkholes.json';
import redPinImg from '../asset/redpin.png'; // 이미지 경로에 맞게 import
import * as d3 from 'd3';
// import centroid from '@turf/centroid';

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

  const styleFeature = (feature) => {
    const fullName = feature.properties.SGG_NM;
    const guName = fullName.replace('서울특별시 ', '').trim();
    const risk = riskScores[guName];
    console.log('guName:', guName, 'risk:', riskScores[guName]);
    return {
      fillColor: risk !== undefined ? colorScale(risk) : '#ccc',
      weight: 1,
      color: 'white',
      fillOpacity: 0.7,
    };
  };

  const handleFeatureClick = (feature, layer) => {
    layer.on({
      click: () => {
        const bounds = layer.getBounds();
        // const center = bounds.getCenter();
        setSelectedGu(feature.properties.SGG_NM.replace('서울특별시 ', '').trim());
       
        console.log('mapRef:', mapRef.current);  // 클릭 이벤트 안에서

        mapRef.current?.fitBounds(bounds, { padding: [20, 20] });

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
        whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

          <GeoJSON
          data={seoulGeoJson}
          style={styleFeature}
          onEachFeature={handleFeatureClick}
          />
          {/* 자치구 이름 텍스트 표시 */}
          {seoulGeoJson.features.map((feature, idx) => {
            const bounds = L.geoJSON(feature).getBounds();
            const center = bounds.getCenter();      
            // const center = centroid(feature).geometry.coordinates;
            const guName = feature.properties.SGG_NM.replace('서울특별시 ', '');

            return (
              <Marker
                key={`label-${idx}`}
                position={center}
                icon={L.divIcon({
                  className: 'gu-label',
                  html: `<div>${guName}</div>`,
                  iconSize: [80, 20],
                  iconAnchor: [40, 10],
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
            if (!selectedGu) return false;
            const guName = item.sigungu?.replace('서울특별시 ', '');
            return !selectedGu || guName === selectedGu;
          })
          .map((item, idx) => (
            <Marker
              key={idx}
              position={[item.sagoLat, item.sagoLon]}
              icon={redIcon}
            >
              <Popup>
                <div>
                  <b>{item.addr}</b><br />
                  날짜: {item.sagoDate}<br />
                  규모: {item.sinkWidth} x {item.sinkExtend} x {item.sinkDepth} m
                </div>
              </Popup>
            </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default SeoulMap;