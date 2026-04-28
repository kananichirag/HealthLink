# Requirements Document

## Introduction

This document specifies requirements for enhancing the existing appointment booking and management system. The enhancements improve the user experience for both patients and doctors by updating the current UI with better controls, implementing cancellation rules, adding rescheduling functionality, and providing clear visual feedback for appointment states. All changes will be applied to the existing frontend and backend flows.

## Glossary

- **Patient_Portal**: The web interface used by patients to book and manage appointments
- **Doctor_Portal**: The web interface used by doctors to view and manage appointments
- **Appointment_System**: The backend service that manages appointment scheduling, cancellation, and rescheduling
- **Booking_Form**: The UI component where patients select doctor, date, and time slot
- **Appointment_Card**: The UI component displaying appointment details
- **Time_Slot**: A specific time period (e.g., "2:00 PM") when an appointment can be scheduled
- **Cancellation_Window**: The 30-minute period before an appointment during which cancellation is prohibited
- **Overdue_Appointment**: An appointment whose scheduled time has passed but status remains SCHEDULED
- **Rescheduled_Tag**: A visual indicator showing an appointment has been rescheduled

## Requirements

### Requirement 1: Patient Appointment Booking UI Enhancements

**User Story:** As a patient, I want an improved booking interface with better controls, so that I can easily select doctors, dates, and time slots.

#### Acceptance Criteria

1. THE Booking_Form SHALL update the existing dropdown UI for doctor selection with improved styling
2. WHEN a patient selects a date, THE Booking_Form SHALL disable all past dates in the existing date picker
3. WHEN available time slots are displayed, THE Booking_Form SHALL update the existing time display to AM/PM format (e.g., "2:00 PM")
4. THE Booking_Form SHALL enhance the existing time slot selection UI with improved input controls
5. THE Booking_Form SHALL add a terms and conditions checkbox with text "You cannot cancel this appointment if 30 minutes or less remain before the appointment time"
6. WHEN all required fields are filled, THE Booking_Form SHALL enable the confirmation button
7. WHEN any required field is empty or invalid, THE Booking_Form SHALL display an error message indicating which field needs attention

### Requirement 2: Patient Appointment Cancellation Rules

**User Story:** As a patient, I want clear cancellation rules enforced, so that I understand when I can cancel appointments.

#### Acceptance Criteria

1. WHEN a patient attempts to cancel an appointment, THE Appointment_System SHALL calculate the time remaining until the appointment
2. IF less than 30 minutes remain before the appointment time, THEN THE Appointment_System SHALL reject the cancellation request with error message "Cannot cancel appointment within 30 minutes of scheduled time"
3. WHEN 30 minutes or more remain before the appointment time, THE Appointment_System SHALL allow the cancellation
4. WHEN a patient clicks cancel on an appointment, THE Patient_Portal SHALL display a confirmation popup with message "Are you sure you want to cancel this appointment?" and Yes/No buttons
5. WHEN the patient clicks Yes in the confirmation popup, THE Patient_Portal SHALL submit the cancellation request
6. WHEN the patient clicks No in the confirmation popup, THE Patient_Portal SHALL close the popup without canceling

### Requirement 3: Patient Appointment Rescheduling

**User Story:** As a patient, I want to reschedule appointments, so that I can change the time if my schedule changes.

#### Acceptance Criteria

1. WHEN an appointment status is SCHEDULED, THE Appointment_Card SHALL display a "Reschedule" button
2. WHEN a patient attempts to reschedule an appointment, THE Appointment_System SHALL apply the same 30-minute cancellation rule
3. IF less than 30 minutes remain before the appointment time, THEN THE Appointment_System SHALL reject the reschedule request with error message "Cannot reschedule appointment within 30 minutes of scheduled time"
4. WHEN a patient clicks the Reschedule button, THE Patient_Portal SHALL display a form to select new date and time slot
5. WHEN a patient confirms the reschedule, THE Appointment_System SHALL update the appointment with the new date and time
6. WHEN an appointment is rescheduled, THE Appointment_System SHALL add a "Rescheduled" tag to the appointment record

### Requirement 4: Doctor Appointment Management

**User Story:** As a doctor, I want to view and manage all patient appointments, so that I can track my schedule and handle appointment changes.

#### Acceptance Criteria

