$port = 8765
$dir  = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript'
    '.css'  = 'text/css'
    '.wasm' = 'application/wasm'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.map'  = 'application/json'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    $port = 9876
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
}

Write-Host "Server started: http://localhost:$port"
Write-Host "Close this window to stop the server."
Write-Host ""

Start-Process "http://localhost:$port"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath.TrimStart('/')
    if ($urlPath -eq '') { $urlPath = 'index.html' }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $dir $urlPath))
    if (-not $fullPath.StartsWith($dir)) {
        $res.StatusCode = 403
        $res.Close()
        continue
    }

    if (Test-Path $fullPath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
        $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }

        if ($ext -eq '.wasm') {
            $res.Headers.Add('Cross-Origin-Opener-Policy', 'same-origin')
            $res.Headers.Add('Cross-Origin-Embedder-Policy', 'require-corp')
        }

        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $indexPath = Join-Path $dir 'index.html'
        $res.ContentType = 'text/html; charset=utf-8'
        $bytes = [System.IO.File]::ReadAllBytes($indexPath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    }

    $res.Close()
}
