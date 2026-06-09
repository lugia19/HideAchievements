# Builds a release zip: type check, prod build, then package the files a
# Millennium install needs (plugin.json, backend, .millennium/Dist, README).
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "Type check failed" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

$version = (Get-Content plugin.json -Raw | ConvertFrom-Json).version
$staging = Join-Path $PSScriptRoot "release\hide-achievements"
if (Test-Path "$PSScriptRoot\release") { Remove-Item -Recurse -Force "$PSScriptRoot\release" }
New-Item -ItemType Directory -Force $staging | Out-Null

Copy-Item plugin.json, README.md -Destination $staging
Copy-Item backend -Destination $staging -Recurse
New-Item -ItemType Directory -Force "$staging\.millennium" | Out-Null
Copy-Item .millennium\Dist -Destination "$staging\.millennium" -Recurse

$zip = "$PSScriptRoot\release\hide-achievements-v$version.zip"
Compress-Archive -Path $staging -DestinationPath $zip
Write-Host "Created $zip"
