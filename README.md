# NMR Reserve Helper Extension

A Manifest V3 extension for making NMR reservations (JEOL JNM-ECS400) at UTokyo Chem Dept.

## Installation Guide

### Installation
1. **Download the extension**
   - Obtain the latest release zip file.
   - Extract to get a folder named `NMR Reserve Helper`.

2. **Load in Chrome/Edge**
   - For Chrome, navigate to `chrome://extensions/`.
   - For Edge, navigate to `edge://extensions/`.
   - Enable Developer Mode (toggle button).
   - Click the **Load unpacked** button.
   - Select the extracted folder and confirm (not the zip file).

## Usage Instructions

### Initial Setup
1. **Website Authentication**
   - Click the **Website Authentication** button.
   - Enter facility website credentials:
     - Username: common username provided by the Chem Dept.
     - Password: common password provided by the Chem Dept.
   - Click the **Save/Overwrite** button.

2. **User Information**
   - Click the **Edit Info** button.
   - Fill in the required fields:
     - Name: Your full name
     - Email: school/personal email
     - Phone: lab contact/personal phone number
     - Reservation Password: password for cancellation and report usage
     - Lab: Select your associated lab from the dropdown
     - Facility: Select the facility you would like to reserve
   - Click the **Save** button.

### Making Reservations
1. **Load Schedule**
   - Click the **Fetch/Refresh** button to load the current schedule.

2. **Select Time Slot**
   - Click and drag inside time table to create a reservation block.
   - Release the mouse to confirm the selection.
   - Right-click on a selection to remove it.

3. **Submit Reservation**
   - Click the **Reserve** button to submit.
   - The schedule will refresh automatically upon success.

### Interface Features
- **Date Picker**: Use the arrow buttons or double-click to edit the date.
- **Right Panel**: Displays real-time reservation status.
- **Orange Bar**: Indicates the current time (now indicator).
- **Colored Slots**: Indicate booked time periods with brief reserver info.
- **Translucent Blue Slot**: Indicates user-selected reservation period.

## Important Notes
- **Rate Limiting**: Avoid rapid consecutive refreshes or requests.
- **Data Security**: Credentials are stored locally using the Chrome Storage API; no external data is transmitted.
- **Compatibility**: Tested with Chrome and Edge (should work on all Chromium-based browsers).

## Troubleshooting
- **Invalid Credentials**: Re-enter website authentication credentials.
- **Time Selection Failed**: Check if the slot is available
- **No Schedule Loaded**: Click Refresh and check your network connection.

## Dependencies
- [dayjs](https://day.js.org/) (v1.11.10) – MIT Licensed.

## License
MIT License © 2024 HJ. Contains dayjs MIT-licensed code.
