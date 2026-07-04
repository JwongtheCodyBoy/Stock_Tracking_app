# Stock Tracker v2

Frontend-only React, TypeScript, and Bootstrap stock tracker using Twelve Data.

## Run Locally

From this directory:

```powershell
cd v2
npm install
npm run dev
```

Then open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173/
```

## Twelve Data API Key

Enter your Twelve Data API key in the app field labeled `Twelve Data API key`.

The key is saved in this browser's `localStorage` under:

```text
stock-tracker-v2-twelve-data-api-key
```

It is not saved into exported profile JSON.

## Build

```powershell
npm run build
```

The production output is written to `dist`.

## How To Use The App

### 1. Add Your Twelve Data API Key

Enter your key in the `Twelve Data API key` field.

The key is saved in this browser only. It is not included when you export profiles.

### 2. Choose Or Create A Profile

A profile is a named watchlist.

Use `Load profile` to switch between saved profiles. Edit `Profile name` to rename the current profile.

Use `New` to create another profile. Use `Delete` to remove the current profile.

### 3. Add A Stock

In the `Add Stock` panel:

1. Enter a symbol, such as `AAPL`, `MSFT`, or `NVDA`.
2. Optionally enter notes.
3. Choose one or more conditions.
4. Click `Add Stock`.

Each stock becomes a card. Each card can have multiple conditions.

### 4. Add Conditions

Available conditions:

- Price below a target price
- Price above a target price
- RSI above 70
- RSI below 30
- Price crosses above an EMA
- Price crosses below an EMA

The card shows a condition count like:

```text
2/3
```

That means 2 out of 3 conditions are currently met.

Hover over the count to see which conditions are met. Met conditions are green. If all conditions are met, the whole card turns green.

### 5. Refresh Prices And Signals

Click `Update Up To 8 Stocks` to call Twelve Data.

The app updates the first 8 stocks in the active profile. This keeps the app friendlier to free-tier API limits because each stock uses one API call.

The app calculates EMA and RSI locally from the returned price history.

## Interval, Bars, And EMA

### Interval

`Interval` means the size of each candle/data point requested from Twelve Data.

Examples:

| Interval | Meaning |
|---|---|
| `1 day` | Each bar is one trading day |
| `1 hour` | Each bar is one hour |
| `15 min` | Each bar is fifteen minutes |
| `5 min` | Each bar is five minutes |
| `1 min` | Each bar is one minute |

If you choose `1 day`, the app calculates indicators from daily closes.

If you choose `5 min`, the app calculates indicators from five-minute closes.

### Bars

`Bars` means how many historical candles to request.

Example:

```text
Interval: 1 day
Bars: 120
```

This requests about 120 daily candles.

Another example:

```text
Interval: 5 min
Bars: 120
```

This requests about 120 five-minute candles.

More bars gives EMA and RSI more history to work with. Fewer bars gives less history.

### EMA Period

The EMA period is based on the selected interval.

Example:

```text
Interval: 5 min
Bars: 120
EMA period: 20
```

This means:

- Request the latest 120 five-minute candles.
- Use each candle's close price.
- Calculate a 20-period EMA from those five-minute closes.
- This is a 20 EMA on the 5-minute chart.

It does not mean 20 days. It means 20 five-minute candles.

Another example:

```text
Interval: 1 day
Bars: 120
EMA period: 20
```

This is a 20-day EMA because each candle is one day.

Example chart:

| App Settings | What The App Requests | What The EMA Means |
|---|---|---|
| Interval `1 day`, Bars `120`, EMA `20` | 120 daily candles | 20-day EMA |
| Interval `1 hour`, Bars `120`, EMA `20` | 120 hourly candles | 20-hour EMA |
| Interval `15 min`, Bars `120`, EMA `20` | 120 fifteen-minute candles | 20-period EMA on a 15-minute chart |
| Interval `5 min`, Bars `120`, EMA `20` | 120 five-minute candles | 20-period EMA on a 5-minute chart |
| Interval `1 min`, Bars `200`, EMA `50` | 200 one-minute candles | 50-period EMA on a 1-minute chart |

Another way to think about it:

```text
EMA period counts candles, not days.

If Interval = 5 min and EMA = 20:
20 EMA = 20 five-minute candles
```

For daily or swing-trading style watchlists, `1 day` is usually the easiest default.

For intraday tracking, `5 min` or `15 min` may make more sense.

## Profiles And Exporting

Profiles are saved locally in the browser with `localStorage`.

Use `Export JSON` to download your profiles and conditions. Use `Import JSON` to restore them later.

## Refresh Behavior

Use `Update Up To 8 Stocks` to manually call Twelve Data. Each refresh updates the first 8 stocks in the active profile to stay friendly to free-tier API limits.
