# Concurrency Control Strategy

This document provides a concise explanation of how the API prevents simultaneous booking conflicts, satisfying **Submission Requirement 6**.

---

## 1. The Problem: Race Conditions (TOCTOU)

When two patients attempt to book the same appointment slot simultaneously:
- **Naive approach**: A `SELECT` query checks if the slot is free, followed by an `INSERT`.
- **The flaw**: Both requests execute the `SELECT` at the same instant, see the slot as available, and both execute `INSERT`, resulting in double-booking.

---

## 2. Our Defense-in-Depth Concurrency Strategy

To guarantee that an appointment slot can never be double-booked while maintaining deadlock immunity, the system implements a two-layer concurrency model:

```mermaid
sequenceDiagram
    autonumber
    actor ClientA as Request A (Patient 5001)
    actor ClientB as Request B (Patient 5002)
    participant API as AppointmentService
    participant DB as MSSQL Database

    Note over ClientA,ClientB: Both requests arrive at the identical millisecond for Slot 101

    ClientA->>API: POST /api/appointments/book (Slot 101, Patient 5001)
    ClientB->>API: POST /api/appointments/book (Slot 101, Patient 5002)

    API->>DB: BEGIN TRANSACTION (Request A)
    API->>DB: BEGIN TRANSACTION (Request B)

    API->>DB: Lock Slot & Check Booking: SELECT ... FROM AppointmentSlots WITH (UPDLOCK, ROWLOCK, HOLDLOCK) LEFT JOIN Appointments [Req A]
    Note over DB: Row lock acquired by Request A. Request B is queued/blocked at the row level.

    API->>DB: Check Patients table -> Patient Exists [Req A]
    API->>DB: INSERT INTO Appointments (SlotId=101, PatientId=5001) [Req A]
    API->>DB: COMMIT TRANSACTION [Req A]
    API-->>ClientA: 201 Created ("Appointment booked successfully")

    Note over DB: Lock released on commit. Request B unblocks and proceeds.
    API->>DB: Query evaluates for Req B -> a.AppointmentId IS NOT NULL (ALREADY BOOKED)
    API->>DB: ROLLBACK TRANSACTION [Req B]
    API-->>ClientB: 409 Conflict ("Appointment slot 101 is already booked")
```

### Layer 1: Pessimistic Row Locking with Combined Availability Check
When reading the slot inside the transaction in `AppointmentService.bookAppointment()`:
```sql
SELECT 
    s.SlotId, 
    s.DoctorId,
    a.AppointmentId
FROM dbo.AppointmentSlots s WITH (UPDLOCK, ROWLOCK, HOLDLOCK)
LEFT JOIN dbo.Appointments a ON s.SlotId = a.SlotId
WHERE s.SlotId = @slotId;
```
- **`UPDLOCK`**: Takes an update lock instead of a shared lock, signaling intent to modify.
- **`ROWLOCK`**: Restricts the lock strictly to the targeted slot row, leaving all other slots unblocked.
- **`HOLDLOCK`**: Holds the lock until the transaction is either committed or rolled back.
- **Atomic Availability Check**: The `LEFT JOIN` checks appointment existence in the exact same query that takes the lock. If `a.AppointmentId` is not null, the request aborts immediately.
- **Deadlock Immunity**: Locks are acquired on `AppointmentSlots` *only*. No locks are taken on `Appointments`, eliminating multi-table lock ordering cycles and key-range index locking on non-existent rows.

**Result**: Only one request can inspect the slot at a time; concurrent requests wait in a queue until the first transaction finishes.

---

### Layer 2: Database Unique Constraint (`UQ_Appointments_SlotId`)
Even under unforeseen race conditions or deadlocks, the database table enforces an inviolable physical guarantee:
```sql
CONSTRAINT UQ_Appointments_SlotId UNIQUE (SlotId)
```
- If two requests bypass application-level checks, Microsoft SQL Server's storage engine rejects the second `INSERT` with error `2601`/`2627` (Unique Constraint Violation).
- The service catches this violation and returns a clean `409 Conflict`.

---

## 3. Transaction Rollback & Consistency

All operations occur inside a dedicated `sql.Transaction`:
- If any validation fails or a conflict occurs, `transaction.rollback()` is immediately executed.
- No partial writes or orphaned records can ever be committed to the database.
