

## Weather Page: Deep Windy Integration + Point Weather Fetching

### Problem
- Can't intercept clicks on the Windy iframe (cross-origin). Need an alternative for "click to get point weather".
- Need more layer options and tighter map-data coupling.

### Solution

**`WeatherDisplay.tsx` changes:**

1. **Coordinate picker** — Add editable lat/lon input fields styled in Line-O-Witer dark theme. Changing coordinates:
   - Updates the Windy iframe URL (map re-centers)
   - Fetches Open-Meteo weather for that exact point
   - Updates all gauges/data below with the new point's data
   - Shows a "fetching..." state briefly

2. **More Windy layers** — Expand from 7 to 12+ overlays organized in two rows:
   - Row 1: Wind, Gusts, Rain, Clouds, Temp, Pressure
   - Row 2: Waves, Snow, Thunder/CAPE, Humidity, Visibility, Jet Stream (currJet)
   - Add `level` selector: Surface / 850hPa / 700hPa / 500hPa (Windy supports `&level=surface|850h|700h|500h`)

3. **"Selected Point" data card** — New prominent section between map and gauges showing:
   - Coordinates with copy button
   - Elevation (Open-Meteo returns elevation)
   - Live wind/temp/humidity/pressure for that specific point
   - WPD calculation for selected point
   - Visual comparison badge if different from user's location

4. **Bigger map** — Increase from 380px to 420px height

5. **Zoom control** — Add zoom level selector (5/7/9/11) that updates the Windy `&zoom=` parameter

### Technical Approach
- `selectedLocation` state (defaults to `location` prop)
- `selectedWeather` state (separate from main weather)
- On coordinate change: rebuild Windy URL + call `fetchOpenMeteoWeather(newLat, newLon)`
- Debounce coordinate input changes (300ms)
- Windy overlay params: `overlay`, `level`, `zoom` all controlled by React state

### Files Modified

| File | Change |
|------|--------|
| `WeatherDisplay.tsx` | Coordinate picker, 12+ layers, level selector, zoom control, point weather fetch, selected point card |

