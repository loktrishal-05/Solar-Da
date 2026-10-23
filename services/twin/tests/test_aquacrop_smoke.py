"""Phase 0 smoke: AquaCrop-OSPy imports and runs a bundled example on the pinned interpreter."""
from aquacrop import AquaCropModel, Crop, InitialWaterContent, Soil
from aquacrop.utils import get_filepath, prepare_weather


def test_wheat_season_runs():
    weather = prepare_weather(get_filepath("tunis_climate.txt"))
    model = AquaCropModel("1979/10/01", "1981/05/30", weather, Soil("SandyLoam"),
                          Crop("Wheat", planting_date="10/01"), InitialWaterContent(value=["FC"]))
    model.run_model(till_termination=True)
    yields = model.get_simulation_results()["Dry yield (tonne/ha)"]
    assert len(yields) >= 1 and (yields > 0).all()
