# Download the pre-converted MobileNetV1 PlantVillage TF.js model
# from Hugging Face and place it in weiqou/web/public/models/plant-disease/
#
# No Python required. Just run from the repo root:
#   powershell -ExecutionPolicy Bypass -File scripts/download_tfjs_model.ps1

$ErrorActionPreference = 'Stop'
$dest = Join-Path $PSScriptRoot "..\weiqou\web\public\models\plant-disease" | Resolve-Path

if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

$base = "https://huggingface.co/jatindongre69/kisanai-plant-disease-tfjs/resolve/main"
$files = @(
    "model.json",
    "group1-shard1of4.bin",
    "group1-shard2of4.bin",
    "group1-shard3of4.bin",
    "group1-shard4of4.bin",
    "class_indices.json"
)

foreach ($f in $files) {
    $out = Join-Path $dest $f
    Write-Host "Downloading $f..."
    Invoke-WebRequest -Uri "$base/$f" -OutFile $out -UseBasicParsing
    $size = (Get-Item $out).Length
    Write-Host "  $f -> $([math]::Round($size / 1MB, 2)) MB"
}

# Copy class_indices.json -> class_names.json (used by the React hook)
Copy-Item (Join-Path $dest "class_indices.json") (Join-Path $dest "class_names.json") -Force
Write-Host ""
Write-Host "Done. Model files at: $dest"
Write-Host "Now run: cd weiqou\web && npm run dev"
