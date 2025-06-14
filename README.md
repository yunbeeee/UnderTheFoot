# Under The Foot (서울 싱크홀 시각화 프로젝트)

**Under The Foot**은 서울시 싱크홀 사고 데이터를 지도와 다양한 차트로 시각화하여, 시민과 연구자가 사고 위치, 원인, 규모, 시기, 피해 여부 등을 직관적으로 탐색할 수 있도록 만든 인터랙티브 웹 애플리케이션입니다.

## 🗂 프로젝트 개요

- **목표**: 사용자가 다양한한 조건(발생 원인, 면적, 깊이, 날짜, 피해 유무 등)으로 싱크홀 데이터를 필터링하고, 지도와 차트로 인사이트를 얻을 수 있도록 지원합니다.
- **주요 기능**:
  - 지도 위 싱크홀 사고 위치 핀 시각화
  - 자치구별 위험도 색상 시각화
  - 발생 원인 / 월별 / 규모(면적, 깊이) 기반 필터링
  - 경로 탐색(출발지-도착지) 및 경로 반경 내 사고 이력 확인
  - 강수 유무, 복구 미완료, 피해 유무 등 체크박스 필터터
  - 각 pin별 싱크홀 사고 상세 사항 확인

## 🛠 기술 스택

- **Frontend**: React, Tailwind CSS, D3.js, React-Leaflet
- **지도 라이브러리**: Leaflet, KakaoMap API
- **시각화 라이브러리**: D3.js, Recharts
- **기타 라이브러리**: Turf.js (지도 중심좌표 계산), rc-slider

## 📁 폴더 구조
<pre>
``` 
sinkhole-visualization/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ChartPanel.jsx      # 오른쪽 통계 그래프 패널
│   │   ├── SeoulMap.jsx        # 중심 지도 영역
│   │   ├── KakaoMap.jsx        # 출발지-도착지 경로 탐색
│   │   ├── interactions/
│   │   │   └── RangeSlider.jsx # RangeSlider 등 상호작용 UI
│   │   ├── InfoBox.jsx         # 정보 요약 박스
│   │   └── ...                 # 기타 UI 컴포넌트
│   ├── data/
│   │   ├── sinkholes.json      # 싱크홀 데이터
│   │   └── seoul_gu_boundary.json  # 서울시 자치구 GeoJSON
│   ├── asset/
│   │   └── redpin.png          # 지도 핀 이미지
│   ├── App.jsx                 # 전체 페이지 컴포넌트 구성
│   ├── index.css
│   └── main.jsx
├── tailwind.config.js
├── package.json
└── README.md
```
</pre>

## 📊 주요 시각화 구성

- **지도**: 자치구별 위험도 색상, 사고 위치 핀, 자치구 이름 라벨
- **Bar Chart**: 월별 사고 건수, 발생 원인별 빈도
- **Scatter Plot**: 싱크홀 면적 vs 깊이 (슬라이더 조정 가능)
- **Line Chart**: 날짜별 강수량 (자치구 기준 필터링 지원)
- **상호작용**: 지도-차트 연동, 조건별 실시간 필터링링

## ⚙️ 실행 방법

1. 프로젝트 클론
   ```bash
   git clone https://github.com/Kim-Yiji/UnderTheFoot.git
   cd sinkhole-visualization
   ```

2. 패키지 설치
    ```
    npm install
    ```

3. 환경 변수 설정 (카카오 API 키 필요)

   `.env` 파일 생성 후 아래와 같이 입력:
   ```
   REACT_APP_KAKAO_REST_API_KEY=카카오_API_키_입력
   ```

4. 개발 서버 실행
    ```
    npm start
    ```

## 🔍 데이터 출처

- 싱크홀 데이터: 서울시 공공데이터 포털
- 기상 정보: 기상청 AWS/ASOS
- 서울시 행정구 GeoJSON: 국토교통부부

## 📌 기획 포인트

- 단순한 통계 나열이 아니라, 사용자가 조건을 조절하며 **자기주도적 탐색**이 가능하도록 구성
- 다양한 chart를 사용하여 여러 조건 조절 가능능
- 복구 여부, 강수 유무, 피해 유무는 단순 체크박스로 구성하여 직관적 UX 제공
- "궁금한 것을 찾아보도록" 유도하는 시각화 설계