1. THE Doctor_Portal SHALL display all appointments in the Appointments tab
2. WHEN displaying appointments, THE Doctor_Portal SHALL show appointment time, patient name, status, and any tags
3. THE Doctor_Portal SHALL allow doctors to cancel any appointment regardless of time remaining
4. WHEN a doctor clicks cancel on an appointment, THE Doctor_Portal SHALL display a confirmation popup with message "Are you sure you want to cancel this appointment?" and Yes/No buttons
5. WHEN the doctor clicks Yes in the confirmation popup, THE Doctor_Portal SHALL submit the cancellation request
6. WHEN an appointment's scheduled time has passed and status is SCHEDULED, THE Doctor_Portal SHALL display label "This appointment is overdue"
7. WHEN an appointment is overdue, THE Doctor_Portal SHALL display a "Reschedule" button
8. WHEN a doctor reschedules an overdue appointment, THE Appointment_System SHALL update the appointment with the new date and time
9. WHEN an appointment has been rescheduled, THE Appointment_Card SHALL display a "Rescheduled" tag

### Requirement 5: Doctor Schedule Time Format

**User Story:** As a doctor, I want to see my schedule in AM/PM format, so that I can easily understand my availability.

#### Acceptance Criteria

1. WHEN displaying weekly availability in the Schedule tab, THE Doctor_Portal SHALL format all times in AM/PM format (e.g., "9:00 AM - 5:00 PM")
2. THE Doctor_Portal SHALL provide an improved input UI for time slot selection when setting availability

### Requirement 6: Form Validation and Error Handling

**User Story:** As a user, I want clear validation messages, so that I understand what information is required and what went wrong.

#### Acceptance Criteria

1. WHEN a required field is empty, THE system SHALL display an error message "This field is required"
2. WHEN a date in the past is selected, THE system SHALL display an error message "Please select a future date"
3. WHEN no time slot is selected, THE system SHALL display an error message "Please select a time slot"
4. WHEN a network error occurs, THE system SHALL display an error message "Unable to connect. Please check your connection and try again"
5. WHEN a server error occurs, THE system SHALL display the error message returned by the server
6. THE system SHALL display all error messages in a consistent format with an error icon
7. THE system SHALL display all success messages in a consistent format with a success icon

### Requirement 7: Appointment Status Management

**User Story:** As the system, I want to track appointment states accurately, so that users see correct information.

#### Acceptance Criteria

1. WHEN an appointment is created, THE Appointment_System SHALL set status to SCHEDULED
2. WHEN an appointment is cancelled, THE Appointment_System SHALL set status to CANCELLED
3. WHEN an appointment is completed, THE Appointment_System SHALL set status to COMPLETED
4. THE Appointment_System SHALL preserve the original scheduled time even when an appointment is rescheduled
5. WHEN an appointment is rescheduled, THE Appointment_System SHALL store the new date and time
6. THE Appointment_System SHALL maintain a rescheduled flag to indicate if an appointment has been rescheduled

### Requirement 8: UI Theme Consistency

**User Story:** As a user, I want consistent visual design, so that the interface feels cohesive.

#### Acceptance Criteria

1. THE system SHALL apply the application theme colors to all confirmation popups
2. THE system SHALL apply the application theme colors to all buttons (Yes/No, Cancel, Reschedule)
3. THE system SHALL use consistent spacing and typography across all appointment-related components
4. THE system SHALL use consistent border radius and shadow styles for all cards and popups

### Requirement 9: Documentation

**User Story:** As a developer or user, I want clear documentation, so that I understand the features and rules.

#### Acceptance Criteria

1. THE system SHALL include a markdown documentation file explaining all appointment features
2. THE documentation SHALL describe the 30-minute cancellation rule
3. THE documentation SHALL describe the rescheduling process
4. THE documentation SHALL describe the difference between patient and doctor cancellation permissions
5. THE documentation SHALL describe how overdue appointments are identified and handled
6. THE documentation SHALL include examples of error messages and their meanings

### Requirement 10: Backend API Updates

**User Story:** As a frontend developer, I want updated backend APIs for all appointment operations, so that I can implement the UI features.

#### Acceptance Criteria

1. THE Appointment_System SHALL update existing API endpoints to support cancellation with time validation (30-minute rule)
2. THE Appointment_System SHALL update existing API endpoints to support appointment rescheduling
3. THE Appointment_System SHALL update existing API endpoints to include rescheduled flag and tags in appointment responses
4. THE Appointment_System SHALL update existing API endpoints to identify and mark overdue appointments
5. THE Appointment_System SHALL ensure existing endpoints return appointment data with all required fields (time, patient name, status, tags)
6. WHEN an API request fails validation, THE Appointment_System SHALL return HTTP 400 with a descriptive error message
7. WHEN an API request is unauthorized, THE Appointment_System SHALL return HTTP 403 with message "You do not have permission to perform this action"
8. WHEN a requested resource is not found, THE Appointment_System SHALL return HTTP 404 with message "Appointment not found"
