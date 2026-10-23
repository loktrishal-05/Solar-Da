# Regenerate Python Pydantic models from the contract JSON Schemas.
# Run from the repo root: npm run schemas -w @terrasub-solarda/contracts; then this script.
$out = "services/agents/app/models"
Get-ChildItem $out -Filter *_schema.py | Remove-Item
& services/agents/.venv/Scripts/datamodel-codegen --input packages/contracts/schemas --input-file-type jsonschema --output $out --output-model-type pydantic_v2.BaseModel --disable-timestamp --formatters black isort
