const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dir = path.join(__dirname, 'data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const N = 10000;
const startDate = new Date('2015-01-01');
const endDate = new Date('2025-12-31');
const dateRange = endDate.getTime() - startDate.getTime();

const regionsDist = [
    { name: 'North America', prob: 0.25 },
    { name: 'Europe', prob: 0.30 },
    { name: 'China', prob: 0.40 },
    { name: 'Rest of World', prob: 0.05 }
];

const manufacturers = ['Tesla', 'BYD', 'Volkswagen', 'Hyundai', 'General Motors', 'Ford', 'NIO', 'Rivian', 'Others'];

function getRandomRegion() {
    let r = Math.random();
    let sum = 0;
    for (let i = 0; i < regionsDist.length; i++) {
        sum += regionsDist[i].prob;
        if (r <= sum) return regionsDist[i].name;
    }
    return 'Rest of World';
}

function getRandomManufacturer() {
    return manufacturers[Math.floor(Math.random() * manufacturers.length)];
}

const stream = fs.createWriteStream(path.join(dir, 'ev_sales_data.csv'));
stream.write('Date,Year,Region,Manufacturer,Powertrain,Sales\n');

for (let i = 0; i < N; i++) {
    const randomTime = startDate.getTime() + Math.random() * dateRange;
    const date = new Date(randomTime);
    const year = date.getFullYear();
    const formattedDate = date.toISOString().split('T')[0];
    
    const region = getRandomRegion();
    const manufacturer = getRandomManufacturer();
    const powertrain = Math.random() < 0.75 ? 'BEV' : 'PHEV';
    
    const growthFactor = Math.pow(1.35, year - 2015);
    let baseSales = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
    
    let b = 1.0;
    if (manufacturer === 'Tesla' && ['North America', 'Europe'].includes(region)) b *= 2.5;
    else if (manufacturer === 'BYD' && region === 'China') b *= 3.0;
    else if (['Volkswagen', 'General Motors', 'Ford'].includes(manufacturer) && ['Europe', 'North America'].includes(region)) b *= 1.8;
    else if (manufacturer === 'NIO' && region === 'China') b *= 1.5;
    else if (manufacturer === 'Rivian' && region === 'North America' && year >= 2021) b *= 1.5;
    else if (['Rivian', 'NIO'].includes(manufacturer) && year < 2018) b *= 0.1;
    
    let finalSales = Math.floor(baseSales * growthFactor * b);
    if (finalSales < 1) finalSales = 1;
    
    stream.write(`${formattedDate},${year},${region},${manufacturer},${powertrain},${finalSales}\n`);
}

stream.end();
console.log(`Dataset successfully updated with ${N} rows at data/ev_sales_data.csv`);
