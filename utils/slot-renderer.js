export function loadReservations(afterLoadCallback) {
  const year = document.getElementById('year').textContent;
  const month = document.getElementById('month').textContent.padStart(2, '0');
  const day = document.getElementById('day').textContent.padStart(2, '0');
  const targetDate1 = `${year}-${month}-${day}`;
  // Determine which dates to render based on the timeline’s height.
  let targetDates = [targetDate1];
  const timeline = document.getElementById("timeline");
  if (timeline.offsetHeight > 960) { // if two days are shown
    const targetDate2 = dayjs(targetDate1).add(1, 'day').format("YYYY-MM-DD");
    targetDates.push(targetDate2);
  }

  chrome.storage.local.get(["reservations"], (result) => {
    const reservations = result.reservations || {};
    clearRenderedReservations();
    targetDates.forEach((targetDate, dayIndex) => {
      const reservationsForDate = reservations[targetDate] || [];
      if (reservationsForDate.length === 0) {
        const noReservationsMessage = document.createElement("div");
        noReservationsMessage.classList.add("no-reservations-message");
        noReservationsMessage.textContent = `No reservations found for ${targetDate}.`;
        noReservationsMessage.style.userSelect = "none";
        noReservationsMessage.style.color = "#666";
        noReservationsMessage.style.textAlign = "center";
        chrome.storage.local.get("ymd", (data) => {
          const requestedDate = data.ymd ? data.ymd : "Unknown Data";
          const dayNames = ["(Sun)", "(Mon)", "(Tue)", "(Wed)", "(Thu)", "(Fri)", "(Sat)"];
          document.getElementById('dynamic-text').textContent = `Viewing ${requestedDate} ${dayNames[new Date(requestedDate).getDay()]}.`;
        });
        // Show text message if no reservation is present
        noReservationsMessage.style.top = `${dayIndex * 960}px`;
        document.getElementById("timeline").appendChild(noReservationsMessage);
      } else {
        reservationsForDate.forEach((res) => {
          renderReservationBlock(res, targetDate, dayIndex);
        });
      }
    });

    if (typeof afterLoadCallback === 'function') {
      afterLoadCallback();
    }
  });
};

export function renderReservationBlock(res, targetDate, dayIndex) {
  chrome.storage.local.get("ymd", (data) => {
    const requestedDate = data.ymd ? data.ymd : "Unknown Data";
    const dayNames = ["(Sun)", "(Mon)", "(Tue)", "(Wed)", "(Thu)", "(Fri)", "(Sat)"];
    document.getElementById('dynamic-text').textContent = `Viewing ${requestedDate} ${dayNames[new Date(requestedDate).getDay()]}.`;
  });
  
  const [startDate, startTime] = res.startTime.split(" ");
  const [endDate, endTime] = res.endTime.split(" ");
  const start = parseTimeToHours(startTime);
  const end = parseTimeToHours(endTime);

  // If the reservation spans midnight, split it into two parts.
  if (startDate !== endDate) {
    if (startDate === targetDate) {
      const adjustedRes = { ...res, endTime: `${startDate} 24:00` };
      renderSingleDayBlock(start, 24, adjustedRes, dayIndex);
    }
    if (endDate === targetDate) {
      const adjustedRes = { ...res, startTime: `${endDate} 00:00` };
      renderSingleDayBlock(0, end, adjustedRes, dayIndex);
    }
  } else {
    if (startDate === targetDate) {
      renderSingleDayBlock(start, end, res, dayIndex);
    }
  }
};

export function parseTimeToHours(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
};

export function hoursToMinutes(decimalHours) {
  return Math.round(decimalHours * 60);
};

export function renderSingleDayBlock(start, end, res, dayIndex) {
  const MINUTES_PER_DAY = 24 * 60;
  
  const startMin = hoursToMinutes(start) + dayIndex * MINUTES_PER_DAY;
  const endMin = hoursToMinutes(end) + dayIndex * MINUTES_PER_DAY;
  // Offset blocks in day 2 by 960px (the height of one day)
  const topPos = (dayIndex * 960) + Math.min(start, 24) * PX_PER_HOUR;
  const blockHeight = Math.max(0, (Math.min(end, 24) - start) * PX_PER_HOUR);

  const block = document.createElement("div");
  block.classList.add("reservation-block");
  block.style.top = `${topPos}px`;
  block.style.height = `${blockHeight}px`;

  block.dataset.startMin = startMin;
  block.dataset.endMin = endMin;

  // (Define your lab styles as before)
  const labStyles = {
    "Oguri": { backgroundColor: "#5BCAF5", outline: "1px solid #5bb7f5" },
    "Suga": { backgroundColor: "#CD212A", outline: "1px solid #bf1f27" },
    "Yamada": { backgroundColor: "#FFB951", outline: "1px solid #edac4c" },
    "Goda": { backgroundColor: "#0303EF", outline: "1px solid #0404D6" },
    "Tsukuda": { backgroundColor: "#54D6A9", outline: "1px solid #45B08B" },
    "Campbell": { backgroundColor: "#8E8EFF", outline: "1px solid #8E8EFF" },
    "Kobayashi": { backgroundColor: "#0303EF", outline: "1px solid #0404D6" },
    "Isobe": { backgroundColor: "#00AC00", outline: "1px solid #009E00" }
  };
  const defaultStyle = { backgroundColor: "#C0C0C0", outline: "1px solid #C0C0C0" };

  const labName = Object.keys(labStyles).find(name => res.lab === name);
  const { backgroundColor, outline } = labStyles[labName] || defaultStyle;
  block.style.backgroundColor = backgroundColor;
  block.style.outline = outline;

  const startTimeDisplay = res.startTime.split(' ')[1];
  const endTimeDisplay = res.endTime.split(' ')[1];

  block.title = `${res.name} (${res.lab})\n${startTimeDisplay} - ${endTimeDisplay}`;
  block.textContent = `${res.name} (${res.lab} Lab)\n${startTimeDisplay} - ${endTimeDisplay}`;

  document.getElementById("timeline").appendChild(block);
};

export function clearRenderedReservations() {
  const blocks = document.querySelectorAll('.reservation-block');
  const existingMessage = document.querySelector("#timeline .no-reservations-message");
  if (blocks) {
    blocks.forEach(block => block.remove());
  }
  if (existingMessage) {
    existingMessage.remove();
  }
};