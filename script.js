// === Dropdown toggle ===
document.querySelector('.dropbtn').addEventListener('click', function (e) {
    e.stopPropagation();
    document.querySelector('.dropdown').classList.toggle('show');
});
document.addEventListener('click', function (e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelector('.dropdown').classList.remove('show');
    }
});

fetch('chart1.json')
  .then(response => response.json())
  .then(data => {
    const labels = [];
    const weekLabels = [];
    const year2022 = [];
    const year2023 = [];
    const year2024 = [];
    const year2025 = [];
    const source = [];
    const weekAvg = [];

    data.forEach(week => {
      week.days.forEach((day, idx) => {
        labels.push(`${week.week} - Day ${idx + 1}`);
        weekLabels.push(week.week);
        year2022.push(day.year_2022);
        year2023.push(day.year_2023);
        year2024.push(day.year_2024);
        year2025.push(day.year_2025);
        source.push(day.source);
        weekAvg.push(day["2025 Average"]);
      });
    });

    const avgValue = weekAvg.length ? weekAvg[0] : 0;
    const avgLine = Array(labels.length).fill(avgValue);
    const lastActualIndex = source.lastIndexOf('actual');

    const year2025Actual = year2025.map((v, i) => source[i] === 'actual' ? v : null);
    const year2025Prediction = year2025.map((v, i) => {
      if (i < lastActualIndex) return null;
      if (i === lastActualIndex) return year2025[lastActualIndex];
      return source[i] === 'prediction' ? v : null;
    });

    const allValues = [...year2022, ...year2023, ...year2024, ...year2025].filter(v => v != null);
    const maxVal = Math.max(...allValues);

    const zoomMin = 700;                // <-- baseline
    const zoomMax = maxVal * 1.1;       // <-- dynamic max

    // === Bars offset by baseline (700) ===
    const bars = labels.map((label) => {
      let offset = 0;
      if (label.includes("School Start Week") && label.includes("Day 1")) {
        offset = avgValue * 1.4 * 0.5; // scaled down
      } else if (label.includes("Day 1")) {
        offset = avgValue * 0.8 * 0.5;
      }
      return zoomMin + offset;          // <-- start at 700 baseline
    });

    const abbreviateWeek = (week) => week
      .replace("Seven Weeks Before", "7W B")
      .replace("Six Weeks Before", "6W B")
      .replace("Five Weeks Before", "5W B")
      .replace("Four Weeks Before", "4W B")
      .replace("Three Weeks Before", "3W B")
      .replace("Two Weeks Before", "2W B")
      .replace("One Week Before", "1W B")
      .replace("School Start Week", "Start")
      .replace("One Week After", "1W A")
      .replace("Two Weeks After", "2W A")
      .replace("Three Weeks After", "3W A");

    const chartBackground = {
      id: 'chartBackground',
      beforeDraw: (chart) => {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.fillStyle = '#16204314';
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();
      }
    };

    const ctx = document.getElementById('trendChart').getContext('2d');
    ctx.canvas.parentNode.style.height = '38vh';

    const chartInstance = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Start',
            type: 'bar',
            data: bars,
            backgroundColor: 'rgba(220,220,220,0.8)',
            barThickness: 2 // thinner bars
          },
          { label: '2022', type: 'line', data: year2022, borderColor: '#f1c40f', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2023', type: 'line', data: year2023, borderColor: '#3498db', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2024', type: 'line', data: year2024, borderColor: '#9b59b6', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2025 Actual', type: 'line', data: year2025Actual, borderColor: '#2ecc71', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.3 },
          { label: '2025 Prediction', type: 'line', data: year2025Prediction, borderColor: '#e74c3c', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.3, borderDash: [5, 5] },
          { label: '2025 Average', type: 'line', data: avgLine, borderColor: '#ecf0f1', borderWidth: 1, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.3, borderDash: [5, 5] }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: 20 },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size: 8 }, color: '#ffffff' } },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { drawOnChartArea: false, color: '#555' },
            ticks: {
              color: '#ffffff',
              font: { size: 8 },
              callback: (value, index) => labels[index].includes("Day 1") ? abbreviateWeek(weekLabels[index]) : '',
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false
            }
          },
          y: {
            grid: { drawOnChartArea: false, color: '#555' },
            ticks: { color: '#ffffff', font: { size: 8 } },
            min: zoomMin,  // <-- start Y axis at 700
            max: zoomMax
          }
        }
      },
      plugins: [chartBackground]
    });

    // === Rotation logic unchanged ===
    const datasets = chartInstance.data.datasets;
    const actualIndex = datasets.findIndex(d => d.label === '2025 Actual');
    const predictionIndex = datasets.findIndex(d => d.label === '2025 Prediction');
    const averageIndex = datasets.findIndex(d => d.label === '2025 Average');

    const rotationOrder = [1, 2, 3, 'actual'];
    let orderIndex = 0;
    let rotationPaused = false;
    let resumeTimeout;

    function cycleDatasets() {
      if (!rotationPaused) {
        datasets.forEach((_, i) => {
          if (i !== 0) chartInstance.setDatasetVisibility(i, false);
        });
        chartInstance.setDatasetVisibility(averageIndex, true);

        const current = rotationOrder[orderIndex];
        if (current === 'actual') {
          chartInstance.setDatasetVisibility(actualIndex, true);
          chartInstance.setDatasetVisibility(predictionIndex, true);
        } else {
          chartInstance.setDatasetVisibility(current, true);
        }

        chartInstance.update();
        orderIndex = (orderIndex + 1) % rotationOrder.length;
      }
      setTimeout(cycleDatasets, 2000);
    }

    datasets.forEach((_, i) => {
      if (i !== 0 && i !== averageIndex) chartInstance.setDatasetVisibility(i, false);
    });
    chartInstance.setDatasetVisibility(averageIndex, true);
    chartInstance.update();
    cycleDatasets();

    document.querySelectorAll('.dataset-toggle').forEach(input => {
      input.checked = false;
      input.addEventListener('change', () => {
        clearTimeout(resumeTimeout);
        rotationPaused = true;

        datasets.forEach((ds, i) => {
          if (i === 0) return;
          if (ds.label === '2025 Average') {
            chartInstance.setDatasetVisibility(i, true);
          } else if (input.value === '2025 Actual' && input.checked) {
            if (ds.label === '2025 Actual' || ds.label === '2025 Prediction') {
              chartInstance.setDatasetVisibility(i, true);
            }
          } else if (ds.label === input.value) {
            chartInstance.setDatasetVisibility(i, input.checked);
          } else if (!document.querySelector(`.dataset-toggle[value="${ds.label}"]`).checked) {
            chartInstance.setDatasetVisibility(i, false);
          }
        });

        chartInstance.update();

        resumeTimeout = setTimeout(() => {
          rotationPaused = false;
        }, 5000);
      });
    });
  })
  .catch(err => console.error('Error loading data', err));



