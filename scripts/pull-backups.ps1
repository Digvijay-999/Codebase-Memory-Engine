# Copy the newest chroma_data and repos_data backups from the server into the local backups/ folder.
#   scripts\pull-backups.ps1 -Server user@host [-Key C:\path\to\key.pem] [-RemoteDir contextforge/backups]
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [string]$Key,
    [string]$RemoteDir = 'contextforge/backups'
)
$ErrorActionPreference = 'Stop'
$local = Join-Path (Split-Path $PSScriptRoot -Parent) 'backups'
New-Item -ItemType Directory -Force $local | Out-Null
$sshArgs = @('-o', 'BatchMode=yes')
if ($Key) { $sshArgs += @('-i', $Key) }

foreach ($vol in 'chroma_data', 'repos_data') {
    $name = (& ssh @sshArgs $Server "ls -t $RemoteDir/$vol-*.tgz 2>/dev/null | head -n 1" | Out-String).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $name) { throw "No $vol backup found in ${Server}:$RemoteDir" }
    & scp @sshArgs -q "${Server}:$name" $local
    if ($LASTEXITCODE -ne 0) { throw "scp failed for $name" }
    Get-Item (Join-Path $local (Split-Path $name -Leaf)) | Select-Object Name, Length, LastWriteTime
}
