import { loadReservations } from './utils/slot-renderer.js';
import { 
  initializeTimeline, 
  drawHourLines, 
  addOrUpdateCurrentTimeLine, 
  updateCurrentTimeLinePosition 
} from './utils/time-renderer.js';
import { makeReservation } from './utils/reservation-service.js';

// Load Day.js plugins
dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

const TIMELINE_HEIGHT = 960; 
const TIMEZONE = 'Asia/Tokyo';  // Day.js timezone
const MIN_YEAR_OFFSET = -3;
const MAX_YEAR_OFFSET = 3;
const UPDATE_INTERVAL = 10000;  // Update now indicator every 10 seconds

// State management
const appState = {
  daysShown: 1,
  date: {
    current: dayjs().tz(TIMEZONE),
    minYear: null,
    maxYear: null,
    get displayDate() {
      return {
        year: this.current.year(),
        month: this.current.month() + 1,
        day: this.current.date()
      };
    }
  }
};

// DOM Elements
const dom = {
  timelineContainer: null,
  timeline: null,
  hourLabels: null,
  authForm: null,
  dateElements: {
    year: null,
    month: null,
    day: null
  },
  buttons: {
    toggleDays: null,
    request: null,
    dateAdjusters: {}
  }
};

function initializeApp() {
  // Limit user date access. Actual available years: -3 to +5 (but why lol)
  appState.date.minYear = appState.date.current.year() + MIN_YEAR_OFFSET;
  appState.date.maxYear = appState.date.current.year() + MAX_YEAR_OFFSET;

  // Update now indicator every _ seconds (10s work just fine)
  initializeTimeline(appState.daysShown);
  drawHourLines(appState.daysShown);
  addOrUpdateCurrentTimeLine();
  setInterval(updateCurrentTimeLinePosition, UPDATE_INTERVAL);

  // Handles first row buttons: fetch, reserve, and toggle
  dom.authForm.addEventListener('submit', handleAuthSubmit);
  dom.buttons.request.addEventListener('click', makeReservation);
  dom.buttons.toggleDays.addEventListener('click', handleDaysToggle);

  // Click on arrows to adjust date
  Object.entries(dom.buttons.dateAdjusters).forEach(([id, element]) => {
    const [type, direction] = id.split('-');
    element.addEventListener('click', () => 
      adjustDate(type, direction === 'up'));
  });

  // Double click to manually adjust date
  Object.entries(dom.dateElements).forEach(([type, element]) => {
    element.addEventListener('dblclick', () => 
      handleDateEdit(element, type, appState.date.displayDate[type]));
  });
}

// Render time table based on toggle status (default off: 1 day; on: 2 days)
function handleDaysToggle() {
  chrome.storage.local.set({ timeData: {} });
  appState.daysShown = appState.daysShown === 1 ? 2 : 1;
  
  dom.timelineContainer.style.height = `${TIMELINE_HEIGHT * appState.daysShown}px`;
  dom.timeline.innerHTML = '';
  dom.hourLabels.innerHTML = '';

  initializeTimeline(appState.daysShown);
  drawHourLines(appState.daysShown);
  addOrUpdateCurrentTimeLine();
}

// Check credentials, fetch HTML, and render reservation blocks
async function handleAuthSubmit(e) {
  e.preventDefault();
  const existingSelection = document.querySelector('.selection-rectangle');
  if (existingSelection) {
    existingSelection.remove();
    chrome.storage.local.set({ timeData: {} });
  }

  try {
    const authData = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['webAuthentication'], ({ webAuthentication }) => 
        webAuthentication ? resolve(webAuthentication) : reject('No authentication data'));
    });

    const credentials = {
      username: atob(authData.webUsername),
      password: atob(authData.webPassword),
      ...appState.date.displayDate,
      daysShown: appState.daysShown
    };

    const response = await chrome.runtime.sendMessage({
      action: 'fetchHTML',
      ...credentials
    });

    if (response.success) {
      loadReservations(() => {
        chrome.storage.local.remove('reservations');
        document.getElementById('fetch').disabled = false;
      });
    } else {
      showError(response.error);
    }
  } catch (error) {
    showError(error);
  }
}

// ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ Functions that handle dates ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓
function handleDateEdit(element, type, currentValue) {
  const input = document.createElement('input');
  input.type = 'number';
  input.value = currentValue;
  input.min = type === 'year' ? appState.date.minYear : 1;
  input.max = type === 'year' ? appState.date.maxYear : 
                type === 'month' ? 12 : 
                daysInMonth(appState.date.displayDate.year, appState.date.displayDate.month);

  element.innerHTML = '';
  element.appendChild(input);
  input.focus();

  const commit = () => {
    const newValue = Math.min(Math.max(parseInt(input.value, 10), input.min), input.max);
    if (type === 'day') {
      appState.date.current = appState.date.current.date(newValue);
    } else {
      appState.date.current = type === 'year' 
        ? appState.date.current.year(newValue)
        : appState.date.current.month(newValue - 1);
    }
    updateDateDisplay();
  };

  input.addEventListener('keydown', e => e.key === 'Enter' && commit());
  input.addEventListener('blur', commit);
}

function adjustDate(type, increment) {
  const methods = {
    year: (d, v) => d.year(v),
    month: (d, v) => d.month(v - 1),
    day: (d, v) => d.date(v)
  };

  const currentValue = appState.date.displayDate[type];
  const maxValue = type === 'year' ? appState.date.maxYear :
                   type === 'month' ? 12 :
                   daysInMonth(appState.date.displayDate.year, appState.date.displayDate.month);

  const newValue = increment ? 
    Math.min(currentValue + 1, maxValue) : 
    Math.max(currentValue - 1, type === 'year' ? appState.date.minYear : 1);

  appState.date.current = methods[type](appState.date.current, newValue);
  updateDateDisplay();
}

function updateDateDisplay() {
  Object.entries(dom.dateElements).forEach(([type, element]) => {
    element.textContent = appState.date.displayDate[type];
  });
}

function daysInMonth(year, month) {
  return dayjs(`${year}-${month}`).daysInMonth();
}
// ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ Functions that handle dates ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ ↑ 

function showError(message) {
  document.getElementById('dynamic-text').textContent = `Error: ${message}`;
  console.info(message);
}

function updateStatus() {
  const internetStatus = document.getElementById('dynamic-text');
  if (navigator.onLine) {
    internetStatus.textContent = "May your synthesis go well (´・ω・`)";
  } else {
    internetStatus.textContent = "No internet connection!";
  };
}

// Upon DOM fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  dom.timelineContainer = document.getElementById('timeline-container');
  dom.timeline = document.getElementById('timeline');
  dom.hourLabels = document.getElementById('hour-labels');
  dom.authForm = document.getElementById('authForm');
  dom.buttons.toggleDays = document.getElementById('toggle-days');
  dom.buttons.request = document.getElementById('request');
  
  // Date displays
  dom.dateElements.year = document.getElementById('year');
  dom.dateElements.month = document.getElementById('month');
  dom.dateElements.day = document.getElementById('day');

  // Date adjust buttons
  dom.buttons.dateAdjusters = {
    'year-up': document.getElementById('year-up'),
    'year-down': document.getElementById('year-down'),
    'month-up': document.getElementById('month-up'),
    'month-down': document.getElementById('month-down'),
    'day-up': document.getElementById('day-up'),
    'day-down': document.getElementById('day-down')
  };

  updateStatus();
  window.addEventListener("offline", updateStatus);
  window.addEventListener("online", updateStatus);

  // Initialize user selection
  chrome.storage.local.set({ timeData: {} });
  updateDateDisplay();
  initializeApp();
});

// Hi there :P