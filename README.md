# CSV 데이터 스마트 차트 분석 스튜디오 PRO (CSV Chart Visualizer)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/bslee1129/kcs_csv)

CSV 파일을 드래그 앤 드롭하여 간편하게 데이터 통계를 확인하고, 다양한 차트(막대, 가로바, 스플라인 꺾은선, 도넛, 파이, 폴라, 레이더)와 다각도 4분할 대시보드로 즉시 시각화 및 분석할 수 있는 웹 애플리케이션입니다.

## 🔗 실시간 라이브 데모
- **GitHub Pages**: [https://bslee1129.github.io/kcs_csv/](https://bslee1129.github.io/kcs_csv/)
- **Netlify One-Click Deploy**: [Netlify로 1초 배포하기](https://app.netlify.com/start/deploy?repository=https://github.com/bslee1129/kcs_csv)

## 🌟 주요 기능
- **드래그 앤 드롭 업로드**: CSV 파일을 브라우저로 끌어다 놓으면 즉시 분석 시작
- **1-Click 샘플 데이터셋**: 준비된 파일이 없어도 무역/관세 샘플 통계로 즉시 체험 가능
- **스마트 수치 정제**: 콤마(`,`), 통화 기호(`₩`, `$`) 등이 포함된 텍스트도 자동으로 수치형 데이터로 변환
- **동적 차트 집계**:
  - 지원 차트: 막대(Bar), 꺾은선(Line), 도넛(Doughnut), 파이(Pie), 레이더(Radar)
  - 집계 연산: 합계(Sum), 평균(Average), 데이터 건수(Count), 최댓값(Max), 최솟값(Min)
  - 상위 N개 필터 및 값 기준 정렬
- **차트 이미지 저장**: 시각화 결과를 고해상도 PNG 이미지로 즉시 저장
- **데이터 테이블 미리보기**: 전체 행 탐색, 실시간 키워드 검색, 페이지네이션 지원
- **프라이버시 보장**: 브라우저 로컬에서 100% 동작하여 외부 서버로 데이터가 전송되지 않음

## 📂 파일 구조
- `index.html` : 웹 대시보드 UI 마크업
- `style.css` : 모던 글래스모피즘 기반 다크 테마 스타일시트
- `app.js` : CSV 파싱(PapaParse) 및 차트 엔진(Chart.js) 로직

## 🚀 실행 방법
`index.html` 파일을 웹 브라우저(Chrome, Edge 등)로 열면 바로 실행됩니다.
GitHub Pages를 활성화하면 웹 사이트 주소로도 바로 공유할 수 있습니다.
