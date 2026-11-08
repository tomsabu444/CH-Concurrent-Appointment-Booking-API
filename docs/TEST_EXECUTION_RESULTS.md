# Test Execution Results & Concurrency Verification

This document contains live execution evidence and invariant verification satisfying **Submission Requirement 5**.

---

## 1. Test Suite Architecture

The project features two layers of automated verification:
1. **Automated Jest Test Suite (`npm test`)**: Feature-mirrored unit and integration tests (using Supertest) with isolated, dynamic database fixtures that require zero manual database resets.
2. **Standalone HTTP Concurrency Runner (`npm run test:concurrency`)**: Pure HTTP verification executing parallel requests against the running Express application.

---

## 2. Automated Test Suite Execution (`npm test`)

The automated test suite runs all 24 tests across 4 test suites:

- **`appointment.schema.test.ts`**: Validates payload parsing, required fields, float rejection, negative values, and 32-bit integer boundary enforcement (`2147483647`).
- **`errorHandler.test.ts`**: Verifies domain exceptions (`ConflictError`, `NotFoundError`, `ValidationError`, `AppError`) formatting into clean HTTP response bodies.
- **`appointment.api.test.ts`**: Tests full Express HTTP request/response lifecycles (400 Bad Request variations, 404 Not Found, 201 Created, sequential 409 Conflict).
- **`appointment.concurrency.test.ts`**: Simulates race conditions under high concurrency (2 parallel requests, and 6 parallel competing requests).

### Execution Summary
```text
> ch-concurrent-appointment-booking-monorepo@1.0.0 test
> npm test --workspace=backend

> backend@1.0.0 test
> jest --runInBand

PASS tests/features/appointments/appointment.concurrency.test.ts
  Appointments Feature - Concurrency & Race Conditions (Integration)
    √ should handle 2 simultaneous competing booking requests atomically (exactly 1 succeeds, 1 gets 409) (122 ms)
    √ should handle 6 simultaneous competing booking requests atomically (exactly 1 succeeds, 5 get 409) (165 ms)

PASS tests/features/appointments/appointment.api.test.ts
  Appointments Feature - API & HTTP Validation (Integration)
    HTTP Validation Failures (400 Bad Request)
      √ should return 400 when request body is empty (70 ms)
      √ should return 400 when slotId is missing (23 ms)
      √ should return 400 when patientId is missing (16 ms)
      √ should return 400 for non-integer string values (12 ms)
      √ should return 400 for zero or negative values (12 ms)
      √ should return 400 for 32-bit integer overflow values (12 ms)
      √ should return 400 for malformed JSON payload (19 ms)
    Domain Flow & Booking Lifecycle
      √ should return 404 when slot does not exist (23 ms)
      √ should return 404 when patient does not exist (23 ms)
      √ should successfully book an available slot (201 Created) (29 ms)
      √ should return 409 Conflict when attempting to book an already booked slot sequentially (46 ms)

PASS tests/middleware/errorHandler.test.ts
  Middleware - Error Handler & Custom Error Classes (Unit)
    √ should instantiate AppError with correct defaults (2 ms)
    √ should instantiate NotFoundError with 404 status (1 ms)
    √ should instantiate ConflictError with 409 status (1 ms)
    √ should instantiate ValidationError with 400 status (1 ms)
    √ should format AppError into structured JSON response (2 ms)

PASS tests/features/appointments/appointment.schema.test.ts
  Appointments Feature - Schema Validation (Unit)
    √ should successfully parse valid slotId and patientId (1 ms)
    √ should fail when slotId is missing (1 ms)
    √ should fail when patientId is missing
    √ should fail when values are non-positive integers
    √ should fail when values are floating point numbers (1 ms)
    √ should fail when values are strings or incorrect types

Test Suites: 4 passed, 4 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        4.762 s
Ran all test suites.
```

---

## 3. Standalone Concurrency Test Runner (`tests/concurrency.test.ts`)

### Test Setup
- **Endpoint**: `POST http://localhost:3000/api/appointments/book`
- **Target Slot**: `SlotId = 101`
- **Concurrent Clients**:
  - Request A: `{ "slotId": 101, "patientId": 5001 }`
  - Request B: `{ "slotId": 101, "patientId": 5002 }`
- **Dispatch**: Dispatched in parallel at the identical millisecond using `Promise.all()`.
- **Test Runner**: [`tests/concurrency.test.ts`](file:///d:/Github/CH-Concurrent-Appointment-Booking-API/tests/concurrency.test.ts)

### Execution Output
```text
> ch-concurrent-appointment-booking-monorepo@1.0.0 test:concurrency
> tsx tests/concurrency.test.ts

================================================================
       CARITAS HOSPITAL - CONCURRENT BOOKING TEST SUITE        
================================================================
API Endpoint:  http://localhost:3000/api/appointments/book
Target SlotId: 101
Request A:     Patient 5001
Request B:     Patient 5002
----------------------------------------------------------------
Dispatching parallel requests simultaneously via Promise.all()...

  Request A (Patient 5001): [409 CONFLICT] in 125ms -> Appointment slot 101 is already booked.
  Request B (Patient 5002): [201 CREATED] in 92ms -> Appointment booked successfully.

----------------------------------------------------------------
Verifying Concurrency Invariants:
  - 201 Created (Success):  1 (Expected: 1)
  - 409 Conflict (Handled): 1 (Expected: 1)
  - Unexpected Responses:   0 (Expected: 0)
----------------------------------------------------------------
>>> RESULT: PASSED
    Concurrency guarantee satisfied: exactly one patient booked the slot,
    and the simultaneous duplicate request was safely rejected.
```

---

## 4. Invariant Verification

| Metric | Expected | Actual | Status |
|---|---|---|---|
| **201 Created** | 1 | 1 | **PASSED** |
| **409 Conflict** | 1 | 1 | **PASSED** |
| **Unexpected Status Codes** | 0 | 0 | **PASSED** |
| **Duplicate Database Rows** | 0 | 0 | **PASSED** |

### Database Verification Query
```sql
SELECT COUNT(*) AS TotalBookings FROM dbo.Appointments WHERE SlotId = 101;
-- Result: 1 (Exactly one record created; zero duplicates)
```

---

## 5. How to Reproduce

### Run the Full Automated Test Suite (Self-Contained)
```bash
npm test
```
*Note: Test fixtures dynamically create and tear down test slots, ensuring full test isolation without requiring any manual database resets.*

### Run the Standalone Concurrency Verification Script
```bash
# Against local dev server (http://localhost:3000):
npm run test:concurrency

# Or inside the running Docker container:
npm run docker:test:concurrency
```