async function updateMetrics() {
  try {
    const response = await fetch('chart2_dynamic.json?ts=' + Date.now());
    const data = await response.json();

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));

    let latestRecord = data.records[0];
    for (let record of data.records) {
      const recordTime = new Date(record.datetime);
      if (recordTime <= now) {
        latestRecord = record;
      }
    }

    for (const key in latestRecord) {
      if (key === "datetime") continue;

      const box = document.getElementById(key);
      if (!box) continue;

      const metric = latestRecord[key];
      const valueElement = box.querySelector(".metric-value");

      // Update text
      valueElement.textContent = metric.value;

      // Update color class
      valueElement.classList.remove("normal", "warning", "critical");
      valueElement.classList.add(metric.status.toLowerCase());
    }
  } catch (error) {
    console.error("Error fetching metrics:", error);
  }
}

setInterval(updateMetrics, 60000);
updateMetrics();




//===========================================================
// ======= New Chart 4 Script =======
fetch('chart4_data_after_date_split.json')
  .then(res => res.json())
  .then(data => {
    // === Trend Chart Data ===
    const labels = data.trend.map(item => item.date);
    const values = data.trend.map(item => item.impacted_customers);

    const ctx = document.getElementById('proactiveChart').getContext('2d');

    // Gradient fill (pink glow effect)
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(248, 16, 248, 0.4)'); // top - pinkish
    gradient.addColorStop(1, 'rgba(0,0,0,0)');           // bottom - transparent

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Impacted Customers',
          data: values,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#ab32abff',  // neon pink line
          borderWidth: 3,
          pointRadius: 0,           // keep points hidden
          tension: 0.4              // smooth curve
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#cccccc',
              callback: function(value, index) {
                return index % 5 === 0 ? this.getLabelForValue(value) : '';
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: '#cccccc' }
          }
        }
      }
    });

    // === Summary Values ===
    const totalImpactedValue = document.getElementById('totalImpacted');
    const impactedBeforeValue = document.getElementById('impactedBefore');
    const restoredBeforeValue = document.getElementById('restoredBefore');
    const impactedAfterValue = document.getElementById('impactedAfter');
    const restoredAfterValue = document.getElementById('restoredAfter');

    // Set values from data
    totalImpactedValue.textContent = data.summary.total_impacted_customers.toLocaleString();
    impactedBeforeValue.textContent = data.summary.impacted_before_10;
    restoredBeforeValue.textContent = data.summary.restored_before_10;
    impactedAfterValue.textContent = data.summary.impacted_after_10;
    restoredAfterValue.textContent = data.summary.restored_after_10;

    // Remove old classes (from values only)
    [totalImpactedValue, impactedBeforeValue, restoredBeforeValue, impactedAfterValue, restoredAfterValue]
        .forEach(val => val.classList.remove('normal','warning','critical'));

    // Apply new color classes based on thresholds
    if (data.summary.total_impacted_customers > 1000) {
        totalImpactedValue.classList.add('critical');
    } else if (data.summary.total_impacted_customers > 500) {
        totalImpactedValue.classList.add('warning');
    } else {
        totalImpactedValue.classList.add('normal');
    }

    if (data.summary.impacted_before_10 > 500) {
        impactedBeforeValue.classList.add('critical');
    } else {
        impactedBeforeValue.classList.add('normal');
    }

    restoredBeforeValue.classList.add('normal');

    if (data.summary.impacted_after_10 > 500) {
        impactedAfterValue.classList.add('critical');
    } else {
        impactedAfterValue.classList.add('normal');
    }

    restoredAfterValue.classList.add('normal');
  })
  .catch(err => console.error('Error loading proactive chart data', err));



  // ===== Apps Traffic Status =====
