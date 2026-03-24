import pandas as pd
import numpy as np
import os

# Create required directories
os.makedirs('data', exist_ok=True)

# Set random seed for reproducibility
np.random.seed(42)

# Goal: Generate approximately 10,000 rows of data.
N = 10000

# 1. Generate random dates between 2015-01-01 and 2025-12-31
start_date = np.datetime64('2015-01-01')
end_date = np.datetime64('2025-12-31')
date_range = (end_date - start_date).astype(int)
random_days = np.random.randint(0, date_range, size=N)
dates = start_date + random_days

# Extract Year for Streamlit dashboard compatibility
years = pd.to_datetime(dates).year

# 2. Assign Regions
regions = np.random.choice(
    ['North America', 'Europe', 'China', 'Rest of World'], 
    size=N, 
    p=[0.25, 0.3, 0.4, 0.05]
)

# 3. Assign Manufacturers
manufacturers = np.random.choice(
    ['Tesla', 'BYD', 'Volkswagen', 'Hyundai', 'General Motors', 'Ford', 'NIO', 'Rivian', 'Others'], 
    size=N
)

# 4. Assign Powertrain
powertrains = np.random.choice(['BEV', 'PHEV'], size=N, p=[0.75, 0.25])

# 5. Assign Sales volume per record (batch size)
# To keep the realistic exponential growth trend over the years:
growth_factor = 1.35 ** (years - 2015)
base_sales = np.random.randint(5, 50, size=N)

# Apply manufacturer multipliers based on region and year
maker_bias = np.ones(N)
for i in range(N):
    y = years[i]
    r = regions[i]
    m = manufacturers[i]
    b = 1.0
    
    if m == 'Tesla' and r in ['North America', 'Europe']: b *= 2.5
    elif m == 'BYD' and r == 'China': b *= 3.0
    elif m in ['Volkswagen', 'General Motors', 'Ford'] and r in ['Europe', 'North America']: b *= 1.8
    elif m == 'NIO' and r == 'China': b *= 1.5
    elif m == 'Rivian' and r == 'North America' and y >= 2021: b *= 1.5
    elif m in ['Rivian', 'NIO'] and y < 2018: b *= 0.1
    
    maker_bias[i] = b

final_sales = (base_sales * growth_factor * maker_bias).astype(int)
# Ensure at least 1 sale
final_sales = np.where(final_sales < 1, 1, final_sales)

df = pd.DataFrame({
    'Date': dates,
    'Year': years,
    'Region': regions,
    'Manufacturer': manufacturers,
    'Powertrain': powertrains,
    'Sales': final_sales
})

# Sort chronologically
df = df.sort_values('Date')

# Export to CSV
df.to_csv('data/ev_sales_data.csv', index=False)
print(f"Dataset successfully updated with {len(df)} rows at data/ev_sales_data.csv")
