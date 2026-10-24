from app import twin


def test_options_and_same_day_events():
    hist = [{"date": "2021-02-26", "mm": 20}]
    opts = twin.compare_options("2021-01-15", "2021-02-26", hist, 20)  # irrigate_now lands on an existing event day
    assert {o["option"] for o in opts} == {"hold", "irrigate_now", "irrigate_tonight"}
    assert all(o["source"] == "twin" and o["run_id"].startswith("twin:2021-02-26") for o in opts)


def test_irrigation_reduces_stress_in_a_dry_spell():
    dry = twin.run("2023-01-15", "2023-03-15", [])
    wet = twin.run("2023-01-15", "2023-03-15", [{"date": f"2023-0{m}-{d:02d}", "mm": 20} for m in (2, 3) for d in range(1, 15, 3)])
    assert wet["stress_days"] < dry["stress_days"]


def test_climatology_hides_the_future_and_harvest_forecast_runs():
    w = twin.climatology_weather("2022-03-01")
    actual = twin.weather_df()
    future = w.Date > "2022-03-01"
    assert (w[~future].MaxTemp.values == actual[~future].MaxTemp.values).all()
    assert (w[future].MaxTemp.values != actual[future].MaxTemp.values).any()
    f = twin.forecast_harvest("2022-01-15", "2022-03-01")
    assert f["harvest_date"].startswith("2022-05") and 5 < f["dry_yield_t_ha"] < 12 and f["source"] == "twin"
