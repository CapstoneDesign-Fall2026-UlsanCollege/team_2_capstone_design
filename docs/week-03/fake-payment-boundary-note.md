# Fake Payment Boundary Note

## Overview
To isolate our midterm demo from external API risks, we are establishing a strict "fake payment" boundary between the React frontend and the Django backend.

## The Boundary
- **Frontend (React):** The `/checkout` page completely skips the Khalti widget. When the user clicks "Pay with Khalti (Test Mode)", the frontend immediately generates a simulated success state and attaches a dummy flag `is_fake_payment: true` to the JSON payload.
- **Backend (Django):** The API endpoint (`/api/orders/`) will inspect the incoming payload. If `is_fake_payment == true`, Django will intentionally skip the server-to-server Khalti verification step and immediately save the order to the Neon PostgreSQL database with a status of `PAID_TEST`.

## Why this matters
By establishing this boundary now, the frontend team and the backend team can work completely independently during Week 5. The frontend doesn't need a real Khalti sandbox account, and the backend doesn't need the frontend to trigger real webhooks. We only remove the boundary for the final milestone.
