# Reverts frontend/.env, backend/application.yml, and ai-service/.env back to plain localhost
# settings. Called by run-nexora-share.cmd when you're done sharing. See share-tunnel-apply.ps1's
# header comment for why this uses explicit no-BOM UTF-8 File I/O instead of Get-Content/Set-Content.

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root "frontend\.env"
$ymlPath = Join-Path $root "backend\src\main\resources\application.yml"
$aiEnvPath = Join-Path $root "ai-service\.env"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$envContent = [System.IO.File]::ReadAllText($envPath)
$envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*', 'VITE_API_BASE_URL=http://localhost:8081/api'
$envContent = $envContent -replace '(?m)^VITE_AI_SERVICE_URL=.*', 'VITE_AI_SERVICE_URL=http://localhost:8000'
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

$aiEnvLines = [System.IO.File]::ReadAllLines($aiEnvPath)
$aiEnvLines = $aiEnvLines | ForEach-Object {
    if ($_ -match '^ALLOWED_ORIGINS=(.*)$') {
        $origins = $Matches[1].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -notmatch 'trycloudflare\.com' -and $_ -ne '' }
        "ALLOWED_ORIGINS=" + ($origins -join ',')
    } else {
        $_
    }
}
[System.IO.File]::WriteAllText($aiEnvPath, (($aiEnvLines -join "`n") + "`n"), $utf8NoBom)

Write-Host "Reverted frontend/.env, backend application.yml, and ai-service/.env to localhost-only settings."
