# Backend Gaps

This marketplace frontend must not fake customer account behavior that the backend does not currently support.

## Missing Customer Auth Endpoints

- `POST /auth/customer/login`
- `POST /auth/customer/register`

Impact:

- `/login` uses the documented generic `POST /auth/login` endpoint only for existing backend users.
- `/register` is intentionally blocked until a real customer registration endpoint exists.
- The UI must not show a fake registration success state or create local-only customer accounts.

## Missing Customer Booking Endpoints

- `GET /customer/bookings`
- `GET /customer/bookings/:id`

Impact:

- `/my-bookings` is intentionally blocked in this marketplace app.
- Do not call `/customer/bookings` or `/customer/bookings/:id`.
- The backend has `GET /bookings/my`, but that depends on an authenticated existing backend user and is not a complete public customer booking history flow. If it is later enabled here, the limitation must be visible in the UI and documented beside the implementation.

## Supported Auth-Adjacent Behavior

- `POST /auth/login` can authenticate existing backend users.
- `GET /auth/me` can load the profile for an authenticated existing backend user.
- `401` responses clear auth state and redirect to `/login`.

## Missing Tenant Admin Profile Endpoints

- `GET /tenant/profile`
- `PATCH /tenant/profile`

Impact:

- Tenant admins need these endpoints to view and edit their own tenant record from `/profile`.
- The dashboard now expects `GET /tenant/profile` to return the authenticated user's tenant as the same shape as `AdminTenant`.
- The dashboard now sends `PATCH /tenant/profile` with:
  - `name`
  - `slug`
  - `registration_number`
  - `email`
  - `phone`
  - `logo_url`
  - `banner_url`
  - `description`
  - `status`
- Backend should scope the update to `req.user.tenant_id`; the client must not send or choose a tenant id for this flow.
- Backend should validate slug uniqueness and decide whether tenant admins are allowed to update `status`. If not, return a clear 403/400 so the UI can show the backend message.

## Acceptance Rules

- No unsupported customer endpoint is used as a production dependency.
- Registration remains pending backend support.
- Booking history remains blocked unless deliberately wired to an implemented endpoint with clear limitations.
