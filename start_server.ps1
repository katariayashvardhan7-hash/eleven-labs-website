# VoxLabs • Lightweight PowerShell Static Web Server
# Serves the local files on http://localhost:8080/ and opens your default browser.

$port = 8080
$url = "http://localhost:$port/"
$baseDir = $PSScriptRoot

if (-not $baseDir) {
    $baseDir = Get-Location
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  ✨ VoxLabs • ElevenLabs Narration Studio Server Running" -ForegroundColor Green
    Write-Host "  🌐 Local URL: $url" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C in this window to stop the server." -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""

    # Open default browser
    Start-Process $url

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($localPath)) {
            $localPath = "index.html"
        }

        # Prevent directory traversal
        $filePath = Join-Path $baseDir $localPath
        $fullPath = [System.IO.Path]::GetFullPath($filePath)
        $fullBaseDir = [System.IO.Path]::GetFullPath($baseDir)

        if (-not $fullPath.StartsWith($fullBaseDir)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".htm"  { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".svg"  { "image/svg+xml" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".mp3"  { "audio/mpeg" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }

        $response.Close()
    }
} catch {
    Write-Host "Server stopped or error occurred: $_" -ForegroundColor Red
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
