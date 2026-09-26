# Fake Data Contract (Midterm Vertical Slice)

This contract defines the exact JSON structure that the React frontend will send to the Django backend to create an order.

## Payload Structure

```json
{
  "customer": {
    "name": "Jane Doe",
    "phone": "9841000000",
    "address": "Kathmandu, Nepal"
  },
  "order": {
    "origin_id": 1,
    "origin_name": "Gulmi Reserve",
    "weight_kg": 1,
    "plan_id": "3M",
    "plan_name": "3 Months",
    "calculated_total_npr": 3420,
    "is_fake_payment": true
  }
}
```

## Field Rules
- `origin_id`: Must match an existing ID in the backend database.
- `plan_id`: Must be one of `PAYG`, `3M`, `6M`, `12M`.
- `is_fake_payment`: A temporary flag used for the midterm slice to bypass real Khalti integration while testing the end-to-end flow.
