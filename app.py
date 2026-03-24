import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Configure the page layout and title
st.set_page_config(
    page_title="EV Sales Analytics",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Premium Aesthetic Setup: CSS for custom styling
st.markdown("""
<style>
    /* Main background */
    .stApp {
        background-color: #0d1117;
        color: #c9d1d9;
    }
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #161b22;
    }
    /* Headers */
    h1, h2, h3 {
        color: #58a6ff !important;
        font-family: 'Inter', sans-serif;
    }
    /* Metric Cards */
    [data-testid="stMetricValue"] {
        color: #3fb950;
        font-size: 2.5rem;
        font-weight: 700;
    }
    /* Custom divider */
    hr {
        border-top: 1px solid #30363d;
    }
    /* Smooth transitions */
    .stSelectbox, .stMultiSelect {
        transition: all 0.3s ease;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data():
    try:
        df = pd.read_csv('data/ev_sales_data.csv')
        return df
    except FileNotFoundError:
        st.error("Data file not found. Please ensure `generate_data.py` has run successfully.")
        return pd.DataFrame()

df = load_data()

if df.empty:
    st.stop()

# --- SIDEBAR ---
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/3135/3135715.png", width=60)
    st.title("Filters & Controls")
    
    years = sorted(df['Year'].unique())
    selected_years = st.slider("Select Year Range", min_value=min(years), max_value=max(years), value=(min(years), max(years)))
    
    regions = ['All'] + sorted(df['Region'].unique().tolist())
    selected_region = st.selectbox("Select Region", regions)
    
    powertrain_options = ['All'] + sorted(df['Powertrain'].unique().tolist())
    selected_powertrain = st.selectbox("Powertrain Type", powertrain_options)

    st.markdown("---")
    st.markdown("**About this Dashboard:**")
    st.info("This interactive dashboard provides insights into Electric Vehicle (EV) sales growth, market share distributions, and regional trends over the last decade.")

# --- DATA FILTERING ---
filtered_df = df[
    (df['Year'] >= selected_years[0]) & 
    (df['Year'] <= selected_years[1])
]

if selected_region != 'All':
    filtered_df = filtered_df[filtered_df['Region'] == selected_region]

if selected_powertrain != 'All':
    filtered_df = filtered_df[filtered_df['Powertrain'] == selected_powertrain]

# --- MAIN DASHBOARD ---
st.title("⚡ Electric Vehicle (EV) Market Analytics")
st.markdown("An interactive overview of global EV adoption, regional dominances, and manufacturer performances.")

# Hero Metrics
total_sales = filtered_df['Sales'].sum()
avg_yearly_sales = total_sales / (selected_years[1] - selected_years[0] + 1) if selected_years[1] > selected_years[0] else total_sales
top_region = filtered_df.groupby('Region')['Sales'].sum().idxmax() if not filtered_df.empty else "N/A"
top_manufacturer = filtered_df.groupby('Manufacturer')['Sales'].sum().idxmax() if not filtered_df.empty else "N/A"

col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Total EV Sales", f"{total_sales:,.0f}")
with col2:
    st.metric("Avg Yearly Sales", f"{avg_yearly_sales:,.0f}")
with col3:
    st.metric("Top Region", top_region)
with col4:
    st.metric("Top Manufacturer", top_manufacturer)

st.markdown("---")

# Yearly Trend Line Chart
st.subheader("📈 Global Ev Sales Trends Over Time")
yearly_trend = filtered_df.groupby('Year')['Sales'].sum().reset_index()
fig_trend = px.area(yearly_trend, x="Year", y="Sales", color_discrete_sequence=['#58a6ff'], markers=True)
fig_trend.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font_color="#c9d1d9",
    xaxis=dict(showgrid=False),
    yaxis=dict(showgrid=True, gridcolor='#30363d')
)
st.plotly_chart(fig_trend, use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)

col_a, col_b = st.columns(2)

with col_a:
    # Market Share by Manufacturer (Donut Chart)
    st.subheader("🏆 Market Share by Manufacturer")
    manufacturer_sales = filtered_df.groupby('Manufacturer')['Sales'].sum().reset_index()
    fig_donut = px.pie(manufacturer_sales, values='Sales', names='Manufacturer', hole=0.4,
                       color_discrete_sequence=px.colors.qualitative.Prism)
    fig_donut.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#c9d1d9"
    )
    st.plotly_chart(fig_donut, use_container_width=True)

with col_b:
    # Powertrain Distribution (Bar Chart)
    st.subheader("🔋 Powertrain Adoption (BEV vs PHEV)")
    powertrain_sales = filtered_df.groupby(['Year', 'Powertrain'])['Sales'].sum().reset_index()
    fig_bar = px.bar(powertrain_sales, x="Year", y="Sales", color="Powertrain", barmode='group',
                     color_discrete_map={'BEV': '#3fb950', 'PHEV': '#d1d5da'})
    fig_bar.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#c9d1d9",
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=True, gridcolor='#30363d')
    )
    st.plotly_chart(fig_bar, use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)

# Regional Growth over Time
st.subheader("🌍 Regional Growth Trends")
regional_trend = filtered_df.groupby(['Year', 'Region'])['Sales'].sum().reset_index()
fig_area = px.line(regional_trend, x="Year", y="Sales", color="Region", markers=True,
                   color_discrete_sequence=px.colors.qualitative.Pastel)
fig_area.update_layout(
    plot_bgcolor="rgba(0,0,0,0)",
    paper_bgcolor="rgba(0,0,0,0)",
    font_color="#c9d1d9",
    xaxis=dict(showgrid=False),
    yaxis=dict(showgrid=True, gridcolor='#30363d')
)
st.plotly_chart(fig_area, use_container_width=True)

st.markdown("---")
st.markdown("<p style='text-align: center; color: #8b949e;'>Built with Modern Data Engineering • Powered by Streamlit</p>", unsafe_allow_html=True)
