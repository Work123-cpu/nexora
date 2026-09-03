# Reverts frontend/.env and backend/application.yml back to plain localhost settings.
# Called by run-nexora-demo.cmd when you're done demoing. See demo-tunnel-apply.ps1's header
# comment for why this uses explicit no-BOM UTF-8 File I/O instead of Get-Content/Set-Content.

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root "frontend\.env"
$ymlPath = Join-Path $root "backend\src\main\resources\application.yml"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$envContent = [System.IO.File]::ReadAllText($envPath)
$envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=http://localhost:8081/api'
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_AI=.*', 'VITE_USE_MOCK_AI=false'
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_FORECAST=.*', 'VITE_USE_MOCK_FORECAST=false'
[System.IO.File]::WriteAllText($envPath, $envContent, $utf8NoBom)

$ymlLines = [System.IO.File]::ReadAllLines($ymlPath)
$ymlLines = $ymlLines | ForEach-Object {
    if ($_ -match '^\s*allowed-origins:\s*(.*)$') {
        $origins = $Matches[1].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -notmatch 'trycloudflare\.com' }
        $indent = $_.Substring(0, $_.IndexOf('allowed-origins'))
        "$indent" + "allowed-origins: " + ($origins -join ',')
    } else {
        $_
    }
}
[System.IO.File]::WriteAllText($ymlPath, (($ymlLines -join "`n") + "`n"), $utf8NoBom)

Write-Host "Reverted frontend/.env and backend application.yml to localhost-only settings."
