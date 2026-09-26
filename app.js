/**
 * CSV 스마트 차트 스튜디오 PRO - Active app.js
 * 파티클 네트워크, 3D 카드 틸트, 카운트업 애니메이션, 사운드 FX,
 * 4분할 멀티 차트 대시보드 및 지능형 통계 집계 엔진
 */

document.addEventListener('DOMContentLoaded', () => {
  // 상태 관리 객체
  const state = {
    fileName: '',
    fileSize: '',
    rawRows: [],
    headers: [],
    columnTypes: {},
    currentChart: null,
    multiCharts: {},      // { bar, pie, line, radar }
    chartType: 'bar',
    viewMode: 'single',   // 'single' | 'multi'
    selectedX: '',
    selectedY: '',
    aggType: 'sum',
    limit: 10,
    sort: 'desc',
    showGrid: true,
    gradientFill: true,
    theme: 'cyber-indigo',
    soundEnabled: true,
    tablePage: 1,
    tablePageSize: 50,
    searchQuery: ''
  };

  // DOM 요소 캐싱
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('csv-file-input');
  const btnSampleData = document.getElementById('btn-sample-data');
  const dashboardArea = document.getElementById('dashboard-area');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');

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
  const toggleGradient = document.getElementById('toggle-gradient-fill');
  const btnReset = document.getElementById('btn-reset-filters');
  const btnDownloadChart = document.getElementById('btn-download-chart');
  const viewTabBtns = document.querySelectorAll('.view-tab-btn');
  const singleViewContainer = document.getElementById('single-view-container');
  const multiViewContainer = document.getElementById('multi-view-container');
  const themeBtns = document.querySelectorAll('.theme-btn');

  // 차트 캔버스
  const chartCanvas = document.getElementById('main-chart');
  const multiBarCanvas = document.getElementById('multi-bar-chart');
  const multiPieCanvas = document.getElementById('multi-pie-chart');
  const multiLineCanvas = document.getElementById('multi-line-chart');
  const multiRadarCanvas = document.getElementById('multi-radar-chart');

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

  // 테마별 컬러 팔레트
  const themePalettes = {
    'cyber-indigo': [
      { bg: 'rgba(99, 102, 241, 0.8)', border: '#6366f1' },
      { bg: 'rgba(6, 182, 212, 0.8)', border: '#06b6d4' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: '#ec4899' },
      { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
      { bg: 'rgba(139, 92, 246, 0.8)', border: '#8b5cf6' }
    ],
    'emerald-mint': [
      { bg: 'rgba(16, 185, 129, 0.8)', border: '#10b981' },
      { bg: 'rgba(52, 211, 153, 0.8)', border: '#34d399' },
      { bg: 'rgba(6, 182, 212, 0.8)', border: '#06b6d4' },
      { bg: 'rgba(245, 158, 11, 0.8)', border: '#f59e0b' },
      { bg: 'rgba(14, 165, 233, 0.8)', border: '#0ea5e9' }
    ],
    'sunset-fire': [
      { bg: 'rgba(249, 115, 22, 0.8)', border: '#f97316' },
      { bg: 'rgba(251, 146, 60, 0.8)', border: '#fb923c' },
      { bg: 'rgba(250, 204, 21, 0.8)', border: '#facc15' },
      { bg: 'rgba(239, 68, 68, 0.8)', border: '#ef4444' },
      { bg: 'rgba(236, 72, 153, 0.8)', border: '#ec4899' }
    ],
    'neon-pink': [
      { bg: 'rgba(236, 72, 153, 0.8)', border: '#ec4899' },
      { bg: 'rgba(168, 85, 247, 0.8)', border: '#a855f7' },
      { bg: 'rgba(99, 102, 241, 0.8)', border: '#6366f1' },
      { bg: 'rgba(6, 182, 212, 0.8)', border: '#06b6d4' },
      { bg: 'rgba(244, 63, 94, 0.8)', border: '#f43f5e' }
    ]
  };

  /* -------------------------------------------------------------
   * 1. Web Audio API 인터랙티브 사운드 엔진
   * ----------------------------------------------------------- */
  let audioCtx = null;
  function playSound(type = 'click') {
    if (!state.soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        osc.frequency.setValueAtTime(880, now + 0.24);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // AudioContext 제한 등 예외 무시
    }
  }

  btnSoundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    btnSoundToggle.style.opacity = state.soundEnabled ? '1' : '0.4';
    if (state.soundEnabled) playSound('click');
  });

  /* -------------------------------------------------------------
   * 2. 인터랙티브 배경 파티클 캔버스
   * ----------------------------------------------------------- */
  function initParticleCanvas() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles = [];
    const count = Math.min(Math.floor((width * height) / 18000), 70);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    let mouse = { x: -1000, y: -1000 };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function renderParticles() {
      ctx.clearRect(0, 0, width, height);

      // 점 업데이트 및 연결 선
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // 마우스 상호작용
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.x -= (dx / dist) * 0.8;
          p.y -= (dy / dist) * 0.8;
        }

        ctx.fillStyle = `rgba(165, 180, 252, ${p.alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 110) {
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.18 * (1 - dist2 / 110)})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(renderParticles);
    }
    renderParticles();
  }
  initParticleCanvas();

  /* -------------------------------------------------------------
   * 3. 3D 마우스 틸트(Tilt) 인터랙션
   * ----------------------------------------------------------- */
  function initTiltEffect() {
    const targets = document.querySelectorAll('.tilt-target');
    targets.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = -(y / (rect.height / 2)) * 3;
        const rotateY = (x / (rect.width / 2)) * 3;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }
  initTiltEffect();

  /* -------------------------------------------------------------
   * 4. 숫자 카운트업(CountUp) 애니메이션
   * ----------------------------------------------------------- */
  function animateValue(obj, start, end, duration = 800) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const current = Math.floor(ease * (end - start) + start);
      obj.textContent = current.toLocaleString() + (obj.id === 'kpi-row-count' ? ' 행' : ' 개');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  /* -------------------------------------------------------------
   * 5. 테마 변경
   * ----------------------------------------------------------- */
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      state.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      updateVisualization();
    });
  });

  /* -------------------------------------------------------------
   * 6. 뷰 모드 전환 (단일 차트 vs 4-Grid 멀티 차트)
   * ----------------------------------------------------------- */
  viewTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      viewTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.viewMode = btn.dataset.view;

      const chartTypeGroup = document.getElementById('chart-type-control-group');

      if (state.viewMode === 'multi') {
        singleViewContainer.classList.add('hidden');
        multiViewContainer.classList.remove('hidden');
        if (chartTypeGroup) chartTypeGroup.style.display = 'none';
      } else {
        singleViewContainer.classList.remove('hidden');
        multiViewContainer.classList.add('hidden');
        if (chartTypeGroup) chartTypeGroup.style.display = 'flex';
      }
      updateVisualization();
    });
  });

  /* -------------------------------------------------------------
   * 7. 파일 업로드 및 데이터 정제
   * ----------------------------------------------------------- */
  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-active');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

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
      dynamicTyping: false,
      encoding: 'UTF-8',
      complete: (results) => {
        processParsedData(results.data);
      }
    });
  }

  function loadSampleDataset() {
    state.fileName = '관세조사_주요수입품목_통계_2026.csv';
    state.fileSize = '4.2 KB';

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

  function cleanNumericString(val) {
    if (typeof val === 'number') return val;
    if (!val) return NaN;
    const cleanStr = String(val).replace(/[,₩$\s%]/g, '');
    const num = Number(cleanStr);
    return isNaN(num) ? NaN : num;
  }

  function processParsedData(rawRows) {
    if (!rawRows || rawRows.length === 0) {
      alert('데이터가 비어 있는 CSV 파일입니다.');
      return;
    }

    const headers = Object.keys(rawRows[0]).filter(h => h && h.trim() !== '');
    state.headers = headers;

    const columnTypes = {};
    const sampleSize = Math.min(rawRows.length, 100);

    headers.forEach(h => {
      let numCount = 0;
      let nonNullCount = 0;
      for (let i = 0; i < sampleSize; i++) {
        const val = rawRows[i][h];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          nonNullCount++;
          if (!isNaN(cleanNumericString(val))) numCount++;
        }
      }
      columnTypes[h] = (nonNullCount > 0 && (numCount / nonNullCount) >= 0.8) ? 'numeric' : 'string';
    });

    state.columnTypes = columnTypes;
    state.rawRows = rawRows;

    populateControls();
    updateKPIsWithAnimation();

    dashboardArea.classList.remove('hidden');
    dropZone.scrollIntoView({ behavior: 'smooth' });

    updateVisualization();
    renderTable();

    // 효과음 & 축하 컨페티 효과
    playSound('success');
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // 3D 틸트 재초기화
    setTimeout(initTiltEffect, 200);
  }

  function populateControls() {
    xAxisSelect.innerHTML = '';
    yAxisSelect.innerHTML = '';

    const numericCols = state.headers.filter(h => state.columnTypes[h] === 'numeric');
    const stringCols = state.headers.filter(h => state.columnTypes[h] === 'string');

    state.headers.forEach(h => {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `${h} (${state.columnTypes[h] === 'numeric' ? '숫자' : '텍스트'})`;
      xAxisSelect.appendChild(opt);
    });

    if (numericCols.length > 0) {
      numericCols.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        yAxisSelect.appendChild(opt);
      });
    } else {
      state.headers.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h;
        opt.textContent = h;
        yAxisSelect.appendChild(opt);
      });
    }

    state.selectedX = stringCols.length > 0 ? stringCols[0] : state.headers[0];
    state.selectedY = numericCols.length > 0 ? numericCols[0] : state.headers[0];

    xAxisSelect.value = state.selectedX;
    yAxisSelect.value = state.selectedY;
  }

  function updateKPIsWithAnimation() {
    kpiFilename.textContent = state.fileName;
    kpiFilesize.textContent = state.fileSize;

    animateValue(kpiRowCount, 0, state.rawRows.length, 700);
    animateValue(kpiColCount, 0, state.headers.length, 500);

    const numCols = state.headers.filter(h => state.columnTypes[h] === 'numeric').length;
    const strCols = state.headers.length - numCols;
    kpiNumericCols.textContent = `수치형 ${numCols}개 / 텍스트 ${strCols}개`;

    updateSummaryKPI();
  }

  function updateSummaryKPI() {
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
   * 8. 데이터 집계 엔진
   * ----------------------------------------------------------- */
  function aggregateData() {
    const xCol = state.selectedX;
    const yCol = state.selectedY;
    const agg = state.aggType;
    const isYNumeric = state.columnTypes[yCol] === 'numeric';

    const groupMap = new Map();

    state.rawRows.forEach(row => {
      let xVal = row[xCol];
      if (xVal === undefined || xVal === null || String(xVal).trim() === '') {
        xVal = '(빈값)';
      } else {
        xVal = String(xVal).trim();
      }

      const yVal = isYNumeric ? cleanNumericString(row[yCol]) : 1;

      if (!groupMap.has(xVal)) groupMap.set(xVal, []);
      if (!isNaN(yVal)) groupMap.get(xVal).push(yVal);
    });

    let results = [];
    groupMap.forEach((vals, label) => {
      let computedVal = 0;
      if (vals.length > 0) {
        if (agg === 'sum') computedVal = vals.reduce((a, b) => a + b, 0);
        else if (agg === 'avg') computedVal = vals.reduce((a, b) => a + b, 0) / vals.length;
        else if (agg === 'count') computedVal = vals.length;
        else if (agg === 'max') computedVal = Math.max(...vals);
        else if (agg === 'min') computedVal = Math.min(...vals);
      }
      results.push({ label, value: computedVal });
    });

    if (state.sort === 'desc') results.sort((a, b) => b.value - a.value);
    else if (state.sort === 'asc') results.sort((a, b) => a.value - b.value);
    else if (state.sort === 'label-asc') results.sort((a, b) => a.label.localeCompare(b.label, 'ko'));

    if (state.limit !== 'all') {
      const limitNum = parseInt(state.limit, 10);
      results = results.slice(0, limitNum);
    }

    return results;
  }

  /* -------------------------------------------------------------
   * 9. 차트 렌더링
   * ----------------------------------------------------------- */
  function updateVisualization() {
    const aggResult = aggregateData();
    const labels = aggResult.map(item => item.label);
    const dataValues = aggResult.map(item => item.value);

    const aggKorean = {
      sum: '합계', avg: '평균', count: '건수', max: '최댓값', min: '최솟값'
    }[state.aggType];

    chartDynamicTitle.textContent = `${state.selectedX}별 [${state.selectedY}] ${aggKorean} 분석`;
    chartDynamicDesc.textContent = `기준: ${state.selectedX} | 대상: ${state.selectedY} | 집계: ${aggKorean}`;
    chartSummaryBadge.textContent = `${aggResult.length}개 항목 렌더링`;

    const palette = themePalettes[state.theme] || themePalettes['cyber-indigo'];

    if (state.viewMode === 'single') {
      renderSingleChart(labels, dataValues, aggKorean, palette);
    } else {
      renderMultiDashboard(labels, dataValues, aggKorean, palette);
    }

    updateSummaryKPI();
  }

  function renderSingleChart(labels, dataValues, aggKorean, palette) {
    if (state.currentChart) state.currentChart.destroy();

    const isHorizontal = state.chartType === 'horizontalBar';
    const actualType = isHorizontal ? 'bar' : state.chartType;
    const isCircular = ['doughnut', 'pie', 'polarArea'].includes(actualType);
    const isRadar = actualType === 'radar';

    const bgColors = isCircular ? labels.map((_, i) => palette[i % palette.length].bg) : palette[0].bg;
    const borderColors = isCircular ? labels.map((_, i) => palette[i % palette.length].border) : palette[0].border;

    const ctx = chartCanvas.getContext('2d');
    state.currentChart = new Chart(ctx, {
      type: actualType,
      data: {
        labels: labels,
        datasets: [{
          label: `${state.selectedY} (${aggKorean})`,
          data: dataValues,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: (actualType === 'bar') ? 6 : 0,
          fill: state.gradientFill && (actualType === 'line' || isRadar),
          tension: 0.38,
          pointBackgroundColor: borderColors,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        indexAxis: isHorizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 650, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            display: isCircular || isRadar,
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Pretendard', size: 12 }, padding: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: palette[0].border,
            borderWidth: 1,
            titleColor: '#fff',
            padding: 12,
            callbacks: {
              label: (c) => ` ${c.dataset.label || ''}: ${c.raw.toLocaleString()}`
            }
          }
        },
        scales: isCircular ? {} : (isRadar ? {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#94a3b8', font: { family: 'Pretendard' } },
            ticks: { display: false }
          }
        } : {
          x: {
            grid: { display: state.showGrid, color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { family: 'Pretendard', size: 11 } }
          },
          y: {
            grid: { display: state.showGrid, color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94a3b8', font: { family: 'Pretendard', size: 11 }, callback: (v) => formatSmartNumber(v) }
          }
        })
      }
    });
  }

  function renderMultiDashboard(labels, dataValues, aggKorean, palette) {
    // 4개 차트 파괴 후 재생성
    ['bar', 'pie', 'line', 'radar'].forEach(k => {
      if (state.multiCharts[k]) state.multiCharts[k].destroy();
    });

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      plugins: { legend: { display: false } }
    };

    // 1. Bar Chart
    state.multiCharts.bar = new Chart(multiBarCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ data: dataValues, backgroundColor: palette[0].bg, borderColor: palette[0].border, borderWidth: 1.5, borderRadius: 5 }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8', callback: (v) => formatSmartNumber(v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    // 2. Doughnut
    state.multiCharts.pie = new Chart(multiPieCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: labels.map((_, i) => palette[i % palette.length].bg),
          borderColor: labels.map((_, i) => palette[i % palette.length].border),
          borderWidth: 1.5
        }]
      },
      options: { ...commonOptions, plugins: { legend: { display: true, position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } } }
    });

    // 3. Line Chart
    state.multiCharts.line = new Chart(multiLineCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          borderColor: palette[1 % palette.length].border,
          backgroundColor: palette[1 % palette.length].bg,
          fill: true,
          tension: 0.4,
          pointRadius: 3
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#94a3b8', callback: (v) => formatSmartNumber(v) }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    // 4. Radar Chart
    state.multiCharts.radar = new Chart(multiRadarCanvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          borderColor: palette[2 % palette.length].border,
          backgroundColor: palette[2 % palette.length].bg,
          fill: true
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          r: {
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#94a3b8', font: { size: 9 } },
            ticks: { display: false }
          }
        }
      }
    });
  }

  /* -------------------------------------------------------------
   * 10. 인터랙션 및 필터 바인딩
   * ----------------------------------------------------------- */
  chartTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      chartTypeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartType = btn.dataset.type;
      updateVisualization();
    });
  });

  xAxisSelect.addEventListener('change', (e) => {
    playSound('click');
    state.selectedX = e.target.value;
    updateVisualization();
  });

  yAxisSelect.addEventListener('change', (e) => {
    playSound('click');
    state.selectedY = e.target.value;
    updateVisualization();
  });

  aggTypeSelect.addEventListener('change', (e) => {
    playSound('click');
    state.aggType = e.target.value;
    updateVisualization();
  });

  limitSelect.addEventListener('change', (e) => {
    playSound('click');
    state.limit = e.target.value;
    updateVisualization();
  });

  sortSelect.addEventListener('change', (e) => {
    playSound('click');
    state.sort = e.target.value;
    updateVisualization();
  });

  toggleGrid.addEventListener('change', (e) => {
    state.showGrid = e.target.checked;
    updateVisualization();
  });

  toggleGradient.addEventListener('change', (e) => {
    state.gradientFill = e.target.checked;
    updateVisualization();
  });

  btnReset.addEventListener('click', () => {
    playSound('click');
    state.chartType = 'bar';
    state.aggType = 'sum';
    state.limit = 10;
    state.sort = 'desc';
    state.showGrid = true;
    state.gradientFill = true;

    chartTypeButtons.forEach(b => b.classList.toggle('active', b.dataset.type === 'bar'));
    aggTypeSelect.value = 'sum';
    limitSelect.value = '10';
    sortSelect.value = 'desc';
    toggleGrid.checked = true;
    toggleGradient.checked = true;
    updateVisualization();
  });

  btnDownloadChart.addEventListener('click', () => {
    playSound('success');
    if (!state.currentChart) return;
    const imageURI = chartCanvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `스튜디오차트_${state.selectedX}_${state.selectedY}_${new Date().toISOString().slice(0,10)}.png`;
    link.href = imageURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  /* -------------------------------------------------------------
   * 11. 실시간 테이블 미리보기 & 검색 & 페이지네이션
   * ----------------------------------------------------------- */
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    state.tablePage = 1;
    renderTable();
  });

  btnPrevPage.addEventListener('click', () => {
    if (state.tablePage > 1) {
      playSound('click');
      state.tablePage--;
      renderTable();
    }
  });

  btnNextPage.addEventListener('click', () => {
    const filteredRows = getFilteredRows();
    const maxPage = Math.ceil(filteredRows.length / state.tablePageSize) || 1;
    if (state.tablePage < maxPage) {
      playSound('click');
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

    tableHeadRow.innerHTML = '';
    const thIdx = document.createElement('th');
    thIdx.textContent = '#';
    tableHeadRow.appendChild(thIdx);

    state.headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      tableHeadRow.appendChild(th);
    });

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

    tableRecordInfo.textContent = totalCount > 0 
      ? `${(startIdx + 1).toLocaleString()} - ${endIdx.toLocaleString()}번째 행 표시 (총 ${totalCount.toLocaleString()}건)`
      : `총 0건`;
    pageIndicator.textContent = `${state.tablePage} / ${maxPage} 페이지`;

    btnPrevPage.disabled = state.tablePage <= 1;
    btnNextPage.disabled = state.tablePage >= maxPage;
  }
});
