# Test MarketCheck API connection - PowerShell
# This script tests the MarketCheck API connection

$API_KEY = "wLjgG9ugF6RaHeJfCQu9BK7OAfCVFcEP"
$API_URL = "https://marketcheck-prod.apigee.net/v1/stats/cars/sales_stats"

Write-Host "Testing MarketCheck API connection..." -ForegroundColor Cyan
Write-Host "Vehicle: 2020 Toyota Camry" -ForegroundColor Cyan
Write-Host ""

# Build URL using proper URI construction
$uriBuilder = New-Object System.UriBuilder($API_URL)
$uriBuilder.Query = "year=2020&make=Toyota&model=Camry&api_key=$API_KEY"
$url = $uriBuilder.ToString()
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing
    Write-Host "HTTP Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "HTTP Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

