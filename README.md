# AgrinorX AI Decision Desk

A responsive English/Marathi prototype for comparing a sale today, waiting three days, or using an alternative market. All sample values are illustrative; there is no live mandi feed or predictive service.

## What it includes

- Jury Demo and Farmer Mode entry points
- Editable quantity, price, transport, storage, risk, expected wait-price change, and urgency inputs
- Decision Desk, Loss Simulator, and Market Comparison views
- One shared calculation engine across all views
- Responsive desktop and mobile layouts with English and Marathi copy
- Visible gross, cost, and net arithmetic

## Calculation model

- Gross value = quantity × scenario price
- Total cost = transport + storage + risk adjustment
- Net estimate = gross value − total cost
- Recommendation = the option with the highest calculated net estimate

Urgency delay cost is applied to the WAIT option only. The nearby-market prices, distances, added transport, wait-price changes, and risk values are sample assumptions, not current market information.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. To check and build the app:

```sh
npm run typecheck
npm run build
npm run preview
```

## Prototype notice

This is a transparent, illustrative decision tool—not live mandi data, a real price prediction, or financial advice. Verify current prices, costs, and distances independently before making a sale or transport decision.
