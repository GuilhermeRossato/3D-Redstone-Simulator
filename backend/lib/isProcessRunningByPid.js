/**
 * Asynchronously checks if a process is running based on its PID.
 * @param {number} pid - The process ID to check.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the process is running.
 */
export async function isProcessRunningByPid(pid) {
  let yesCount = 0;
  let noCount = 0;

  // Iterates through 8 attempts to check if the process is running by sending a signal 0 to the specified PID.
  for (let i = 0; i < 8; i++) {
    try {
      process.kill(parseInt(pid.toString().trim()), 0);
      yesCount++;
    } catch (err) {
      noCount++;
    }

    // Waits for 70 milliseconds before the next attempt.
    await new Promise((r) => setTimeout(r, 70));
  }

  // Returns true if more successful attempts were made than failed attempts.
  return yesCount > noCount;
}
