# Download the trained sensor models (forecasters, anomaly thresholds, soil-water emulator) into services/agents/model/.
# Weights are not committed; they are attached to the GitHub release sensor-models-v1. Rebuild them with
# bench/train_sensor_models.py, bench/eval_anomaly.py and bench/train_soil_model.py.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts/fetch_sensor_models.ps1
param(
    [string]$Zip = '',
    [string]$Url = 'https://github.com/loktrishal-05/Solar-Da/releases/download/sensor-models-v1/solarda_sensor_models.zip'
)
$ErrorActionPreference = 'Stop'
$dest = Join-Path (Split-Path -Parent $PSScriptRoot) 'services\agents\model'
New-Item -ItemType Directory -Force $dest | Out-Null
if (-not $Zip) {
    $Zip = Join-Path $env:TEMP 'solarda_sensor_models.zip'
    Write-Host "Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $Zip
}
Expand-Archive -Path $Zip -DestinationPath $dest -Force
Get-ChildItem $dest | Format-Table Name, Length
foreach ($f in 'sensor_models.joblib', 'soil_model.joblib') {
    if (-not (Test-Path (Join-Path $dest $f))) { throw "$f missing from the archive" }
}
Write-Host 'Sensor models installed.'
