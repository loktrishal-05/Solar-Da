# Download the trained leaf-disease model (ONNX + labels + calibration + metrics) into services/vision/model/.
# Model weights are not committed to git; they are attached to a GitHub release of this repo.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts/fetch_vision_model.ps1
# Or pass a local zip exported by services/vision/train/train_colab.ipynb:  -Zip C:\path\solarda_vision.zip
param(
    [string]$Zip = '',
    [string]$Url = 'https://github.com/loktrishal-05/Solar-Da/releases/download/vision-v1/solarda_vision.zip'
)
$ErrorActionPreference = 'Stop'
$dest = Join-Path (Split-Path -Parent $PSScriptRoot) 'services\vision\model'
New-Item -ItemType Directory -Force $dest | Out-Null
if (-not $Zip) {
    $Zip = Join-Path $env:TEMP 'solarda_vision.zip'
    Write-Host "Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $Zip
}
Expand-Archive -Path $Zip -DestinationPath $dest -Force
Get-ChildItem $dest | Format-Table Name, Length
if (-not (Test-Path (Join-Path $dest 'leaf_disease.onnx'))) { throw 'leaf_disease.onnx missing from the archive' }
Write-Host 'Vision model installed.'
