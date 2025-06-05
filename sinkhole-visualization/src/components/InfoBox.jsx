export default function InfoBox() {
  return (
    <div className="mt-4 p-4 bg-red-50 rounded shadow text-sm">
      <p><strong>주소:</strong> 서울특별시 서대문구 연세로 50</p>
      <p><strong>날씨:</strong> 폭우</p>
      <p><strong>시기:</strong> 2021년 3월 5일</p>
      <p><strong>깊이:</strong> 50m</p>
      <p><strong>높이:</strong> 10m</p>
      <p><strong>피해정도:</strong> (데이터에 따라 동적으로 삽입)</p>
    </div>
  );
}
