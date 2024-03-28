const countdownElement = document.getElementById("countdown");
function updateCountdown() {
  const targetDate = new Date('February 12, 2024 09:00:00 GMT-06:00');
  const currentDate = new Date();
  const totalSeconds = (targetDate - currentDate) / 1000;

  const days = Math.floor(totalSeconds / 3600 / 24);
  const hours = Math.floor(totalSeconds / 3600) % 24;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = Math.floor(totalSeconds) % 60;

  countdownElement ? countdownElement.innerHTML = `
        <div class="time-unit">
            <span class="number">${days}</span>
            <span class="label">Days</span>
        </div>
        <div class="time-unit">
            <span class="number">${hours}</span>
            <span class="label">Hours</span>
        </div>
        <div class="time-unit">
            <span class="number">${minutes}</span>
            <span class="label">Minutes</span>
        </div>
        <div class="time-unit">
            <span class="number">${seconds}</span>
            <span class="label">Seconds</span>
        </div>
    ` : console.log('countdownElement not found')
}


if  (countdownElement) {
    setInterval(updateCountdown, 1000);
} else {
    clearInterval(updateCountdown);
    return;
}
