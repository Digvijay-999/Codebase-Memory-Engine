$ErrorActionPreference = 'Stop'
$baseUrl = 'http://127.0.0.1:8000'

Write-Host "Indexing repo 1..."
$repo1 = Invoke-RestMethod -Uri "$baseUrl/index" -Method Post -ContentType "application/json" -Body '{"repo_url": "https://github.com/sindresorhus/is-number"}'
Write-Host "Repo 1: $($repo1.repo_name)"

Write-Host "Indexing repo 2..."
$repo2 = Invoke-RestMethod -Uri "$baseUrl/index" -Method Post -ContentType "application/json" -Body '{"repo_url": "https://github.com/sindresorhus/is-odd"}'
Write-Host "Repo 2: $($repo2.repo_name)"

Write-Host "Asking repo 1..."
$ans1 = Invoke-RestMethod -Uri "$baseUrl/ask" -Method Post -ContentType "application/json" -Body '{"question": "What is this repo about?", "repo_name": "is-number"}'
Write-Host "Answer 1 sources:"
$ans1.sources | ForEach-Object { Write-Host $_ }

Write-Host "Asking repo 2..."
$ans2 = Invoke-RestMethod -Uri "$baseUrl/ask" -Method Post -ContentType "application/json" -Body '{"question": "What is this repo about?", "repo_name": "is-odd"}'
Write-Host "Answer 2 sources:"
$ans2.sources | ForEach-Object { Write-Host $_ }
