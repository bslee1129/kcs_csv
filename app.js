/**
 * CSV 차트 분석 스튜디오 - app.js
 * 데이터 파싱, 열 타입 추론, 실시간 집계 및 Chart.js 시각화
 */

document.addEventListener('DOMContentLoaded', () => {
  // 상태 관리 객체
  const state = {
    fileName: '',
    fileSize: '',
    rawRows: [],          // 파싱된 전체 원본 행 데이터 [ {col1: val1, ...}, ... ]
    headers: [],          // 컬럼명 배열
    columnTypes: {},      // { colName: 'numeric' | 'string' }
    currentChart: null,   // Chart.js 인스턴스
    chartType: 'bar',     // 'bar' | 'line' | 'doughnut' | 'pie' | 'radar'
    selectedX: '',
    selectedY: '',
    aggType: 'sum',
    limit: 10,
    sort: 'desc',
    showGrid: true,
    tablePage: 1,
    tablePageSize: 50,
    searchQuery: ''
  };

  // DOM 요소 캐싱
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  const btnSampleData = document.getElementById('btn-sample-data');
  const dashboardArea = document.getElementById('dashboard-area');

  // KPI 요소
  const kpiFilename = document.getElementById('kpi-filename');
  const kpiFilesize = document.getElementById('kpi-filesize');
  const kpiRowCount = document.getElementById('kpi-row-count');
  const kpiColCount = document.getElementById('kpi-col-count');
  const kpiNumericCols = document.getElementById('kpi-numeric-cols');
  const kpiSumVal = document.getElementById('kpi-sum-val');
  const kpiAvgVal = document.getElementById('kpi-avg-val');

  // 컨트롤 요소
  const chartTypeButtons = document.querySelectorAll('.type-btn');
  const xAxisSelect = document.getElementById('x-axis-select');
  const yAxisSelect = document.getElementById('y-axis-select');
  const aggTypeSelect = document.getElementById('agg-type-select');
  const limitSelect = document.getElementById('limit-select');
  const sortSelect = document.getElementById('sort-select');
  const toggleGrid = document.getElementById('toggle-data-labels');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnDownloadChart = document.getElementById('btn-download-chart');

  // 차트 디스플레이 요소
  const chartCanvas = document.getElementById('main-chart');
  const chartDynamicTitle = document.getElementById('chart-dynamic-title');
  const chartDynamicDesc = document.getElementById('chart-dynamic-desc');
  const chartSummaryBadge = document.getElementById('chart-summary-badge');

  // 테이블 요소
  const searchInput = document.getElementById('table-search-input');
  const tableHeadRow = document.getElementById('table-head-row');
  const tableBody = document.getElementById('table-body');
  const tableRecordInfo = document.getElementById('table-record-info');
  const btnPrevPage = document.getElementById('btn-prev-page');
  const btnNextPage = document.getElementById('btn-next-page');
  const pageIndicator = document.getElementById('page-indicator');

  // 현대적인 차트 컬러 팔레트
  const chartColors = [
    { bg: 'rgba(99, 102, 241, 0.75)', border: '#6366f1' },   // Indigo
    { bg: 'rgba(6, 182, 212, 0.75)', border: '#06b6d4' },    // Cyan
    { bg: 'rgba(236, 72, 153, 0.75)', border: '#ec4899' },   // Pink
    { bg: 'rgba(16, 185, 129, 0.75)', border: '#10b981' },   // Emerald
    { bg: 'rgba(245, 158, 11, 0.75)', border: '#f59e0b' },   // Amber
    { bg: 'rgba(139, 92, 246, 0.75)', border: '#8b5cf6' },   // Violet
    { bg: 'rgba(244, 63, 94, 0.75)', border: '#f43f5e' },    // Rose
    { bg: 'rgba(20, 184, 166, 0.75)', border: '#14b8a6' },   // Teal
    { bg: 'rgba(59, 130, 246, 0.75)', border: '#3b82f6' },   // Blue
    { bg: 'rgba(168, 85, 247, 0.75)', border: '#a855f7' }    // Purple
  ];

  /* -------------------------------------------------------------
   * 1. 파일 업로드 및 드래그 앤 드롭 이벤트
   * ----------------------------------------------------------- */
  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(evtName => {
    dropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(evtName => {
    dropZone.addEventListener(evtName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // 샘플 데이터셋 제공 (무역/관세조사 및 통계 실습용)
  btnSampleData.addEventListener('click', () => {
    loadSampleDataset();
  });

  function handleFile(file) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('CSV 형식(.csv)의 파일만 지원됩니다.');
      return;
    }

    state.fileName = file.name;
    state.fileSize = (file.size / 1024).toFixed(1) + ' KB';

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // 통화 표기 콤마(,) 제거를 위해 수동 정제 수행
      encoding: 'UTF-8',
      complete: (results) => {
        processParsedData(results.data);
      },
      error: (err) => {
        alert('CSV 파일 파싱 중 오류가 발생했습니다: ' + err.message);
      }
    });
  }

  function loadSampleDataset() {
    state.fileName = '관세조사_주요수입품목_통계_2026.csv';
    state.fileSize = '3.8 KB';

    // 현실적인 관세조사/수출입 샘플 데이터
    const sampleCsv = `품목군,원산지,수입건수,수입신고금액_USD,부과관세액_만원,추징세액_만원,신고오류율_%
메모리반도체,대만,1420,89200000,44600,1200,2.1
이차전지소재,중국,2180,64500000,32250,5640,6.8
자동차부품,독일,980,51200000,40960,1850,3.4
정밀계측장비,일본,1120,43000000,34400,2410,4.2
원유및석유제품,사우디,340,98500000,29550,890,1.2
의료용기기,미국,860,37800000,30240,3120,5.5
고급소비재(패션),이탈리아,3450,28900000,37570,7820,11.4
화장품원료,프랑스,1230,19800000,15840,1430,3.9
농축수산물,베트남,2890,15400000,61600,8450,9.7
통신기기부품,중국,4120,72400000,36200,6230,7.3
합성수지,미국,1560,31200000,20280,1100,2.5
신재생에너지인버터,중국,890,24500000,12250,2780,5.8`;

    Papa.parse(sampleCsv, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processParsedData(results.data);
      }
    });
  }

  /* -------------------------------------------------------------
   * 2. 파싱 데이터 정제 및 타입 판별
   * ----------------------------------------------------------- */
  function cleanNumericString(val) {
    if (typeof val === 'number') return val;
    if (!val) return NaN;
    // 쉼표, 원화/달러 기호, 공백 제거
    const cleanStr = String(val).replace(/[,₩$\s%]/g, '');
    const num = Number(cleanStr);
    return isNaN(num) ? NaN : num;
  }

  function processParsedData(rawRows) {
    if (!rawRows || rawRows.length === 0) {
      alert('데이터가 비어 있는 CSV 파일입니다.');
      return;
    }

    // 헤더 추출
    const headers = Object.keys(rawRows[0]).filter(h => h && h.trim() !== '');
    state.headers = headers;

    // 데이터 정제 및 타입 추론
    const columnTypes = {};
    const sampleSize = Math.min(rawRows.length, 100);

    headers.forEach(h => {
      let numCount = 0;
      let nonNullCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        const val = rawRows[i][h];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          nonNullCount++;
          if (!isNaN(cleanNumericString(val))) {
            numCount++;
          }
        }
      }

      // 80% 이상이 숫자 변환 가능하면 수치 컬럼으로 간주
      columnTypes[h] = (nonNullCount > 0 && (numCount / nonNullCount) >= 0.8) ? 'numeric' : 'string';
    });

    state.columnTypes = columnTypes;
    state.rawRows = rawRows;

    // UI 컨트롤 옵션 생성
    populateControls();

    // KPI 카드 업데이트
    updateKPIs();

    // 대시보드 영역 표시
    dashboardArea.classList.remove('hidden');
    dropZone.scrollIntoView({ behavior: 'smooth' });

    // 초기 차트 및 테이블 렌더링
    updateVisualization();
    renderTable();
  }

  function populateControls() {
    xAxisSelect.innerHTML = '';
    yAxisSelect.innerHTML = '';

    const numericCols = state.headers.filter(h => state.columnTypes[h] === 'numeric');
    const stringCols = state.headers.filter(h => state.columnTypes[h] === 'string');

    // X축 (범주형 우선, 없으면 전체)
    state.headers.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `${h} (${state.columnTypes[h] === 'numeric' ? '숫자' : '텍스트'})`;
      xAxisSelect.appendChild(opt);
    });

    // Y축 (수치형 컬럼)
    if (numericCols.length > 0) {
      numericCols.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        yAxisSelect.appendChild(opt);
      });
    } else {
      // 수치 컬럼이 없으면 모든 컬럼 허용 (Count 집계 용도)
      state.headers.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        yAxisSelect.appendChild(opt);
      });
    }

    // 기본 선택값 지능형 설정
    state.selectedX = stringCols.length > 0 ? stringCols[0] : state.headers[0];
    state.selectedY = numericCols.length > 0 ? numericCols[0] : state.headers[0];

    xAxisSelect.value = state.selectedX;
    yAxisSelect.value = state.selectedY;
  }

  /* -------------------------------------------------------------
   * 3. KPI 및 통계 정보 업데이트
   * ----------------------------------------------------------- */
  function updateKPIs() {
    kpiFilename.textContent = state.fileName;
    kpiFilesize.textContent = state.fileSize;
    kpiRowCount.textContent = state.rawRows.length.toLocaleString() + ' 행';
    kpiColCount.textContent = state.headers.length + ' 개';

    const numCols = state.headers.filter(h => state.columnTypes[h] === 'numeric').length;
    const strCols = state.headers.length - numCols;
    kpiNumericCols.textContent = `수치형 ${numCols}개 / 텍스트 ${strCols}개`;

    // 선택된 Y축 컬럼의 전체 합계 & 평균 계산
    if (state.columnTypes[state.selectedY] === 'numeric') {
      let sum = 0;
      let count = 0;
      state.rawRows.forEach(row => {
        const val = cleanNumericString(row[state.selectedY]);
        if (!isNaN(val)) {
          sum += val;
          count++;
        }
      });
      const avg = count > 0 ? (sum / count) : 0;
      kpiSumVal.textContent = formatSmartNumber(sum);
      kpiAvgVal.textContent = `전체 평균: ${formatSmartNumber(avg)}`;
    } else {
      kpiSumVal.textContent = state.rawRows.length.toLocaleString() + ' 건';
      kpiAvgVal.textContent = '범주형 데이터 (건수 기준)';
    }
  }

  function formatSmartNumber(num) {
    if (isNaN(num)) return '-';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Number.isInteger(num)) return num.toLocaleString();
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  /* -------------------------------------------------------------
   * 4. 데이터 그룹화 및 집계 (Aggregation Engine)
   * ----------------------------------------------------------- */
  function aggregateData() {
    const xCol = state.selectedX;
    const yCol = state.selectedY;
    const agg = state.aggType;
    const isYNumeric = state.columnTypes[yCol] === 'numeric';

    // xGroup: { [categoryValue]: number[] }
    const groupMap = new Map();

    state.rawRows.forEach(row => {
      let xVal = row[xCol];
      if (xVal === undefined || xVal === null || String(xVal).trim() === '') {
        xVal = '(빈값)';
      } else {
        xVal = String(xVal).trim();
      }

      const yVal = isYNumeric ? cleanNumericString(row[yCol]) : 1;

      if (!groupMap.has(xVal)) {
        groupMap.set(xVal, []);
      }
      if (!isNaN(yVal)) {
        groupMap.get(xVal).push(yVal);
      }
    });

    let results = [];

    groupMap.forEach((vals, label) => {
      let computedVal = 0;
      if (vals.length > 0) {
        if (agg === 'sum') {
          computedVal = vals.reduce((a, b) => a + b, 0);
        } else if (agg === 'avg') {
          computedVal = vals.reduce((a, b) => a + b, 0) / vals.length;
        } else if (agg === 'count') {
          computedVal = vals.length;
        } else if (agg === 'max') {
          computedVal = Math.max(...vals);
        } else if (agg === 'min') {
          computedVal = Math.min(...vals);
        }
      }
      results.push({ label, value: computedVal, count: vals.length });
    });

    // 정렬
    if (state.sort === 'desc') {
      results.sort((a, b) => b.value - a.value);
    } else if (state.sort === 'asc') {
      results.sort((a, b) => a.value - b.value);
    } else if (state.sort === 'label-asc') {
      results.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    }

    // 개수 제한 (Limit)
    if (state.limit !== 'all') {
      const limitNum = parseInt(state.limit, 10);
      results = results.slice(0, limitNum);
    }

    return results;
  }

  /* -------------------------------------------------------------
   * 5. Chart.js 렌더링 및 인터랙션
   * ----------------------------------------------------------- */
  function updateVisualization() {
    const aggResult = aggregateData();
    const labels = aggResult.map(item => item.label);
    const dataValues = aggResult.map(item => item.value);

    // 제목 및 설명 텍스트 업데이트
    const aggKorean = {
      sum: '합계',
      avg: '평균',
      count: '건수',
      max: '최댓값',
      min: '최솟값'
    }[state.aggType];

    chartDynamicTitle.textContent = `${state.selectedX}별 [${state.selectedY}] ${aggKorean} 분석`;
    chartDynamicDesc.textContent = `기준 컬럼: ${state.selectedX} | 대상 수치: ${state.selectedY} | 집계 방식: ${aggKorean}`;
    chartSummaryBadge.textContent = `${aggResult.length}개 항목 시각화 중`;

    // 이전 차트 파괴
    if (state.currentChart) {
      state.currentChart.destroy();
    }

    const isPieOrDoughnut = state.chartType === 'pie' || state.chartType === 'doughnut';
    const isRadar = state.chartType === 'radar';

    // 색상 생성
    let backgroundColors;
    let borderColors;

    if (isPieOrDoughnut) {
      backgroundColors = labels.map((_, i) => chartColors[i % chartColors.length].bg);
      borderColors = labels.map((_, i) => chartColors[i % chartColors.length].border);
    } else {
      backgroundColors = chartColors[0].bg;
      borderColors = chartColors[0].border;
    }

    const ctx = chartCanvas.getContext('2d');

    state.currentChart = new Chart(ctx, {
      type: state.chartType,
      data: {
        labels: labels,
        datasets: [{
          label: `${state.selectedY} (${aggKorean})`,
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: isPieOrDoughnut ? 2 : 2,
          borderRadius: state.chartType === 'bar' ? 6 : 0,
          fill: state.chartType === 'line' || isRadar,
          tension: 0.35,
          pointBackgroundColor: borderColors,
          pointRadius: 4,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 600,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: isPieOrDoughnut || isRadar,
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Pretendard', size: 12 },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                return ` ${context.dataset.label || ''}: ${val.toLocaleString()}`;
              }
            }
          }
        },
        scales: isPieOrDoughnut ? {} : (isRadar ? {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#94a3b8', font: { family: 'Pretendard', size: 11 } },
            ticks: { display: false }
          }
        } : {
          x: {
            grid: {
              display: state.showGrid,
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Pretendard', size: 11 },
              maxRotation: 45,
              minRotation: 0
            }
          },
          y: {
            grid: {
              display: state.showGrid,
              color: 'rgba(255, 255, 255, 0.06)'
            },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Pretendard', size: 11 },
              callback: (val) => formatSmartNumber(val)
            }
          }
        })
      }
    });

    updateKPIs();
  }

  /* -------------------------------------------------------------
   * 6. 컨트롤 이벤트 바인딩
   * ----------------------------------------------------------- */
  chartTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chartTypeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartType = btn.dataset.type;
      updateVisualization();
    });
  });

  xAxisSelect.addEventListener('change', (e) => {
    state.selectedX = e.target.value;
    updateVisualization();
  });

  yAxisSelect.addEventListener('change', (e) => {
    state.selectedY = e.target.value;
    updateVisualization();
  });

  aggTypeSelect.addEventListener('change', (e) => {
    state.aggType = e.target.value;
    updateVisualization();
  });

  limitSelect.addEventListener('change', (e) => {
    state.limit = e.target.value;
    updateVisualization();
  });

  sortSelect.addEventListener('change', (e) => {
    state.sort = e.target.value;
    updateVisualization();
  });

  toggleGrid.addEventListener('change', (e) => {
    state.showGrid = e.target.checked;
    updateVisualization();
  });

  btnReset.addEventListener('click', () => {
    state.chartType = 'bar';
    state.aggType = 'sum';
    state.limit = 10;
    state.sort = 'desc';
    state.showGrid = true;

    chartTypeButtons.forEach(b => {
      b.classList.toggle('active', b.dataset.type === 'bar');
    });
    aggTypeSelect.value = 'sum';
    limitSelect.value = '10';
    sortSelect.value = 'desc';
    toggleGrid.checked = true;

    updateVisualization();
  });

  // 차트 PNG 다운로드
  btnDownloadChart.addEventListener('click', () => {
    if (!state.currentChart) return;
    const imageURI = chartCanvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `차트분석_${state.selectedX}_${state.selectedY}_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = imageURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  /* -------------------------------------------------------------
   * 7. 데이터 원본 테이블 미리보기 및 검색/페이지네이션
   * ----------------------------------------------------------- */
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    state.tablePage = 1;
    renderTable();
  });

  btnPrevPage.addEventListener('click', () => {
    if (state.tablePage > 1) {
      state.tablePage--;
      renderTable();
    }
  });

  btnNextPage.addEventListener('click', () => {
    const filteredRows = getFilteredRows();
    const maxPage = Math.ceil(filteredRows.length / state.tablePageSize) || 1;
    if (state.tablePage < maxPage) {
      state.tablePage++;
      renderTable();
    }
  });

  function getFilteredRows() {
    if (!state.searchQuery) return state.rawRows;
    return state.rawRows.filter(row => {
      return state.headers.some(h => {
        const val = row[h];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(state.searchQuery);
      });
    });
  }

  function renderTable() {
    const filteredRows = getFilteredRows();
    const totalCount = filteredRows.length;
    const maxPage = Math.ceil(totalCount / state.tablePageSize) || 1;
    if (state.tablePage > maxPage) state.tablePage = maxPage;

    const startIdx = (state.tablePage - 1) * state.tablePageSize;
    const endIdx = Math.min(startIdx + state.tablePageSize, totalCount);
    const displayRows = filteredRows.slice(startIdx, endIdx);

    // 테이블 헤더 렌더링
    tableHeadRow.innerHTML = '';
    const thIdx = document.createElement('th');
    thIdx.textContent = '#';
    tableHeadRow.appendChild(thIdx);

    state.headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      tableHeadRow.appendChild(th);
    });

    // 테이블 바디 렌더링
    tableBody.innerHTML = '';
    if (displayRows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = state.headers.length + 1;
      td.style.textAlign = 'center';
      td.style.padding = '2rem';
      td.style.color = '#64748b';
      td.textContent = '일치하는 데이터가 없습니다.';
      tr.appendChild(td);
      tableBody.appendChild(tr);
    } else {
      displayRows.forEach((row, i) => {
        const tr = document.createElement('tr');
        const tdIdx = document.createElement('td');
        tdIdx.style.color = '#64748b';
        tdIdx.textContent = (startIdx + i + 1);
        tr.appendChild(tdIdx);

        state.headers.forEach(h => {
          const td = document.createElement('td');
          const val = row[h];
          td.textContent = (val !== undefined && val !== null) ? val : '';
          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
    }

    // 페이지네이션 텍스트 & 버튼 상태
    tableRecordInfo.textContent = totalCount > 0 
      ? `${(startIdx + 1).toLocaleString()} - ${endIdx.toLocaleString()}번째 행 표시 (총 ${totalCount.toLocaleString()}건)`
      : `총 0건`;
    pageIndicator.textContent = `${state.tablePage} / ${maxPage} 페이지`;

    btnPrevPage.disabled = state.tablePage <= 1;
    btnNextPage.disabled = state.tablePage >= maxPage;
  }
});
