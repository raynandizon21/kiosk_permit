# Allows inbound TCP 3200 (kiosk + admin portal) on private networks so tablets
# on the same Wi-Fi can connect. Re-launches itself with a UAC prompt if this
# PowerShell is not already running as Administrator.
param([switch]$Elevated)

$ErrorActionPreference = "Stop"
$Port = 3200
$DisplayName = "SNC Permit Kiosk Port $Port"

function Test-IsAdministrator {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Add-KioskFirewallRule {
    $existing = Get-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Firewall rule already exists: $DisplayName" -ForegroundColor Yellow
        return
    }
    New-NetFirewallRule -DisplayName $DisplayName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $Port `
        -Profile Private `
        -Description "St. Nicolas College Permit / Promissory Note / SOA kiosk (npm run dev port $Port)" | Out-Null
    Write-Host "Created firewall rule: $DisplayName (TCP $Port)" -ForegroundColor Green
}

function Show-TabletUrls {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.PrefixOrigin -ne 'WellKnown' } |
        Select-Object -First 1 -ExpandProperty IPAddress)

    Write-Host ""
    Write-Host "Open on the tablet (same Wi-Fi as this PC):" -ForegroundColor Cyan
    if ($ip) {
        Write-Host "  Kiosk:  http://${ip}:$Port/kiosk"
        Write-Host "  Admin:  http://${ip}:$Port/admin"
    } else {
        Write-Host "  Run ipconfig and use your IPv4 address with port $Port"
    }
}

if (-not (Test-IsAdministrator)) {
    $script = $PSCommandPath
    if (-not $script) { $script = $MyInvocation.MyCommand.Path }
    Write-Host "Requesting Administrator permission (approve the Windows UAC prompt)..." -ForegroundColor Cyan
    try {
        $proc = Start-Process -FilePath "powershell.exe" `
            -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$script`" -Elevated" `
            -Verb RunAs `
            -Wait `
            -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Host "FAILED: could not add the firewall rule (exit $($proc.ExitCode))." -ForegroundColor Red
            Write-Host "Or: Windows Firewall -> Allow an app -> Node.js on Private networks" -ForegroundColor Yellow
            exit $proc.ExitCode
        }
        Show-TabletUrls
        exit 0
    } catch {
        Write-Host "FAILED: Administrator permission is required (UAC was cancelled or blocked)." -ForegroundColor Red
        Write-Host "Or: Windows Firewall -> Allow an app -> Node.js on Private networks" -ForegroundColor Yellow
        exit 1
    }
}

try {
    Add-KioskFirewallRule
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Or: Windows Firewall -> Allow an app -> Node.js on Private networks" -ForegroundColor Yellow
    exit 1
}

if (-not $Elevated) {
    Show-TabletUrls
}
