# Points the frontend at the backend's Cloudflare Tunnel URL and allows the frontend's tunnel
# origin through the backend's CORS config. Called by run-nexora-demo.cmd — not meant to be run
# standalone, but safe to (just re-run with the same URLs to re-apply).
#
# Uses [System.IO.File]::ReadAllText/WriteAllText with an explicit no-BOM UTF-8 encoding rather
# than Get-Content/Set-Content — Windows PowerShell 5.1's cmdlet defaults are inconsistent
# (Get-Content without -Encoding uses the system ANSI codepage, silently mangling the em-dashes
# already in these files; Set-Content -Encoding utf8 adds a BOM neither file originally has).
param(
    [Parameter(Mandatory = $true)][string]$BackendUrl,
    [Parameter(Mandatory = $true)][string]$FrontendUrl
)

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root "frontend\.env"
$ymlPath = Join-Path $root "backend\src\main\resources\application.yml"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$BackendUrl = $BackendUrl.TrimEnd('/')
$FrontendUrl = $FrontendUrl.TrimEnd('/')

# (?m)^KEY= anchors to the start of an actual assignment line — without this, the replace would
# also corrupt any comment line that happens to mention the variable name in prose.
$envContent = [System.IO.File]::ReadAllText($envPath)
$envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$BackendUrl/api"
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_AI=.*', 'VITE_USE_MOCK_AI=true'
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_FORECAST=.*', 'VITE_USE_MOCK_FORECAST=true'
[System.IO.File]::WriteAllText($envPath, $envContent, $utf8NoBom)

$ymlLines = [System.IO.File]::ReadAllLines($ymlPath)
$ymlLines = $ymlLines | ForEach-Object {
    if ($_ -match '^\s*allowed-origins:\s*(.*)$') {
        $origins = $Matches[1].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -notmatch 'trycloudflare\.com' }
        $origins += $FrontendUrl
        $indent = $_.Substring(0, $_.IndexOf('allowed-origins'))
        "$indent" + "allowed-origins: " + ($origins -join ',')
    } else {
        $_
    }
}
[System.IO.File]::WriteAllText($ymlPath, (($ymlLines -join "`n") + "`n"), $utf8NoBom)

Write-Host "Applied tunnel URLs:"
Write-Host "  Backend:  $BackendUrl"
Write-Host "  Frontend: $FrontendUrl"
