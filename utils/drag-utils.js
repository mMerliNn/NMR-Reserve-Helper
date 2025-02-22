(function() {
  const PIXELS_PER_DAY = 960;
  const MINUTES_PER_DAY = 24 * 60;
  const GRID_INTERVAL = 5;
  const snapToGrid = PIXELS_PER_DAY / (MINUTES_PER_DAY / GRID_INTERVAL);

  const table = document.getElementById("timeline-container");
  const timeline = document.getElementById("timeline");
  if (!table) return; 

  let isDragging = false;
  let hasDragged = false;
  let startY = null;
  let endY = null;
  let selectionDiv = null;
  let removeText;
  
  // Check for overlap, then enable click and drag selection
  table.addEventListener("mousedown", (e) => {
    if (e.button === 2) return;

    if (e.target.classList.contains("reservation-block")) {
      console.log("Clicked on existing reservation block. Skipping.");
      return;
    }
    const existingSelection = document.querySelector(".selection-rectangle");
    if (existingSelection) {
      document.getElementById('dynamic-text').textContent = `One selection only!`;

      removeText = setTimeout(() => {
        document.getElementById('dynamic-text').textContent = ``;
      }, 2000);
      return;
    } else {
      chrome.storage.local.set({ timeData: {} });
    }

    isDragging = true;
    hasDragged = false;
    startY = Math.round(e.offsetY / snapToGrid) * snapToGrid;

    selectionDiv = document.createElement("div");
    selectionDiv.className = "selection-rectangle";
    selectionDiv.style.top = `${startY}px`;
    selectionDiv.style.left = `0`;
    selectionDiv.style.width = `100%`;
    selectionDiv.style.height = `${snapToGrid}px`;

    const timeInfoDiv = document.createElement("div");
    timeInfoDiv.className = "time-info";
    timeInfoDiv.style.top = `${startY + snapToGrid}px`;
    selectionDiv.appendChild(timeInfoDiv);
    timeline.appendChild(selectionDiv);

    endY = startY + snapToGrid;
  });

  // Snap block to nearest grid and update time info 
  table.addEventListener("mousemove", (e) => {
    if (isDragging && selectionDiv) {
      hasDragged = true;
      endY = Math.round(e.offsetY / snapToGrid) * snapToGrid;
      const top = Math.min(startY, endY);
      const height = Math.abs(startY - endY);
      selectionDiv.style.top = `${top}px`;
      selectionDiv.style.height = `${height}px`;

      const startObj = convertToTime(top);
      const endObj = convertToTime(top + height);
      // Save both the time and the day index
      selectionDiv.dataset.startMin = startObj.totalMinutes;
      selectionDiv.dataset.endMin   = endObj.totalMinutes;
      selectionDiv.dataset.dayIndexStart = startObj.dayIndex;
      selectionDiv.dataset.dayIndexEnd   = endObj.dayIndex;

      const timeInfoDiv = selectionDiv.querySelector(".time-info");
      updateTimeInfo(timeInfoDiv, top, top + height);
      
      const sStartMin = parseInt(selectionDiv.dataset.startMin, 10);
      const sEndMin   = parseInt(selectionDiv.dataset.endMin, 10);
      const overlaps = Array.from(document.querySelectorAll(".reservation-block")).some((block) => {
        const bStartMin = parseInt(block.dataset.startMin, 10);
        const bEndMin   = parseInt(block.dataset.endMin, 10);
        return sStartMin < bEndMin && sEndMin > bStartMin;
      });
  
      // Selection block turns red if overlap occurs
      if (overlaps) {
        selectionDiv.classList.add("overlap-warning");
      } else {
        selectionDiv.classList.remove("overlap-warning");
      }
      }
  });

  // Send reservation data upon mouse release
  table.addEventListener("mouseup", (e) => {
    if (isDragging) {
      isDragging = false;
      const defaultGrid = snapToGrid * 2;
      if (!hasDragged) {
        endY = startY + defaultGrid;
      }
      const top = Math.min(startY, endY);
      const height = Math.abs(startY - endY);
      // TODO: optimize it someday
      const EPSILON = 0.1;
      if (height + EPSILON < snapToGrid) {
        selectionDiv?.remove();
        selectionDiv = null;
        return;
      }
      const startObj = convertToTime(top);
      const endObj = convertToTime(top + height);
      selectionDiv.dataset.startMin = startObj.totalMinutes;
      selectionDiv.dataset.endMin   = endObj.totalMinutes;
      selectionDiv.dataset.dayIndexStart = startObj.dayIndex;
      selectionDiv.dataset.dayIndexEnd   = endObj.dayIndex;

      const timeInfoDiv = selectionDiv.querySelector(".time-info");
      updateTimeInfo(timeInfoDiv, top, top + height);

      const sStartMin = parseInt(selectionDiv.dataset.startMin, 10);
      const sEndMin   = parseInt(selectionDiv.dataset.endMin, 10);

      const anyOverlap = Array.from(document.querySelectorAll(".reservation-block")).some((block) => {
        const bStartMin = parseInt(block.dataset.startMin, 10);
        const bEndMin   = parseInt(block.dataset.endMin, 10);
        return (sStartMin < bEndMin && sEndMin > bStartMin);
      });

      if (anyOverlap) {
        document.getElementById('dynamic-text').textContent = `Overlap detected. Selection removed.`
        // Remove text after 2 seconds
        removeText = setTimeout(() => {
          document.getElementById('dynamic-text').textContent = ``;
        }, 2000);
        console.log("Overlap detected. Removing selection rectangle.");
        selectionDiv.remove();
        selectionDiv = null;
        return;
      }

      const timeData = {
        startHour: startObj.hour,
        startMinute: startObj.minute,
        endHour: endObj.hour,
        endMinute: endObj.minute,
        dayIndexStart: startObj.dayIndex,
        dayIndexEnd: endObj.dayIndex
      };

      chrome.storage.local.set({ timeData }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to save user reservation:", chrome.runtime.lastError.message);
        } else {
          console.log("User reservation stored:", timeData);
        }
      });

      selectionDiv.style.pointerEvents = "auto";
      startY = null;
      endY = null;

      selectionDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectionDiv.remove();
        chrome.storage.local.set({ timeData: {} });
        console.log("Removed:", timeData);
      });
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      if (selectionDiv) selectionDiv.remove();
    }
  });

  // 0.001 as epsilon to mediate double rouding error
  function convertToTime(y) {
    const dayIndex = Math.floor(y / PIXELS_PER_DAY);
    const yWithinDay = y % PIXELS_PER_DAY;
    const totalMinutes = Math.floor(((yWithinDay + 0.001) / PIXELS_PER_DAY) * MINUTES_PER_DAY);
    
    const snappedMinutes = Math.round(totalMinutes / GRID_INTERVAL) * GRID_INTERVAL;
    let hour = Math.floor(snappedMinutes / 60);
    let minute = snappedMinutes % 60;
    return {
      dayIndex, // 0: first day; 1: second day
      hour: hour.toString(),
      minute: String(minute).padStart(2,'0'),
      totalMinutes: dayIndex * MINUTES_PER_DAY + snappedMinutes
    };
  }

  // Display selection block time range
  function updateTimeInfo(div, startY, endY) {
    const start = convertToTime(startY);
    const end = convertToTime(endY);
    const startLabel = start.dayIndex > 0 ? `D+${start.dayIndex} ` : "";
    const endLabel = end.dayIndex > 0 ? `D+${end.dayIndex} ` : "";
    const startTime = `${startLabel}${start.hour}:${start.minute}`;
    const endTime = `${endLabel}${end.hour}:${end.minute}`;
    const duration = end.totalMinutes - start.totalMinutes;
    div.textContent = `${startTime} - ${endTime} (${duration} min)`;
    const rectangleHeight = parseFloat(selectionDiv.style.height);
    div.style.top = `${rectangleHeight}px`;
  }
})();