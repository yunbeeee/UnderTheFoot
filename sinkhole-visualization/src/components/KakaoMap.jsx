import React, { useState, useEffect } from 'react';
import './KakaoMap.css';
import sinkholes from '../sinkholes.json'; // 싱크홀 데이터
import { filter } from 'd3';

const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY; // Kakao REST API Key

const KakaoMap = () => {
  const [map, setMap] = useState(null);
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startResults, setStartResults] = useState([]);
  const [endResults, setEndResults] = useState([]);
  const [startCoord, setStartCoord] = useState(null);
  const [endCoord, setEndCoord] = useState(null);
  const [polyline, setPolyline] = useState(null);

  // SDK load 완료 여부 확인
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 출발지, 도착지 마커 상태
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);

  // 싱크홀 마커 상태 (marker + polygon 통합)
  const [sinkholeObjects, setSinkholeObjects] = useState([]);

  // 반경 상태 추가
  const [radiusRange, setRadiusRange] = useState(100); // 초기 반경 100m

  useEffect(() => {
    const JS_KEY = process.env.REACT_APP_KAKAO_JAVASCRIPT_KEY
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = document.getElementById('map');
          const options = {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780),
            level: 5,
          };
          const kakaoMap = new window.kakao.maps.Map(container, options);
          setMap(kakaoMap);
          setIsMapLoaded(true); // ✅ SDK 로드 완료
        });
      } else {
        console.error('Kakao Maps SDK 로드 실패');
      }
    };

  }, []);

  const searchKeyword = async (query, setter) => {
    if (!query || !isMapLoaded) return;

    const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `KakaoAK ${REST_API_KEY}`
      }
    });
    const data = await res.json();
    setter(data.documents);
  };

  const handleSelect = (place, type) => {
    const coord = {
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
    };

    if (!map) return;

    const latlng = new window.kakao.maps.LatLng(coord.lat, coord.lng);

    if (type === 'start') {
      setStartQuery(place.place_name);
      setStartCoord(coord);
      setStartResults([]);

      if (startMarker) startMarker.setMap(null); // 이전 마커 제거

      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map,
      });
      setStartMarker(marker);

    } else {
      setEndQuery(place.place_name);
      setEndCoord(coord);
      setEndResults([]);

      if (endMarker) endMarker.setMap(null); // 이전 마커 제거

      const marker = new window.kakao.maps.Marker({
        position: latlng,
        map,
      });
      setEndMarker(marker);
    }

    map.setCenter(latlng);
  };

  const getCarDirection = async () => {
    if (!startCoord || !endCoord) return;

    const url = 'https://apis-navi.kakaomobility.com/v1/directions';
    const origin = `${startCoord.lng},${startCoord.lat}`;
    const destination = `${endCoord.lng},${endCoord.lat}`;

    const headers = {
      Authorization: `KakaoAK ${REST_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const queryParams = new URLSearchParams({ 
      origin, 
      destination,
      priority: 'DISTANCE'
    });

    const response = await fetch(`${url}?${queryParams}`, { headers });
    const data = await response.json();

    const linePath = [];
    const roads = data.routes[0].sections[0].roads;

    roads.forEach((road) => {
      const vertexes = road.vertexes;
      for (let i = 0; i < vertexes.length; i += 2) {
        const lng = vertexes[i];
        const lat = vertexes[i + 1];
        linePath.push(new window.kakao.maps.LatLng(lat, lng));
      }
    });

    if (polyline) polyline.setMap(null); // 이전 경로 제거
    // 이전 경로에 대한 싱크홀 마커 초기화화
    if (sinkholeObjects) {
      sinkholeObjects.forEach(({ marker, donut }) => {
        marker.setMap(null);
        donut.setMap(null);
      });
      setSinkholeObjects([]);
    }


    const newPolyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#ff0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
    });

    newPolyline.setMap(map);
    setPolyline(newPolyline);

    // 경로상의 위경도 리스트 추출 (console)
    const latLngList = linePath.map(latlng => ({
      lat: latlng.getLat(),
      lng: latlng.getLng()
    }));
    console.log("📍위경도 리스트:", latLngList);

    // 경로 지점과 싱크홀 거리 계산 함수 (Haversine)
    const getDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371000;
      const toRad = deg => deg * Math.PI / 180;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // 경로의 위경도 리스트를 기준으로 반경 내 싱크홀 필터링
    const filterSinkholesNearRoute = (latLngList, radius) => {
      return sinkholes.filter(item => {
        const lat = parseFloat(item.sagoLat); // 싱크홀 위도
        const lon = parseFloat(item.sagoLon); // 싱크홀 경도
        // 반경 m 내에 있는 싱크홀 필터링링
        return latLngList.some(({ lat: rLat, lng: rLng }) => getDistance(lat, lon, rLat, rLng) <= radius);
      });
    };

    
    // 중심 좌표 기준 반지름 m 단위 원형 좌표 생성성
    const generateCirclePath = (center, radius, points = 60) => {
      const path = [];
      const degToRad = Math.PI / 180;
      const lat = center.getLat();
      const lng = center.getLng();
    
      for (let i = 0; i <= points; i++) {
        const angle = (i * 360) / points;
        const dx = radius * Math.cos(angle * degToRad);
        const dy = radius * Math.sin(angle * degToRad);
        const newLat = lat + (dy / 111320);  // 위도 1도 ≈ 111.32km
        const newLng = lng + (dx / (111320 * Math.cos(lat * degToRad)));
        path.push(new window.kakao.maps.LatLng(newLat, newLng));
      }
    
      return path;
    };

    // 싱크홀 필터링 및 마커 표시
    const nearSinkholes = filterSinkholesNearRoute(latLngList, radiusRange); // 근처 싱크홀 리스트
    const newSinkholeObjects = nearSinkholes.map((item) => {
      const marker = new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(item.sagoLat, item.sagoLon),
        image: new window.kakao.maps.MarkerImage(
          'sinksign.png', //
          new window.kakao.maps.Size(30, 30)
        )
      });

      // 싱크홀 정보 표시
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="
            padding: 8px;
            font-size: 12px;
            line-height: 1.5;
            width: 160px;
            white-space: normal;
          ">
            📍 <strong>${item.addr}</strong><br/>
            📅 ${item.sagoDate}
          </div>
        `
      });
      

      // 마우스 이벤트 등록
      window.kakao.maps.event.addListener(marker, 'mouseover', () => {
        infoWindow.open(map, marker);
      });

      window.kakao.maps.event.addListener(marker, 'mouseout', () => {
        infoWindow.close();
      });

      // 싱크홀 중심 좌표
      const center = new window.kakao.maps.LatLng(item.sagoLat, item.sagoLon);

      // 바깥 원, 안쪽 원 생성 -> 도넛 모양양
      const outerPath = generateCirclePath(center, radiusRange); // 반경 슬라이더 반영
      const innerHole = generateCirclePath(center, 30);

      // 도넛형 폴리곤 생성
      const donut = new window.kakao.maps.Polygon({
        map: map,
        path: [outerPath],        // 외곽 경로
        holes: [innerHole],       // 구멍
        strokeWeight: 1,
        strokeColor: '#d06d1d',
        strokeOpacity: 0.6,
        strokeStyle: 'solid',
        fillColor: '#d06d1d',
        fillOpacity: 0.4
      });

      return {marker, donut};
    });

    // 마커 업데이트
    setSinkholeObjects(newSinkholeObjects);

    const bounds = new window.kakao.maps.LatLngBounds();
    bounds.extend(new window.kakao.maps.LatLng(startCoord.lat, startCoord.lng));
    bounds.extend(new window.kakao.maps.LatLng(endCoord.lat, endCoord.lng));
    linePath.forEach((latlng) => bounds.extend(latlng));
    map.setBounds(bounds);
  };



  return (
    <div>
      <h2>🚗 출발지/도착지 경로 검색</h2>

      <div id="map" style={{ height: '560px', marginTop: '1rem', marginBottom: '1rem'}} />

      <div className="flex items-center">
        <label className="w-20 font-medium text-gray-700 pb-[11px]">출발지:</label>
        <input
          type="text"
          placeholder="출발지를 입력하세요"
          className="input-box"
          value={startQuery}
          onChange={(e) => {
            setStartQuery(e.target.value);
            searchKeyword(e.target.value, setStartResults);
          }}
        />
      </div> 
        {startResults.length > 0 && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '0.5rem',
            backgroundColor: '#fff'
          }}>
            {startResults.slice(0, 5).map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelect(place, 'start')}
                style={{
                  cursor: 'pointer',
                  padding: '6px 0',
                  borderBottom: '1px solid #eee'
                }}
              >
                <strong>{place.place_name}</strong><br />
                <small>{place.road_address_name || place.address_name}</small>
              </div>
            ))}
          </div>
        )}
     

      <div className="flex items-center">
        <label className="w-20 font-medium text-gray-700 pb-[11px]">도착지:</label>
        <input
          type="text"
          placeholder="도착지를 입력하세요"
          className="input-box"
          value={endQuery}
          onChange={(e) => {
            setEndQuery(e.target.value);
            searchKeyword(e.target.value, setEndResults);
          }}
        />
      </div>
        {endResults.length > 0 && (
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '0.5rem',
            backgroundColor: '#fff'
          }}>
            {endResults.slice(0, 5).map((place) => (
              <div
                key={place.id}
                onClick={() => handleSelect(place, 'end')}
                style={{
                  cursor: 'pointer',
                  padding: '6px 0',
                  borderBottom: '1px solid #eee'
                }}
              >
                <strong>{place.place_name}</strong><br />
                <small>{place.road_address_name || place.address_name}</small>
              </div>
            ))}
          </div>
        )}
      
      <div style={{ margin: '1rem 0' }}>
        <label className="font-medium text-gray-700">
          경로 반경 (m):
          <span style={{ fontWeight: 'bold', color: '#2563eb', marginLeft: '0.5rem' }}>
            {radiusRange}m
          </span>
        </label>

        <input
          type="range"
          min={50}
          max={300}
          step={50}
          value={radiusRange}
          onChange={(e) => setRadiusRange(Number(e.target.value))}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            accentColor: '#2563eb',
            cursor: 'pointer'
          }}
        />
      </div>

      <button onClick={getCarDirection} disabled={!startCoord || !endCoord} className="search-button"> 
        최적 경로 보기
      </button>

      

      
    </div>
  );
};

export default KakaoMap;