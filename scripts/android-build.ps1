# Runs Gradle using Android Studio's bundled JDK so npm scripts work
# even when JAVA_HOME is not set system-wide.
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("debug", "release")]
    [string]$Task
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$androidDir = Join-Path $root "android"

$jbrCandidates = @(
    (Join-Path $env:ProgramFiles "Android\Android Studio\jbr"),
    (Join-Path ${env:ProgramFiles(x86)} "Android\Android Studio\jbr"),
    (Join-Path $env:LOCALAPPDATA "Programs\Android Studio\jbr"),
    $env:JAVA_HOME
) | Where-Object { $_ }

$javaHome = $jbrCandidates | Where-Object { Test-Path (Join-Path $_ "bin\java.exe") } | Select-Object -First 1
if (-not $javaHome) {
    Write-Host "FAILED: No JDK found. Install Android Studio, then retry." -ForegroundColor Red
    exit 1
}

$sdkCandidates = @(
    $env:ANDROID_SDK_ROOT,
    $env:ANDROID_HOME,
    (Join-Path $env:LOCALAPPDATA "Android\Sdk")
) | Where-Object { $_ }

$sdk = $sdkCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $sdk) {
    Write-Host "FAILED: Android SDK not found. Open Android Studio once so it can install the SDK." -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:Path = "$(Join-Path $javaHome 'bin');$(Join-Path $sdk 'platform-tools');$env:Path"

$escapedSdk = ($sdk -replace '\\', '\\') -replace ':', '\:'
Set-Content -Path (Join-Path $androidDir "local.properties") -Value "sdk.dir=$escapedSdk" -Encoding ASCII

$gradleTask = if ($Task -eq "debug") { "assembleDebug" } else { "assembleRelease" }
Write-Host "JAVA_HOME=$javaHome"
Write-Host "ANDROID_SDK=$sdk"
Write-Host "Gradle $gradleTask"

Push-Location $androidDir
try {
    & ".\gradlew.bat" $gradleTask
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
