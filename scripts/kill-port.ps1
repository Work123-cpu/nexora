# Stops whatever process is listening on a given TCP port, if anything.
# Used by run-nexora-demo.cmd instead of taskkill /FI "WINDOWTITLE eq ..." — window-title
# matching is unreliable when the console was opened as a Windows Terminal tab rather than a
# standalone conhost window (Get-Process/taskkill then can't see the tab's own title), but the
# port a process is bound to is always accurate regardless of how its window is hosted.
param(
    [Parameter(Mandatory = $true)][int]$Port
)

$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "Nothing listening on port $Port."
    exit 0
}

$targetPids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($targetPid in $targetPids) {
    try {
        $proc = Get-Process -Id $targetPid -ErrorAction Stop
        Write-Host "Stopping $($proc.ProcessName) (PID $targetPid) on port $Port..."
        Stop-Process -Id $targetPid -Force -ErrorAction Stop
    } catch {
        Write-Host "PID $targetPid on port $Port already gone."
    }
}
