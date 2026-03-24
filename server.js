const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/sales', (req, res) => {
    const results = [];
    const dataPath = path.join(__dirname, 'data', 'ev_sales_data.csv');
    
    if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ error: 'Data file not found. Please run generate_data.js' });
    }

    fs.createReadStream(dataPath)
        .pipe(csv())
        .on('data', (data) => results.push({
            Date: data.Date,
            Year: parseInt(data.Year, 10),
            Region: data.Region,
            Manufacturer: data.Manufacturer,
            Powertrain: data.Powertrain,
            Sales: parseInt(data.Sales, 10)
        }))
        .on('end', () => {
             // Sort by date just to be consistent
            results.sort((a, b) => new Date(a.Date) - new Date(b.Date));
            res.json(results);
        })
        .on('error', (err) => {
             console.error('Error reading CSV:', err);
             res.status(500).json({ error: 'Failed to read data' });
        });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
