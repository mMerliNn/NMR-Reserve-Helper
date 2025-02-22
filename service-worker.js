importScripts('./libs/dayjs.min.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchHTML') {
    chrome.storage.local.get(['userInfo'], (data) => {
      if (!data.userInfo || !data.userInfo.resFacility) {
        return sendResponse({ success: false, error: "No facility found in storage" });
      }
      let FACILITY_UID = data.userInfo.resFacility;
    
    
    // Default to day 1 if nothing is provided)
    const daysShown = request.daysShown || 1;
    const authHeader = 'Basic ' + btoa(`${request.username}:${request.password}`);

    const baseDate = dayjs(
      `${request.year}-${String(request.month).padStart(2, '0')}-${String(request.day).padStart(2, '0')}`,
      "YYYY-MM-DD"
    );
    // Build the URL for the base date (first day)
    const requestDayStr = `${request.year},${request.month},${request.day}`;
    const fetchUrl1 = `https://www.chem.s.u-tokyo.ac.jp/users/facility/home/system/index.cgi?p=fadt&id=${FACILITY_UID}&ymd=${requestDayStr}`;

    // Fetch for day 1:
    const fetch1 = fetch(fetchUrl1, { headers: { 'Authorization': authHeader } })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.text();
      });

    // If extended view (daysShown > 1) fetch day 2 as well
    let fetch2 = Promise.resolve("");
    if (daysShown > 1) {
      const nextDay = baseDate.add(1, 'day');
      const nextDayStr = `${nextDay.year()},${nextDay.month() + 1},${nextDay.date()}`;
      const fetchUrl2 = `https://www.chem.s.u-tokyo.ac.jp/users/facility/home/system/index.cgi?p=fadt&id=${FACILITY_UID}&ymd=${nextDayStr}`;
      fetch2 = fetch(fetchUrl2, { headers: { 'Authorization': authHeader } })
        .then(response => {
          if (!response.ok) throw new Error(`HTTP error ${response.status}`);
          return response.text();
        });
    }

    Promise.all([fetch1, fetch2])
      .then(([html1, html2]) => {
        // Parse the first day with extractDetHoverData
        const parsedData1 = extractDetHoverData(html1, baseDate.format("YYYY-MM-DD"));
        // Start with day-1’s data.
        let combinedData = parsedData1;
        // If fetching data for day 2, parse and merge two groups.
        if (daysShown > 1 && html2) {
          const baseDate2 = baseDate.add(1, 'day');
          const parsedData2 = extractDetHoverData(html2, baseDate2.format("YYYY-MM-DD"));
          for (const date in parsedData2) {
            if (combinedData[date]) {
              combinedData[date] = combinedData[date].concat(parsedData2[date]);
            } else {
              combinedData[date] = parsedData2[date];
            }
          }
        }
        // Save the combined reservations and the “base day” for later use
        const reserveymd = requestDayStr;
        chrome.storage.local.set({ 
          reservations: combinedData,
          ymd: reserveymd
        }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      })
      .catch(error => {
        console.info(`Fetch / parse failed:`, error);
        alert(error);
        sendResponse({ success: false, error: error.message });
      });
    });
    return true;
  }
});

// -------------------------------------------------
function adjustYearForDate(month, day, baseDate) {
  const baseYear = baseDate.year();
  const candidates = [
    dayjs(`${baseYear - 1}-${month}-${day}`, 'YYYY-M-D'), // Previous year
    dayjs(`${baseYear}-${month}-${day}`, 'YYYY-M-D'),     // Same year
    dayjs(`${baseYear + 1}-${month}-${day}`, 'YYYY-M-D')  // Next year
  ].filter(d => d.isValid());

  let closestDate = null;
  let minDiff = Infinity;
  candidates.forEach(candidate => {
    const diff = Math.abs(candidate.diff(baseDate, 'day'));
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = candidate;
    }
  });
  return closestDate || dayjs(`${baseYear}-${month}-${day}`, 'YYYY-M-D');
}

function parseDateTime(dateTimeStr, baseDate) {
  const [datePart, timePart] = dateTimeStr.split(/\s+/);
  const [month, day] = datePart.split('/').map(Number);
  const [hours, minutes] = (timePart || '00:00').split(':').map(Number);

  const adjustedDate = adjustYearForDate(month, day, baseDate);
  return adjustedDate.hour(hours).minute(minutes);
}

function extractDetHoverData(htmlString, requestedDate) {
  const baseDate = dayjs(requestedDate, "YYYY-MM-DD");

  const detHoverMatch = htmlString.match(/var\s+DetHover\s*=\s*(\[[\s\S]*?\]);/);
  if (!detHoverMatch) {
    throw new Error("Could not find DetHover data in HTML");
  }

  let reservations;
  try {
    reservations = JSON.parse(detHoverMatch[1]);
  } catch (err) {
    throw new Error("Failed to parse DetHover JSON: " + err.message);
  }

  const parsedReservations = reservations.map(res => {
    let [startSide, endSideRaw] = res.time.split('～').map(str => str.trim());
    const startTime = parseDateTime(startSide, baseDate);

    if (!endSideRaw.includes('/')) {
      endSideRaw = `${startSide.split(' ')[0]} ${endSideRaw}`;
    }
    let endTime = parseDateTime(endSideRaw, baseDate);

    // If the endTime is before the startTime, assume it crosses midnight.
    if (endTime.isBefore(startTime)) {
      endTime = endTime.add(1, 'day');
    }

    // Remove any HTML tags from res.det: (targeting external reservations)
    let sanitizedDet = res.det.replace(/<[^>]*>/g, "").trim();
    const parts = sanitizedDet.split(' / ');
    let name = '';
    let lab = '';
    let labInfo = '';

    if (parts.length === 2) {
      name = parts[0].trim();
      const labMatch = parts[1].match(/^(.+?)（(.+?)）$/);
      if (labMatch) {
        lab = labMatch[1].trim();
        labInfo = labMatch[2].trim();
      } else {
        lab = parts[1].trim();
      }
    } else {
      name = sanitizedDet;
    }

    return {
      name,
      lab,
      labInfo,
      startTime: startTime.format("YYYY-MM-DD HH:mm"),
      endTime: endTime.format("YYYY-MM-DD HH:mm")
    };
  });

  // Sort reservations by start time.
  parsedReservations.sort((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));

  // Group reservations by date. 
  // If a reservation spans midnight, add it to both groups.
  const groupedByDate = {};
  parsedReservations.forEach((res) => {
    const startDate = res.startTime.split(" ")[0];
    const endDate = res.endTime.split(" ")[0];

    if (!groupedByDate[startDate]) groupedByDate[startDate] = [];
    groupedByDate[startDate].push(res);

    if (startDate !== endDate) {
      if (!groupedByDate[endDate]) groupedByDate[endDate] = [];
      groupedByDate[endDate].push(res);
    }
  });

  return groupedByDate;
}
