import pandas as pd

# 파일 불러오기
df = pd.read_csv("C:/Users/USER/Desktop/weather/weather.csv", encoding='utf-8-sig')

# 지점 코드와 시군구 이름 매핑
station_to_sigungu = {
    400: "강남구", 401: "서초구", 402: "강동구", 403: "송파구", 404: "강서구", 405: "양천구",
    406: "도봉구", 407: "노원구", 408: "동대문구", 409: "중랑구", 410: "기상청", 411: "마포구",
    412: "서대문구", 413: "광진구", 414: "성북구", 415: "용산구", 416: "은평구", 417: "금천구",
    418: "한강", 419: "중구", 421: "성동구", 422: "북악산", 423: "구로구", 424: "강북구",
    425: "남현구", 509: "관악구", 510: "영등포구", 889: "현충원"
}

# '지점' 컬럼을 기준으로 'sigungu' 컬럼 추가
df["sigungu"] = df["지점"].map(station_to_sigungu)

# 저장 (선택 사항)
df.to_csv("C:/Users/USER/Desktop/weather/weather_with_sigungu.csv", index=False, encoding='utf-8-sig')