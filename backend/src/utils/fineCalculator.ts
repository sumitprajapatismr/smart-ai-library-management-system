export const DAILY_FINE_RATE = 2.0; // Charge $2.00 per day overdue

/**
 * Calculates the fine amount for a borrow record based on due date.
 * If returned, calculates up to return date; otherwise, calculates up to current date.
 */
export const calculateFine = (dueDate: Date, returnDate?: Date): number => {
  const endDate = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(dueDate);

  if (endDate <= due) {
    return 0;
  }

  // Calculate difference in milliseconds
  const diffTime = Math.abs(endDate.getTime() - due.getTime());
  // Convert to days (rounded up)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays * DAILY_FINE_RATE;
};
