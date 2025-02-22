const HOURS_PER_DAY = 24;
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

// Update drawHourLines to loop over the total number of hours
export function drawHourLines(daysShown = 1) {
  const fragment = document.createDocumentFragment();
  const labelFragment = document.createDocumentFragment();
  const timeline = document.getElementById("timeline");
  const totalHours = 24 * daysShown;

  for (let hour = 0; hour <= totalHours; hour++) {
    const topPos = hour * PX_PER_HOUR;
    const line = document.createElement("div");
    line.className = "hour-line";
    line.style.top = `${topPos}px`;
    fragment.appendChild(line);

    const label = document.createElement("div");
    label.className = "hour-label";
    label.style.top = `${topPos}px`;
    // Time table shows from 0:00 to 23:00
    const dayIndex = Math.floor(hour / 24);
    const hourLabel = hour % 24;
    // 24:00 to second date: D+1 time
    label.textContent = dayIndex > 0 ? `D+${dayIndex} ${hourLabel}:00` : `${hourLabel}:00`;
    labelFragment.appendChild(label);
  }
  timeline.appendChild(fragment);
  document.getElementById("hour-labels").appendChild(labelFragment);
};

export function initializeTimeline(daysShown = 1) {
  // Each day is 960px high:
  const timelineHeight = 960 * daysShown;
  const timeline = document.getElementById("timeline");
  timeline.style.height = `${timelineHeight}px`;
  window.PX_PER_HOUR = 960 / HOURS_PER_DAY;
};

export function addOrUpdateCurrentTimeLine() {
  const timeline = document.getElementById("timeline");
  let nowLine = document.getElementById("current-time-line");
  if (!nowLine) {
    nowLine = document.createElement("div");
    nowLine.id = "current-time-line";
    nowLine.className = "current-time-line";
    timeline.appendChild(nowLine);
  }
  updateCurrentTimeLinePosition();
};

export function updateCurrentTimeLinePosition() {
  const nowTokyo = dayjs().tz("Asia/Tokyo");

  const yearInput = document.getElementById('year').textContent;
  const monthInput = document.getElementById('month').textContent;
  const dayInput = document.getElementById('day').textContent;

  const timelineDate = dayjs.tz(`${yearInput}-${monthInput}-${dayInput}`, "Asia/Tokyo");

  const nowLine = document.getElementById("current-time-line");

  if (timelineDate.isSame(nowTokyo, 'day')) {
    const currentHourDecimal = nowTokyo.hour() + nowTokyo.minute() / 60;
    const topPos = currentHourDecimal * PX_PER_HOUR;
    if (nowLine) {
      nowLine.style.top = `${topPos}px`;
      nowLine.style.display = "block";
    }
  } else {
    if (nowLine) {
      nowLine.style.display = "none";
    }
  }
};