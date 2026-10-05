# API End-to-End Check

**Tester:** Aditya (@notyouradhee)
**Date:** 2026-10-05

We ran one end-to-end check of the current Django API for the checkout flow.

## 1. Successful Run (Expected Behavior)
**Action:** User selects "Gulmi Reserve", "1 kg", "3 Months", and clicks "Pay with Khalti".
**Request:**
```json
POST http://localhost:8000/api/orders/
Content-Type: application/json

{
  "origin_id": 1,
  "origin_name": "Gulmi Reserve",
  "weight_kg": 1,
  "plan_id": "3M",
  "plan_name": "3 Months",
  "total_price_npr": 1140,
  "is_fake_payment": true
}
```
**Response (201 Created):**
```json
{
  "id": 12,
  "origin_id": 1,
  "weight_kg": 1.0,
  "status": "PAID_TEST",
  "created_at": "2026-10-05T12:00:00Z"
}
```
**Result:** The frontend transitions to the green "Payment Successful" state.

## 2. Failure Case (Expected Error Handling)
**Action:** The Django backend server is stopped to simulate an API outage. The user clicks "Pay with Khalti".
**Request:** POST request fails to connect (Network Error).
**Result:** The frontend catches the fetch error and displays the `paymentStatus === "error"` state.
**UI Output:** "Connection Error. Is the Django API running?" with a "Try Again" button.
