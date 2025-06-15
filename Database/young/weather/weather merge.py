import pandas as pd
from pathlib import Path

# 병합할 연도 리스트
years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]

# 기본 경로
base_path = Path("C:/Users/USER/Desktop/weather/")

df_list = []
for year in years:
    file_path = base_path / f"weather {year}.csv"
    try:
        df = pd.read_csv(file_path, encoding='utf-8-sig')  # 이전 저장과 동일한 인코딩
        df_list.append(df)
        print(f"✅ {year}년 데이터 불러오기 완료: {len(df):,}행")
    except Exception as e:
        print(f"❌ {year}년 파일 읽기 실패: {e}")

# 병합 및 저장
if df_list:
    merged_df = pd.concat(df_list, ignore_index=True)
    output_path = base_path / "weather.csv"
    merged_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n✅ 최종 병합 완료: 총 {len(merged_df):,}행 → {output_path}")
else:
    print("🚨 병합할 파일이 없습니다. 파일 경로 또는 이름을 다시 확인하세요.")