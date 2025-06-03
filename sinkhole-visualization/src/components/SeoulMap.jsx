import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import seoulGeoJson from '../data/seoul_municipalities_geo_simple.json';
import * as d3 from 'd3';


  // 위험도 예시값 (실제 데이터에 맞게 수정)
  const riskScores = {
  종로구: 0.12,
  중구: 0.45,
  용산구: 0.81,
  성동구: 0.34,
  광진구: 0.58,
  동대문구: 0.67,
  중랑구: 0.23,
  성북구: 0.75,
  강북구: 0.19,
  도봉구: 0.11,
  노원구: 0.29,
  은평구: 0.63,
  서대문구: 0.72,
  마포구: 0.38,
  양천구: 0.26,
  강서구: 0.44,
  구로구: 0.53,
  금천구: 0.36,
  영등포구: 0.69,
  동작구: 0.77,
  관악구: 0.55,
  서초구: 0.49,
  강남구: 0.95,
  송파구: 0.41,
  강동구: 0.33
  };

  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, 1]); // 위험도 0~1

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
    <MapContainer center={[37.5665, 126.9780]} zoom={10} style={{ height: "500px", width: "50%" }} maxBounds={[[37.3, 126.4], [37.8, 127.3]]}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON data={seoulGeoJson} style={styleFeature} />
    </MapContainer>
  );
};

export default SeoulMap;
