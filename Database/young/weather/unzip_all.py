import zipfile
import os
from pathlib import Path

# region 번호 리스트
region_nums = [
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409,
    410, 411, 412, 413, 414, 415, 416, 417, 418, 419,
    421, 423, 424, 425, 509, 510, 889
]

# zip 파일들이 있는 폴더와 저장할 경로
zip_base_path = Path("C:/Users/USER/Desktop/2024")
output_base_path = Path("C:/Users/USER/Desktop/weather")
output_base_path.mkdir(parents=True, exist_ok=True)

# zip 파일 반복
for region in region_nums:
    zip_filename = f"SURFACE_AWS_{region}_DAY_2024_2024_2025.zip"
    zip_path = zip_base_path / zip_filename

    if not zip_path.exists():
        print(f"🚫 파일 없음: {zip_path}")
        continue

    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        extract_path = output_base_path / f"{region}"
        extract_path.mkdir(exist_ok=True)
        zip_ref.extractall(extract_path)
        print(f"✅ 압축 해제 완료: {zip_filename}")