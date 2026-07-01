# Stock_Tracking_app

React TypeScript + Bootstrap frontend with a TypeScript/Node backend, Finnhub WebSocket updates, Socket.IO UI updates, and JSON-backed app state.

## Run Backend

```bash
cd backend/stock-tracker-api
npm install
npm run dev
```

Set `FINNHUB_API_KEY` in `backend/stock-tracker-api/.env` to enable live price updates.

## Run Frontend

```bash
cd frontend/stock-tracker-client
npm install
npm run dev
```

Open http://localhost:5173.
