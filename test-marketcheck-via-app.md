# Testing MarketCheck API through Next.js App

Since MarketCheck is used server-side in your Next.js app, the best way to test it is through your app's API route.

## Steps:

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **Test the API route** (in a new terminal/PowerShell window):

   **Using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/marketcheck -H "Content-Type: application/json" -d "{\"year\":2020,\"make\":\"Toyota\",\"model\":\"Camry\"}"
   ```

   **Using PowerShell:**
   ```powershell
   $body = @{year=2020;make="Toyota";model="Camry"} | ConvertTo-Json
   Invoke-WebRequest -Uri "http://localhost:3000/api/marketcheck" -Method POST -Body $body -ContentType "application/json" | Select-Object -ExpandProperty Content
   ```

   **Or using GET:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000/api/marketcheck?year=2020&make=Toyota&model=Camry" -Method GET | Select-Object -ExpandProperty Content
   ```

3. **Check the server logs** - The Next.js server console will show:
   - Whether the API key was found
   - The MarketCheck API response
   - Any errors

This tests the actual integration path your app uses!


