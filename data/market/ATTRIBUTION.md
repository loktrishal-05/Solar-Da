# Market price data

`onion_bangalore_weekly.csv` is derived (weekly median of daily modal prices, Bangalore market) from:

Onion market data for India 2014-2024 (daily Agmarknet arrivals and prices with IMD weather and event flags),
Mendeley Data, doi:10.17632/ds9jmxp9zy.1, licence CC BY 4.0. Original prices: Agmarknet, Directorate of Marketing
and Inspection, Government of India.

Rebuild: download `preprocessed_onion_2014_2024_prices_weather_events.parquet` from the Mendeley page into
`data/raw/agmarknet_onion/onion.parquet`, `pip install pyarrow` in the agents venv, then run `build_prices.py`.

Tamil Nadu has only 2 rows in this compilation, so the nearest large South Indian market (Bangalore) is used.
The series ends 2024-12-30; the app labels it as a historical archive, never as today's price.