fetch('apps_status.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('appsContainer');
    container.innerHTML = '';

    data.applications.forEach(app => {
      const card = document.createElement('div');
      card.className = 'app-card';

      const icon = document.createElement('i');
      icon.className = app.icon;

      // App name with status circle
      const nameWrapper = document.createElement('div');
      nameWrapper.className = 'app-name';

      const statusCircle = document.createElement('span');
      statusCircle.className = `status-circle ${app.status.toLowerCase()}`;

      const nameText = document.createElement('span');
      nameText.textContent = app.name;

      nameWrapper.appendChild(nameText);
      nameWrapper.appendChild(statusCircle);

      card.appendChild(icon);
      card.appendChild(nameWrapper);

      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading app statuses', err));



  // journey
  fetch('task_referral_dashboard_data.json')
    .then(res => res.json())
    .then(data => {
      const normalizeId = id => id.replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();

      // Normalize team IDs
      const nodes = data.teams.map(team => ({
        ...team,
        id: normalizeId(team.id)
      }));

      // Normalize link endpoints
      const links = data.referral_links.map(link => ({
        ...link,
        source: normalizeId(link.source),
        target: normalizeId(link.target)
      }));

      const container = document.getElementById('journey-nodes');
      const svg = document.getElementById('journey-svg');

      function drawSmoothCurve(src, tgt) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const offset = dx * 0.4;
        const controlX1 = src.x + offset;
        const controlY1 = src.y;
        const controlX2 = tgt.x - offset;
        const controlY2 = tgt.y;
        return `M${src.x},${src.y} C${controlX1},${controlY1} ${controlX2},${controlY2} ${tgt.x},${tgt.y}`;
      }

      function render() {
        container.innerHTML = '';
        svg.innerHTML = '';

        // --- Dynamic scaling based on container width ---
        const containerWidth = document.querySelector('.journey-container').clientWidth;
        const scale = Math.min(1, containerWidth / 800); // adjust "900" if needed

        const cardWidth = 155 * scale;
        const cardHeight = 80 * scale;
        const specialHeight = cardHeight * 6.7; // Equal height for Filtration and IVRF
        const colGap = cardWidth * 1.6;
        const rowGap = 40 * scale;

        // Columns: dynamically generated
        const col1 = [normalizeId('Filtration')];
        const col2 = [];
        const col3 = [];

        // Find all direct Filtration targets
        links.forEach(link => {
          if (link.source === normalizeId('Filtration') && !col2.includes(link.target)) {
            col2.push(link.target);
          }
        });

        // Targets of col2 nodes
        links.forEach(link => {
          if (col2.includes(link.source) && !col3.includes(link.target) && !col1.includes(link.target)) {
            col3.push(link.target);
          }
        });

        // Any remaining nodes go to col3
        nodes.forEach(node => {
          if (![...col1, ...col2, ...col3].includes(node.id)) {
            col3.push(node.id);
          }
        });

        const columns = [col1, col2, col3];
        const nodePositions = {};

        // Calculate overall height
        let allHeights = 0;
        columns.forEach(col => {
          const colHeight = col.reduce((sum, nodeId) =>
            sum + ((nodeId === normalizeId('Filtration') || nodeId === normalizeId('IVRF')) ? specialHeight : cardHeight) + rowGap, -rowGap
          );
          allHeights = Math.max(allHeights, colHeight);
        });

        const totalWidth = (columns.length - 1) * colGap + cardWidth;
        const xOffset = (containerWidth - totalWidth) / 2;
        const globalStartY = 50;

        // Render cards
        columns.forEach((col, colIndex) => {
          const colHeight = col.reduce((sum, nodeId) =>
            sum + ((nodeId === normalizeId('Filtration') || nodeId === normalizeId('IVRF')) ? specialHeight : cardHeight) + rowGap, -rowGap
          );
          const startY = globalStartY + (allHeights - colHeight) / 2;
          const x = colIndex * colGap + xOffset;

          col.forEach((nodeId, rowIndex) => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            const nodeHeight = (nodeId === normalizeId('Filtration') || nodeId === normalizeId('IVRF')) 
              ? specialHeight 
              : cardHeight;

            // --- Add margin offset for special height nodes so links connect at center ---
            let y = startY + rowIndex * (cardHeight + rowGap);
            if (nodeId === normalizeId('Filtration') || nodeId === normalizeId('IVRF')) {
              y += (specialHeight - cardHeight) / 9;  // push it down half of extra height
            }

            nodePositions[nodeId] = { x: x + cardWidth / 2, y: y + nodeHeight / 2 };

            const card = document.createElement('div');
            card.className = `journey-card ${node.efficiency_status_hour}`;
            card.style.width = `${cardWidth}px`;
            card.style.height = `${nodeHeight}px`;
            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            card.style.transform = `scale(${scale})`;
            card.style.transformOrigin = "top left";
            card.innerHTML = `
              <div class="title">${node.name}</div>
              <div class="metrics">
                <div class="circle-number">
                  <i class="fas fa-external-link-alt"></i>
                  ${node.referral_count}
                </div>
                <div class="circle-number">
                  <i class="fas fa-share-alt"></i>
                  ${node.active_referrals}
                </div>
              </div>
            `;
            container.appendChild(card);
          });
        });

        // Gradient for links
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        grad.id = 'linkGradient';
        grad.setAttribute('x1', '0%');
        grad.setAttribute('y1', '0%');
        grad.setAttribute('x2', '100%');
        grad.setAttribute('y2', '0%');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', '#00BCEB');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', '#3dd6e4');

        grad.appendChild(stop1);
        grad.appendChild(stop2);
        defs.appendChild(grad);
        svg.appendChild(defs);

        // Draw all links
        links.forEach(link => {
          const src = nodePositions[link.source];
          const tgt = nodePositions[link.target];
          if (!src || !tgt) return;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', drawSmoothCurve(src, tgt));
          path.setAttribute('stroke', 'url(#linkGradient)');
          path.setAttribute('stroke-width', Math.max(2, (link.referrals / 10) * scale));
          path.setAttribute('fill', 'none');
          path.classList.add('link-path');
          svg.appendChild(path);
        });

        adjustJourneyHeight();
      }

      function adjustJourneyHeight() {
        const journeyContainer = document.querySelector('.journey-container');
        const cards = document.querySelectorAll('#journey-nodes .journey-card');
        if (cards.length === 0) return;

        let maxBottom = 0;
        cards.forEach(card => {
          const bottom = card.offsetTop + card.offsetHeight;
          if (bottom > maxBottom) maxBottom = bottom;
        });

        journeyContainer.style.height = (maxBottom - 70) + 'px';
      }

      window.addEventListener('resize', render);
      render();
    })
    .catch(err => console.error('Error loading journey data', err));


  // ===== E2E Path from JSON =====
fetch('e2e.json')
  .then(res => res.json())
  .then(data => {
    data.network_events.forEach(node => {
      const el = document.getElementById(node.name);
      if (!el) return;

      el.classList.remove('green', 'yellow', 'red');
      switch (node.status) {
        case 'critical': el.classList.add('red'); break;
        case 'warning': el.classList.add('yellow'); break;
        default: el.classList.add('green'); break;
      }
    });
    drawLinks();
  })
  .catch(err => console.error('Error loading e2e data', err));

function drawLinks() {
  const svg = document.getElementById('e2eLinks');
  svg.innerHTML = '';

  const container = document.getElementById('e2ePath');
  const containerRect = container.getBoundingClientRect();

  const getPos = id => {
    const el = document.getElementById(id);
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };

  const links = [
    ['IGW', 'BRAS'],
    ['BRAS', 'MPLS'],
    ['MPLS', 'OLT'],
    ['MPLS', 'NNI']
  ];

  links.forEach(([srcId, tgtId]) => {
    const p1 = getPos(srcId);
    const p2 = getPos(tgtId);

    // Use different control points for branch links
    const controlX = (p1.x + p2.x) / 2;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // If branching (MPLS → OLT or NNI), add curvature vertically
    if (srcId === 'MPLS' && (tgtId === 'OLT' || tgtId === 'NNI')) {
      path.setAttribute(
        'd',
        `M${p1.x},${p1.y} C${p1.x + 50},${p1.y} ${p2.x - 50},${p2.y} ${p2.x},${p2.y}`
      );
    } else {
      // Straight line with slight curve
      path.setAttribute(
        'd',
        `M${p1.x},${p1.y} C${controlX},${p1.y} ${controlX},${p2.y} ${p2.x},${p2.y}`
      );
    }

    path.setAttribute('stroke', '#44c1f7');
    path.setAttribute('stroke-width', 3);
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
  });
}

window.addEventListener('resize', drawLinks);
