module.exports = function createTimeoutPromise(timeoutDuration, errorMessage = "Fetch timed out") {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutDuration);
  });
}