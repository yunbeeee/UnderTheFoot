import React, { useState, useEffect } from 'react';
import './KakaoMap.css';

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

  // ✅ 마커 상태 추가
  const [startMarker, setStartMarker] = useState(null);
  const [endMarker, setEndMarker] = useState(null);

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

    const queryParams = new URLSearchParams({ origin, destination });

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

    const newPolyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 5,
      strokeColor: '#ff0000',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
    });

    newPolyline.setMap(map);
    setPolyline(newPolyline);
  };

  return (
    <div>
      <h2>🚗 출발지/도착지 경로 검색</h2>

      <div id="map" style={{ height: '560px', marginTop: '1rem', marginBottom: '1rem' }} />

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
      

      <button onClick={getCarDirection} disabled={!startCoord || !endCoord} className="search-button"> 
        최적 경로 보기
      </button>

      

      
    </div>
  );
};

export default KakaoMap;