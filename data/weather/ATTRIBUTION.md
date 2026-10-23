# Weather data

`chennai_daily_2021-2023.csv`: daily FAO-56 reference evapotranspiration (`et0_fao_evapotranspiration`, mm),
precipitation, temperature, humidity, wind and radiation for Chennai (13.08 N, 80.27 E; grid cell 13.11 N, 80.25 E,
12 m), 2021-01-01 to 2023-12-31, timezone Asia/Kolkata.

Source: Open-Meteo Historical Weather API (https://open-meteo.com/), archive-api.open-meteo.com/v1/archive,
fetched 2026-10-24 by `services/agents/app/weather.py --fetch`. Weather data by Open-Meteo.com, licensed CC BY 4.0.
Free API tier is for non-commercial use.

In replays, "forecast" values are the archive's actual values for the coming days (a perfect forecast). That is
optimistic and is labelled as such wherever it is used.
