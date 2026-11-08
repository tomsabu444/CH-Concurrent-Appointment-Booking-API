/**
 * ==============================================================================
 * Technical Assessment Deliverable: Concurrent Testing Script
 * Problem: Concurrent Doctor Appointment Booking API
 *
 * Core Requirement:
 *   - SlotId = 101 is available in the database.
 *   - Request A: { slotId: 101, patientId: 5001 }
 *   - Request B: { slotId: 101, patientId: 5002 }
 *   - Both requests reach the backend simultaneously.
 *   - Exactly ONE request must succeed (201 Created).
 *   - The other request must receive a booking conflict (409 Conflict).
 *
 * This script is a pure HTTP client test harness with zero direct database
 * coupling or destructive cleanup logic.
 * ==============================================================================
 */

interface BookingResponse {
  clientLabel: string;
  patientId: number;
  slotId: number;
  status: number;
  durationMs: number;
  data: any;
}

interface TestAssertionResult {
  passed: boolean;
  successCount: number;
  conflictCount: number;
  otherCount: number;
}

// Constants for the test configuration

const API_BASE_URL = 'http://localhost:3000';
const TARGET_SLOT_ID = 101;
const PATIENT_A_ID = 5001;
const PATIENT_B_ID = 5002;

/**
 * Sends a single appointment booking HTTP request to the API.
 */
async function sendBookingRequest(
  clientLabel: string,
  slotId: number,
  patientId: number
): Promise<BookingResponse> {
  const url = `${API_BASE_URL}/api/appointments/book`;
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ slotId, patientId }),
    });

    const durationMs = Date.now() - startTime;
    let data: any = null;

    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return {
      clientLabel,
      patientId,
      slotId,
      status: response.status,
      durationMs,
      data,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    return {
      clientLabel,
      patientId,
      slotId,
      status: 0,
      durationMs,
      data: { error: error.message },
    };
  }
}

/**
 * Executes simultaneous concurrent booking requests against the target slot
 * and verifies that race condition safety invariants are strictly upheld.
 */
async function runConcurrentBookingTest(
  slotId: number = TARGET_SLOT_ID,
  patientA: number = PATIENT_A_ID,
  patientB: number = PATIENT_B_ID
): Promise<TestAssertionResult> {
  console.log('\n================================================================');
  console.log('       CARITAS HOSPITAL - CONCURRENT BOOKING TEST SUITE        ');
  console.log('================================================================');
  console.log(`API Endpoint:  ${API_BASE_URL}/api/appointments/book`);
  console.log(`Target SlotId: ${slotId}`);
  console.log(`Request A:     Patient ${patientA}`);
  console.log(`Request B:     Patient ${patientB}`);
  console.log('----------------------------------------------------------------');
  console.log('Dispatching parallel requests simultaneously via Promise.all()...\n');

  // Trigger both requests at the identical moment
  const [resultA, resultB] = await Promise.all([
    sendBookingRequest('Request A', slotId, patientA),
    sendBookingRequest('Request B', slotId, patientB),
  ]);

  const results = [resultA, resultB];

  // Print individual request outcomes
  results.forEach((res) => {
    const tag =
      res.status === 201
        ? '[201 CREATED]'
        : res.status === 409
        ? '[409 CONFLICT]'
        : `[STATUS ${res.status}]`;

    const message = res.data?.message || JSON.stringify(res.data);
    console.log(`  ${res.clientLabel} (Patient ${res.patientId}): ${tag} in ${res.durationMs}ms -> ${message}`);
  });

  const successCount = results.filter((r) => r.status === 201).length;
  const conflictCount = results.filter((r) => r.status === 409).length;
  const otherCount = results.filter((r) => r.status !== 201 && r.status !== 409).length;

  console.log('\n----------------------------------------------------------------');
  console.log('Verifying Concurrency Invariants:');
  console.log(`  - 201 Created (Success):  ${successCount} (Expected: 1)`);
  console.log(`  - 409 Conflict (Handled): ${conflictCount} (Expected: 1)`);
  console.log(`  - Unexpected Responses:   ${otherCount} (Expected: 0)`);
  console.log('----------------------------------------------------------------');

  const passed = successCount === 1 && conflictCount === 1 && otherCount === 0;

  if (passed) {
    console.log('>>> RESULT: PASSED');
    console.log('    Concurrency guarantee satisfied: exactly one patient booked the slot,');
    console.log('    and the simultaneous duplicate request was safely rejected.\n');
  } else {
    console.error('>>> RESULT: FAILED');
    console.error('    Concurrency guarantee violated: expected 1 success and 1 conflict.\n');
  }

  return { passed, successCount, conflictCount, otherCount };
}

/**
 * Main execution entry point.
 */
async function main(): Promise<void> {
  try {
    const result = await runConcurrentBookingTest();
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('Unexpected fatal error during test execution:', error);
    process.exit(1);
  }
}

// Execute when run directly
main();
