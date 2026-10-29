# BrewMellow — System Requirements

## Functional Requirements (FR)

### FR1: Authentication & Customer Identity
- Customers register with Full Name, Email, Phone Number, and Primary Delivery Address.
- Password hashing using Django default secure hashers (PBKDF2/Argon2).
- Token-based API authentication for frontend session persistence.
- Role-based separation: Regular Customer vs Staff/Admin (`is_staff`).

### FR2: Subscription Customization Engine
- Dynamic pricing computation based on commit duration (1 mo = 0%, 3 mo = 5%, 6 mo = 10%, 12 mo = 15% discount).
- Weight options: 250g, 500g, 1kg per monthly delivery.
- Origin selection: Gulmi Reserve, Ilam Gold, Nuwakot Heritage.

### FR3: Integrated Checkout & Payment
- Unified checkout collecting delivery address, recipient phone, and account credentials.
- Integration with Khalti Payment Gateway.
- Automated creation of customer account and initial order upon payment confirmation.

### FR4: Customer Subscription Dashboard
- Active subscription overview with next scheduled delivery date.
- Self-service controls: Skip next delivery, Pause subscription, Cancel plan.
- Order history with status indicators and invoice receipts.

### FR5: Staff Business Portal
- Role-restricted access (`/admin-portal` requiring `is_staff=True`).
- Overview of key metrics: Total Revenue (NPR), Active Subscriber Count, Churn rate.
- Master order fulfillment table with dispatch status updates.

## Non-Functional Requirements (NFR)

### NFR1: Performance & PWA
- Progressive Web App installable on iOS, Android, and Desktop with manifest icons.
- Sub-200ms API response time on local/production environments.

### NFR2: Reliability & Security
- No plain-text password storage; CSRF and CORS protections enabled.
- Orders must be bound to authenticated customer IDs via ForeignKeys.
