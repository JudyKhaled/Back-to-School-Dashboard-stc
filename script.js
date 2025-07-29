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

    // Flatten JSON
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

    // Find last actual index
    const lastActualIndex = source.lastIndexOf('actual');

    // Build 2025 Actual dataset
    const year2025Actual = year2025.map((v, i) => source[i] === 'actual' ? v : null);

    // Build 2025 Prediction dataset starting from last actual point
    const year2025Prediction = year2025.map((v, i) => {
      if (i < lastActualIndex) return null;
      if (i === lastActualIndex) return year2025[lastActualIndex];
      return source[i] === 'prediction' ? v : null;
    });

    // Determine zoom (Y-axis starts at 0)
    const allValues = [...year2022, ...year2023, ...year2024, ...year2025].filter(v => v != null);
    const maxVal = Math.max(...allValues);
    const zoomMin = 0; // always start at zero
    const zoomMax = maxVal * 1.1; // 10% padding on top

    // Bars
    const bars = labels.map((label) => {
      if (label.includes("School Start Week") && label.includes("Day 1")) {
        return avgValue * 1.4;
      } else if (label.includes("Day 1")) {
        return avgValue * 0.8;
      } else {
        return 0;
      }
    });

    // Week abbreviations
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

    // Plugin for gray background
    const chartBackground = {
      id: 'chartBackground',
      beforeDraw: (chart) => {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.fillStyle = '#f2f2f2'; // light gray
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
        ctx.restore();
      }
    };

    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          { 
            label: 'Start', 
            type: 'bar', 
            data: bars, 
            backgroundColor: 'rgba(1, 3, 69, 0.64)', 
            barThickness: 4 
          },
          { 
            label: '2022', 
            type: 'line', 
            data: year2022, 
            borderColor: '#dcb48c', 
            fill: false, 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            tension: 0.3 
          },
          { 
            label: '2023', 
            type: 'line', 
            data: year2023, 
            borderColor: '#5bb0ff', 
            fill: false, 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            tension: 0.3 
          },
          { 
            label: '2024', 
            type: 'line', 
            data: year2024, 
            borderColor: '#9834b1ff', 
            fill: false, 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            tension: 0.3 
          },
          { 
            label: '2025 Actual', 
            type: 'line', 
            data: year2025Actual, 
            borderColor: '#7bbf4d', 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            fill: false, 
            tension: 0.3 
          },
          { 
            label: '2025 Prediction', 
            type: 'line', 
            data: year2025Prediction, 
            borderColor: '#ff0000', 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            fill: false, 
            borderDash: [5, 5], 
            tension: 0.3 
          },
          { 
            label: '2025 Average', 
            type: 'line', 
            data: avgLine, 
            borderColor: '#555', 
            borderDash: [3, 3], 
            fill: false, 
            borderWidth: 1, 
            pointRadius: 0, 
            pointHoverRadius: 5, 
            tension: 0.3 
          }
        ]
      },
      options: {
        responsive: true,
        layout: { padding: 20 },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { font: { size: 8 } }
          },
          title: { display: false },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { drawOnChartArea: false },
            ticks: {
              font: { size: 8 },
              callback: (value, index) =>
                labels[index].includes("Day 1") ? abbreviateWeek(weekLabels[index]) : '',
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false
            }
          },
          y: {
            grid: { drawOnChartArea: false },
            min: zoomMin,
            max: zoomMax,
            ticks: { font: { size: 8 } }
          }
        }
      },
      plugins: [chartBackground]
    });
  })
  .catch(err => console.error('Error loading data', err));
