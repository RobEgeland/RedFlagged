# Test MarketCheck API through Next.js route
# This will show the actual error message

Write-Host "Testing MarketCheck API via Next.js route..." -ForegroundColor Cyan
Write-Host ""

# Test with GET request
Write-Host "=== GET Request ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/marketcheck?year=2020&make=Toyota&model=Camry" -Method GET -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error Response:" -ForegroundColor Red
    $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
}

Write-Host ""
Write-Host "=== POST Request ===" -ForegroundColor Yellow
try {
    $body = @{
        year = 2020
        make = "Toyota"
        model = "Camry"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/marketcheck" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Error Response:" -ForegroundColor Red
    $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10
}

Write-Host ""
Write-Host "Check your Next.js server console for detailed logs!" -ForegroundColor Cyan

