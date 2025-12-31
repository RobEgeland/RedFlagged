@echo off
REM Test MarketCheck API connection - Windows Command Prompt
REM This script tests the MarketCheck API connection

set API_KEY=wLjgG9ugF6RaHeJfCQu9BK7OAfCVFcEP
set API_URL=https://marketcheck-prod.apigee.net/v1/stats/cars/sales_stats

echo Testing MarketCheck API connection...
echo Vehicle: 2020 Toyota Camry
echo.

REM Try curl (available in Windows 10/11)
curl -s "%API_URL%?year=2020&make=Toyota&model=Camry&api_key=%API_KEY%"

echo.
echo.
echo If curl didn't work, try the PowerShell command below instead.

