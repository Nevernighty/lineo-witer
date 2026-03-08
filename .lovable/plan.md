

## Remove Coordinate Picker — Windy iframe is cross-origin, no click data possible

### Problem
Windy runs in a cross-origin iframe — there is **no way** to intercept click events or extract coordinates from it. The manual lat/lon text inputs are confusing because users expect clicking the map to update them. Since Windy won't share coordinate data, the whole coordinate picker is misleading.

### Solution
Remove the coordinate picker section entirely from `WeatherDisplay.tsx`:
- Remove `selectedLat`, `selectedLon`, `isCustomPoint`, `selectedWeather`, `isFetchingPoint` state
- Remove `handleLatChange`, `handleLonChange`, `resetToUserLocation`, `copyCoords`, `fetchPointWeather`, `debounceRef`
- Remove the coordinate picker UI block (lines ~446-501)
- Remove the "Selected Point Data" card if it exists
- Weather data always uses the user's geolocation `location` prop
- Keep the Windy map with layer/level/zoom controls — those work fine
- Keep all weather gauges, physics, WPD calculations using `weather` state directly

### File Modified
| File | Change |
|------|--------|
| `WeatherDisplay.tsx` | Remove coordinate picker UI, remove related state/handlers, simplify to use only geolocation data |

