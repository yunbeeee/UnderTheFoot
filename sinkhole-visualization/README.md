# 데시입 싱크홀 (Sinkhole Visualization Project)

**데시입 싱크홀**은 서울 지역의 싱크홀 데이터를 시각화하여 시민들이 직접 사고 발생 위치 및 관련 통계를 쉽게 확인하고, 경로를 검색하여 사고 이력을 확인할 수 있도록 도와주는 인터랙티브 웹 애플리케이션입니다.

## 🗂 프로젝트 개요

- **목표**: 사용자가 직접 조건(예: 발생 원인, 면적, 깊이, 날짜, 피해 유무 등)을 조절하면서 시각화된 데이터를 통해 인사이트를 얻도록 지원합니다.
- **주요 기능**:
  - 지도 위 싱크홀 사고 위치 핀 시각화
  - 발생 원인 / 월별 / 규모(면적, 깊이) 기반 필터링
  - 강수량 시계열 그래프 제공
  - 경로 탐색 시, 해당 경로 반경 내 싱크홀 사고 여부 확인

## 🛠 기술 스택

- **Frontend**: React, Tailwind CSS, React-Leaflet, D3.js, Recharts
- **지도 라이브러리**: Leaflet, KakaoMap API
- **시각화 라이브러리**: D3.js, Recharts
- **기타 라이브러리**: Turf.js (지도 중심좌표 계산), rc-slider

## 📁 폴더 구조
sinkhole-visualization/
├── public/
│ └── index.html
├── src/
│ ├── components/
│ │ ├── ChartPanel.jsx # 오른쪽 통계 그래프 패널
│ │ ├── SeoulMap.jsx # 중심 지도 영역
│ │ ├── KakaoMap.jsx # 출발지-도착지 경로 탐색
│ │ ├── interactions/ # RangeSlider 등 상호작용 UI
│ ├── data/
│ │ ├── sinkholes.json # 싱크홀 데이터
│ │ ├── seoul_gu_boundary.json # 서울시 자치구 GeoJSON
│ ├── asset/
│ │ └── redpin.png # 지도 핀 이미지
│ ├── App.jsx # 전체 페이지 컴포넌트 구성
│ ├── index.css
│ └── main.jsx
├── tailwind.config.js
├── package.json
└── README.md

## 📊 주요 시각화 구성

- **Bar Chart**: 월별 사고 건수, 발생 원인별 빈도
- **Scatter Plot**: 싱크홀 면적 vs 깊이 (슬라이더 조정 가능)
- **Line Chart**: 날짜별 강수량 (자치구 기준 필터링 지원)
- **지도 연동**: 선택된 조건에 따라 지도 핀 자동 필터링 및 강조

## ⚙️ 실행 방법

1. 프로젝트 클론
   ```bash
   git clone https://github.com/yourusername/sinkhole-visualization.git
   cd sinkhole-visualization```

2. 패키지 설치
```
REACT_APP_KAKAO_REST_API_KEY=여기에_카카오_API_키_입력
npm start
```

3. 🔍 데이터 출처
싱크홀 데이터: 국토교통부, 서울시 공공데이터 포털
기상 정보: 기상청 AWS/ASOS
서울시 행정구 GeoJSON: 서울 열린데이터 광장

4. 📌 기획 포인트
단순한 통계 나열이 아니라, 사용자가 조건을 조절하며 자기주도적 탐색이 가능하도록 구성
복구 여부, 강수 유무, 피해 유무는 단순 체크박스로 구성하여 직관적 UX 제공
"궁금한 것을 찾아보도록" 유도하는 시각화 설계
