import React from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import seoulGeoJson from '../data/seoul_municipalities_geo_simple.json';
import sinkholes from '../sinkholes.json';
import redPinImg from 'C:/Users/USER/Desktop/Lookatme/sinkhole-visualization/src/asset/redpin.png'; // 이미지 경로에 맞게 import
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

// 위험도 예시값
const riskScores = {
  종로구: 0.12, 중구: 0.45, 용산구: 0.81, 성동구: 0.34, 광진구: 0.58,
  동대문구: 0.67, 중랑구: 0.23, 성북구: 0.75, 강북구: 0.19, 도봉구: 0.11,
  노원구: 0.29, 은평구: 0.63, 서대문구: 0.72, 마포구: 0.38, 양천구: 0.26,
  강서구: 0.44, 구로구: 0.53, 금천구: 0.36, 영등포구: 0.69, 동작구: 0.77,
  관악구: 0.55, 서초구: 0.49, 강남구: 0.95, 송파구: 0.41, 강동구: 0.33
};

const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 1]);

const SeoulMap = () => {
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
    <MapContainer center={[37.5665, 126.9780]} zoom={11} style={{ height: "600px", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={seoulGeoJson} style={styleFeature} />
      {sinkholes.map((item, idx) => (
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
  );
};

export default SeoulMap;