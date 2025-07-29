// Existing Chart 1 Script (unchanged)
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
    const zoomMin = 0;
    const zoomMax = maxVal * 1.1;

    const bars = labels.map((label) => {
      if (label.includes("School Start Week") && label.includes("Day 1")) {
        return avgValue * 1.4;
      } else if (label.includes("Day 1")) {
        return avgValue * 0.8;
      } else {
        return 0;
      }
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
        ctx.fillStyle = '#0f1e38';   // dark background
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();
      }
    };

    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          { label: 'Start', type: 'bar', data: bars, backgroundColor: 'rgba(220,220,220,0.8)', barThickness: 4 },
          { label: '2022', type: 'line', data: year2022, borderColor: '#f1c40f', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2023', type: 'line', data: year2023, borderColor: '#3498db', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2024', type: 'line', data: year2024, borderColor: '#9b59b6', fill: false, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 },
          { label: '2025 Actual', type: 'line', data: year2025Actual, borderColor: '#2ecc71', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.3 },
          { label: '2025 Prediction', type: 'line', data: year2025Prediction, borderColor: '#e74c3c', borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, fill: false, borderDash: [5, 5], tension: 0.3 },
          { label: '2025 Average', type: 'line', data: avgLine, borderColor: '#ecf0f1', borderDash: [3, 3], fill: false, borderWidth: 1, pointRadius: 0, pointHoverRadius: 5, tension: 0.3 }
        ]
      },
      options: {
        responsive: true,
        layout: { padding: 20 },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { font: { size: 8 }, color: '#ffffff' } },
          title: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { drawOnChartArea: false, color: '#555' },
            ticks: {
              color: '#ffffff',   // white axis text
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
            min: zoomMin,
            max: zoomMax
          }
        }
      },
      plugins: [chartBackground]
    });
  })
  .catch(err => console.error('Error loading data', err));



// ======= New Script for Hourly Metrics =======
async function updateMetrics() {
    try {
        const response = await fetch('chart2_dynamic.json?ts=' + Date.now());
        const data = await response.json();

        // Current Egypt time
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));

        // Find latest record <= current time
        let latestRecord = data.records[0];
        for (let record of data.records) {
            const recordTime = new Date(record.datetime);
            if (recordTime <= now) {
                latestRecord = record;
            }
        }

        // Update metric boxes
        for (const key in latestRecord) {
            if (key === "datetime") continue;
            const box = document.getElementById(key);
            if (!box) continue;

            const metric = latestRecord[key];
            const value = metric.value;

            // Display value (no unnecessary decimals)
            box.querySelector('.value').textContent = Number.isInteger(value) ? value : value.toFixed(2);

            // Apply color based on status
            box.classList.remove('normal', 'warning', 'critical');
            box.classList.add(metric.status.toLowerCase());
        }
    } catch (error) {
        console.error("Error fetching metrics:", error);
    }
}

// Auto-refresh every minute
setInterval(updateMetrics, 60000);
updateMetrics();

//===========================================================
// ======= New Chart 4 Script =======
fetch('chart4_data_after_date_split.json')
  .then(res => res.json())
  .then(data => {
    // Trend Chart Data
    const labels = data.trend.map(item => item.date);
    const values = data.trend.map(item => item.impacted_customers);

    const ctx = document.getElementById('proactiveChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Impacted Customers',
          data: values,
          fill: true,
          backgroundColor: 'rgba(255,0,0,0.1)',
          borderColor: '#ff0000',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.3
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
              callback: function(value, index) {
                return index % 5 === 0 ? this.getLabelForValue(value) : '';
              }
            }
          },
          y: { beginAtZero: true, grid: { drawOnChartArea: false } }
        }
      }
    });

    // Summary values
    document.getElementById('totalImpacted').textContent = data.summary.total_impacted_customers.toLocaleString();
    document.getElementById('impactedBefore').textContent = data.summary.impacted_before_10;
    document.getElementById('restoredBefore').textContent = data.summary.restored_before_10;
    document.getElementById('impactedAfter').textContent = data.summary.impacted_after_10;
    document.getElementById('restoredAfter').textContent = data.summary.restored_after_10;
  });

  // ===== Apps Traffic Status =====
// ===== Apps Traffic Status =====
fetch('apps_status.json')
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('appsContainer');
    container.innerHTML = '';

    data.applications.forEach(app => {
      const card = document.createElement('div');
      card.className = `app-card ${app.status.toLowerCase()}`;

      const icon = document.createElement('i');
      icon.className = app.icon;

      const name = document.createElement('div');
      name.className = 'app-name';
      name.textContent = app.name;

      card.appendChild(icon);
      card.appendChild(name);

      container.appendChild(card);
    });
  })
  .catch(err => console.error('Error loading app statuses', err));

  //========================================================================

  // ===== E2E Path from JSON =====
// ===== E2E Path from JSON =====
fetch('e2e.json')
  .then(res => res.json())
  .then(data => {
    data.network_events.forEach(node => {
      const el = document.getElementById(node.name);
      if (!el) return;

      // Remove old colors and apply based on status
      el.classList.remove('green', 'yellow', 'red');

      switch (node.status) {
        case 'critical':
          el.classList.add('red');
          break;
        case 'warning':
          el.classList.add('yellow');
          break;
        default:
          el.classList.add('green');
          break;
      }
    });
  })
  .catch(err => console.error('Error loading e2e data', err));

  

//   fetch('heatmap.json?ts=' + Date.now())
//   .then(res => res.json())
//   .then(data => {
//     const tooltip = document.getElementById('mapTooltip');

//     data.heat_map.forEach(region => {
//       const el = document.getElementById(region.district);
//       if (!el) return;

//       // remove old classes
//       el.classList.remove('region-normal', 'region-warning', 'region-critical');

//       switch (region.comparison_flag.toLowerCase()) {
//         case 'critical': el.classList.add('region-critical'); break;
//         case 'warning': el.classList.add('region-warning'); break;
//         default: el.classList.add('region-normal');
//       }

//       // tooltip events
//       el.addEventListener('mousemove', (e) => {
//         tooltip.style.left = e.pageX + 15 + 'px';
//         tooltip.style.top = e.pageY + 15 + 'px';
//         tooltip.style.display = 'block';
//         tooltip.innerHTML = `<b>${region.district}</b><br>${region.count_of_complaints} complaints`;
//       });
//       el.addEventListener('mouseleave', () => tooltip.style.display = 'none');
//     });
//   })
//   .catch(err => console.error('Error loading heatmap data', err));

