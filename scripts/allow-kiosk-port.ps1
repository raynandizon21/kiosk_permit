# Run PowerShell as Administrator
# Allows inbound TCP 3200 (kiosk + admin portal) on private networks so tablets on the same Wi-Fi can connect

$ErrorActionPreference = "Stop"
$Port = 3200
$DisplayName = "SNC Permit Kiosk Port $Port"

try {
    $existing = Get-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Firewall rule already exists: $DisplayName" -ForegroundColor Yellow
    } else {
        New-NetFirewallRule -DisplayName $DisplayName `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort $Port `
            -Profile Private `
            -Description "St. Nicolas College Permit / Promissory Note / SOA kiosk (npm run dev port $Port)" | Out-Null
        Write-Host "Created firewall rule: $DisplayName (TCP $Port)" -ForegroundColor Green
    }
} catch {
    Write-Host "FAILED (run PowerShell as Administrator): $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Or: Windows Firewall -> Allow an app -> Node.js on Private networks" -ForegroundColor Yellow
    exit 1
}

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
