let rawData = [];
let charts = {};

// Chart Setup Options
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "'Inter', sans-serif";

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#c9d1d9' } }
    },
    scales: {
        x: { 
            grid: { display: false, color: '#30363d' },
            ticks: { color: '#8b949e' }
        },
        y: { 
            grid: { color: '#30363d' },
            ticks: { color: '#8b949e' }
        }
    }
};

document.addEventListener("DOMContentLoaded", async () => {
    await fetchData();
    populateFilters();
    setupEventListeners();
    updateDashboard();
});

async function fetchData() {
    try {
        const res = await fetch('/api/sales');
        if (!res.ok) throw new Error("Failed to fetch data");
        rawData = await res.json();
    } catch (err) {
        console.error(err);
        document.getElementById("metric-total").textContent = "Error";
    }
}

function populateFilters() {
    const years = [...new Set(rawData.map(d => d.Year))].sort();
    const regions = [...new Set(rawData.map(d => d.Region))].sort();
    const powertrains = [...new Set(rawData.map(d => d.Powertrain))].sort();

    const yearSelect = document.getElementById("year-select");
    years.forEach(y => yearSelect.add(new Option(y, y)));

    const regionSelect = document.getElementById("region-select");
    regions.forEach(r => regionSelect.add(new Option(r, r)));

    const ptSelect = document.getElementById("powertrain-select");
    powertrains.forEach(p => ptSelect.add(new Option(p, p)));
}

function setupEventListeners() {
    document.getElementById("year-select").addEventListener("change", updateDashboard);
    document.getElementById("region-select").addEventListener("change", updateDashboard);
    document.getElementById("powertrain-select").addEventListener("change", updateDashboard);
}

function getFilteredData() {
    const selectedYear = document.getElementById("year-select").value;
    const selectedRegion = document.getElementById("region-select").value;
    const selectedPT = document.getElementById("powertrain-select").value;

    return rawData.filter(d => {
        let match = true;
        if (selectedYear !== "All" && d.Year != selectedYear) match = false;
        if (selectedRegion !== "All" && d.Region !== selectedRegion) match = false;
        if (selectedPT !== "All" && d.Powertrain !== selectedPT) match = false;
        return match;
    });
}

function updateDashboard() {
    const data = getFilteredData();
    if (data.length === 0) return;

    // Update Metrics
    const totalSales = data.reduce((acc, curr) => acc + curr.Sales, 0);
    const yearsSelected = document.getElementById("year-select").value;
    
    // Distinct years in the filtered data
    const distinctYearsCount = new Set(data.map(d => d.Year)).size || 1;
    const avgSales = Math.round(totalSales / distinctYearsCount);
    
    // Grouping for top metrics
    const regionSales = {};
    const makerSales = {};
    data.forEach(d => {
        regionSales[d.Region] = (regionSales[d.Region] || 0) + d.Sales;
        makerSales[d.Manufacturer] = (makerSales[d.Manufacturer] || 0) + d.Sales;
    });
    
    const topRegion = Object.keys(regionSales).reduce((a, b) => regionSales[a] > regionSales[b] ? a : b, "-");
    const topMaker = Object.keys(makerSales).reduce((a, b) => makerSales[a] > makerSales[b] ? a : b, "-");

    document.getElementById("metric-total").textContent = totalSales.toLocaleString();
    document.getElementById("metric-avg").textContent = avgSales.toLocaleString();
    document.getElementById("metric-region").textContent = topRegion;
    document.getElementById("metric-maker").textContent = topMaker;

    // Update Charts
    updateTrendChart(data);
    updateDonutChart(makerSales);
    updateBarChart(data);
    updateRegionalChart(data);
}

// ---------------- CHART UPDATERS ---------------- //

function updateTrendChart(data) {
    const yearGrouping = {};
    data.forEach(d => {
        yearGrouping[d.Year] = (yearGrouping[d.Year] || 0) + d.Sales;
    });
    
    const years = Object.keys(yearGrouping).sort();
    const sales = years.map(y => yearGrouping[y]);

    if(charts.trend) charts.trend.destroy();
    
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Create gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(88, 166, 255, 0.5)');   
    gradient.addColorStop(1, 'rgba(88, 166, 255, 0)');

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Global Sales',
                data: sales,
                borderColor: '#58a6ff',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0d1117',
                pointBorderColor: '#58a6ff',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: commonOptions
    });
}

function updateDonutChart(makerSalesObj) {
    const labels = Object.keys(makerSalesObj).sort();
    const values = labels.map(l => makerSalesObj[l]);
    
    const colors = ['#238636', '#8957e5', '#d2a8ff', '#f0883e', '#58a6ff', '#e34c26', '#1f6feb', '#3fb950', '#8b949e'];

    if(charts.donut) charts.donut.destroy();
    charts.donut = new Chart(document.getElementById('donutChart'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'right', labels: { color: '#c9d1d9', boxWidth: 12 } }
            }
        }
    });
}

function updateBarChart(data) {
    const yearPtGrouping = {};
    data.forEach(d => {
        if(!yearPtGrouping[d.Year]) yearPtGrouping[d.Year] = { BEV: 0, PHEV: 0 };
        yearPtGrouping[d.Year][d.Powertrain] = (yearPtGrouping[d.Year][d.Powertrain] || 0) + d.Sales;
    });
    
    const years = Object.keys(yearPtGrouping).sort();
    const bevSales = years.map(y => yearPtGrouping[y].BEV || 0);
    const phevSales = years.map(y => yearPtGrouping[y].PHEV || 0);

    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'BEV',
                    data: bevSales,
                    backgroundColor: '#3fb950',
                    borderRadius: 4
                },
                {
                    label: 'PHEV',
                    data: phevSales,
                    backgroundColor: '#d1d5da',
                    borderRadius: 4
                }
            ]
        },
        options: {
            ...commonOptions,
            interaction: { mode: 'index', intersect: false }
        }
    });
}

function updateRegionalChart(data) {
     const yearRegGrouping = {};
     const regionsSet = new Set();
     
     data.forEach(d => {
         if(!yearRegGrouping[d.Year]) yearRegGrouping[d.Year] = {};
         yearRegGrouping[d.Year][d.Region] = (yearRegGrouping[d.Year][d.Region] || 0) + d.Sales;
         regionsSet.add(d.Region);
     });
     
     const years = Object.keys(yearRegGrouping).sort();
     const regions = Array.from(regionsSet).sort();
     const colors = ['#f85149', '#58a6ff', '#3fb950', '#bc8cff', '#d2a8ff']; // Distinct colors for regions
     
     const datasets = regions.map((r, i) => {
         return {
             label: r,
             data: years.map(y => yearRegGrouping[y][r] || 0),
             borderColor: colors[i % colors.length],
             backgroundColor: 'transparent',
             borderWidth: 2,
             tension: 0.3,
             pointRadius: 3
         };
     });

     if(charts.regional) charts.regional.destroy();
     charts.regional = new Chart(document.getElementById('regionalChart'), {
         type: 'line',
         data: {
             labels: years,
             datasets: datasets
         },
         options: {
             ...commonOptions,
             interaction: { mode: 'index', intersect: false }
         }
     });
}
