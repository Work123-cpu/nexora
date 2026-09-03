# Points the frontend at the backend's AND AI service's Cloudflare Tunnel URLs, with real AI
# mode enabled (not mocked), and allows the frontend's tunnel origin through both the backend's
# and the AI service's CORS config. Called by run-nexora-share.cmd -- not meant to be run
# standalone, but safe to (just re-run with the same URLs to re-apply).
#
# Uses [System.IO.File]::ReadAllText/WriteAllText with an explicit no-BOM UTF-8 encoding rather
# than Get-Content/Set-Content -- see demo-tunnel-apply.ps1's header comment for why.
param(
    [Parameter(Mandatory = $true)][string]$BackendUrl,
    [Parameter(Mandatory = $true)][string]$AiUrl,
    [Parameter(Mandatory = $true)][string]$FrontendUrl
)

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root "frontend\.env"
$ymlPath = Join-Path $root "backend\src\main\resources\application.yml"
$aiEnvPath = Join-Path $root "ai-service\.env"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$BackendUrl = $BackendUrl.TrimEnd('/')
$AiUrl = $AiUrl.TrimEnd('/')
$FrontendUrl = $FrontendUrl.TrimEnd('/')

# (?m)^KEY= anchors to the start of an actual assignment line -- without this, the replace would
# also corrupt any comment line that happens to mention the variable name in prose.
$envContent = [System.IO.File]::ReadAllText($envPath)
$envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$BackendUrl/api"
$envContent = $envContent -replace '(?m)^VITE_AI_SERVICE_URL=.*', "VITE_AI_SERVICE_URL=$AiUrl"
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_AI=.*', 'VITE_USE_MOCK_AI=false'
$envContent = $envContent -replace '(?m)^VITE_USE_MOCK_FORECAST=.*', 'VITE_USE_MOCK_FORECAST=false'
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

$aiEnvLines = [System.IO.File]::ReadAllLines($aiEnvPath)
$aiEnvLines = $aiEnvLines | ForEach-Object {
    if ($_ -match '^ALLOWED_ORIGINS=(.*)$') {
        $origins = $Matches[1].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -notmatch 'trycloudflare\.com' -and $_ -ne '' }
        $origins += $FrontendUrl
        "ALLOWED_ORIGINS=" + ($origins -join ',')
    } else {
        $_
    }
}
[System.IO.File]::WriteAllText($aiEnvPath, (($aiEnvLines -join "`n") + "`n"), $utf8NoBom)

Write-Host "Applied tunnel URLs (real AI mode):"
Write-Host "  Backend:  $BackendUrl"
Write-Host "  AI:       $AiUrl"
Write-Host "  Frontend: $FrontendUrl"
