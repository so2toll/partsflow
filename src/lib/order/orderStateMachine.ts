/**
 * Order Status State Machine
 *
 * Defines valid state transitions for order lifecycle and provides validation.
 * Prevents invalid status changes that could corrupt order tracking.
 *
 * State Transitions:
 * pending → dispatched → picked_up → en_route → delivered → confirmed
 * Any state → cancelled (except terminal states)
 */

// Valid state transitions
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['dispatched', 'cancelled'],
  dispatched: ['picked_up', 'cancelled'],
  picked_up: ['en_route', 'cancelled'],
  en_route: ['delivered', 'cancelled'],
  delivered: ['confirmed'],
  confirmed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Check if a state transition is valid
 */
export function canTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedNext = ORDER_TRANSITIONS[currentStatus] || [];
  return allowedNext.includes(newStatus);
}

/**
 * Get the next allowed statuses for a given current status
 */
export function getNextAllowedStatuses(currentStatus: string): string[] {
  return ORDER_TRANSITIONS[currentStatus] || [];
}

/**
 * Validate a state transition
 *
 * @returns Object with valid boolean and optional error message
 */
export function validateTransition(
  currentStatus: string,
  newStatus: string
): { valid: boolean; error?: string } {
  // Check if current status is valid
  if (!ORDER_TRANSITIONS[currentStatus]) {
    return { valid: false, error: `Unknown status: ${currentStatus}` };
  }

  // Check if new status is valid
  if (!canTransition(currentStatus, newStatus)) {
    const allowed = getNextAllowedStatuses(currentStatus);
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
    };
  }

  return { valid: true };
}

/**
 * Check if a status is a terminal state (cannot be changed)
 */
export function isTerminalStatus(status: string): boolean {
  const allowedNext = ORDER_TRANSITIONS[status] || [];
  return allowedNext.length === 0;
}

/**
 * Get all valid order statuses
 */
export function getAllStatuses(): string[] {
  return Object.keys(ORDER_TRANSITIONS);
}
