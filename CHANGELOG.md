# Changelog

## [2025-02-16]
### Added
- Error messages are now available to users through the top status window.

## [2025-02-12]
### Fixed
- The now indicator will only be present on the current day.

## [2025-02-07]
### Added
- Recreated time picker.
- Added a status window showing viewing date and user guide.

### Fixed
- Applying Tokyo time correctly to the extension.

## [2025-02-06]
### Fixed
- Fixed a bug where user-selected blocks did not get removed after refresh or making a reservation.

## [2025-02-05]
### Fixed
- Fixed a bug where user selection would persist after closing the popup.
- Fixed an issue where `timeData` was not cleared upon refresh.

## [2025-02-01]
### Added
- Implemented the cross-day reservation feature.

### Fixed
- Fixed a bug where a user-created block between two close reservations would get removed even when no overlap was observed.

## [2025-01-31]
### Added
- Added a feature to display the date of the reservation table.

### Fixed
- Fixed a bug where a single click could create a reservation block that overlaps with existing reservations.

---

## Known Issues
<!-- - The current time bar is displayed for all dates.  -->
<!-- - The current time is based on the user's system time rather than Tokyo time, which the server follows. -->
<!-- - Error information is not currently displayed to users. (fetching before inputing user info) -->
<!-- - On Toggle mode, if the second day is empty, a "no reservation found" will appear on the top. -->
<!-- - No user guide -->
- Cross-day reservations are rendered as two separate blocks.
- Users can use click and drag before current date.
- This extension is written by a newbie.

## Upcoming Features
- Better appearance with customizable wallpaper.
- Display the facility name on the timetable.
- Support reservation of all Chemistry department facilities.
<!-- - Display error information to users. -->
- Implement a user guide.
- Add support for the traditional input method.
- Add foolproof functions to prevent repetitive fetch and post requests.
- Enable the "Reserve" feature only in the presence of a valid reservation block.