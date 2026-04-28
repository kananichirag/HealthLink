# Implementation Plan: Enhanced Appointment Flow

## Overview

This implementation plan breaks down the enhanced appointment flow feature into discrete, actionable tasks. The feature updates existing appointment booking and management flows in both frontend (Next.js/React/TypeScript) and backend (NestJS/TypeScript/Prisma) to add rescheduling, enforce a 30-minute cancellation rule, improve UI controls, and provide better visual feedback.

## Tasks

- [x] 1. Database schema updates and migration
  - [x] 1.1 Update Prisma schema with new appointment fields
    - Add `isRescheduled` boolean field with default false
    - Add `tags` string array field with default empty array
    - Add index on `isRescheduled` field for query performance
    - _Requirements: 7.6, 3.6, 4.9_
  
  - [x] 1.2 Create and run database migration
    - Generate Prisma migration file
    - Apply migration to development database
    - Verify schema changes applied correctly
    - _Requirements: 7.6, 10.3_

- [x] 2. Backend: Create Patient module with appointment endpoints
  - [x] 2.1 Create PatientController and PatientService
    - Create `backend/src/patient/patient.controller.ts`
    - Create `backend/src/patient/patient.service.ts`
    - Create `backend/src/patient/patient.module.ts`
    - Set up dependency injection and imports
    - _Requirements: 10.1, 10.2_
  
  - [x] 2.2 Create DTOs for patient appointment operations
    - Create `BookAppointmentDto` with validation decorators
    - Create `RescheduleDto` with validation decorators
    - Create `AppointmentQueryDto` with pagination and filters
    - Export all DTOs from index file
    - _Requirements: 10.1, 10.2, 6.1, 6.2, 6.3_
  
  - [x] 2.3 Implement appointment booking endpoint
    - Create POST `/patient/appointments` endpoint
    - Validate doctor availability and slot conflicts
    - Create appointment record with SCHEDULED status
    - Return created appointment with patient and doctor details
    - _Requirements: 1.6, 7.1, 10.1_
  
  - [ ]* 2.4 Write unit tests for appointment booking
    - Test successful booking with valid data
    - Test rejection of duplicate bookings
    - Test validation of required fields
    - Test slot availability checking
    - _Requirements: 1.6, 7.1_

- [x] 3. Backend: Implement cancellation validation logic
  - [x] 3.1 Create cancellation window validation method
    - Implement `validateCancellationWindow()` in PatientService
    - Calculate minutes until appointment from current time
    - Reject if less than 30 minutes for patients
    - Allow doctors to cancel anytime
    - _Requirements: 2.1, 2.2, 2.3, 4.3_
  
  - [x] 3.2 Implement patient cancellation endpoint
    - Create DELETE `/patient/appointments/:id` endpoint
    - Verify appointment ownership
    - Call cancellation window validation
    - Update appointment status to CANCELLED
    - Return appropriate error messages
    - _Requirements: 2.2, 2.3, 10.1, 10.6_
  
  - [ ]* 3.3 Write unit tests for cancellation validation
    - Test rejection with <30 minutes remaining
    - Test success with 30+ minutes remaining
    - Test doctor can cancel anytime
    - Test error messages are correct
    - Test timezone handling
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Backend: Implement appointment rescheduling
  - [x] 4.1 Create reschedule endpoint for patients
    - Create PATCH `/patient/appointments/:id/reschedule` endpoint
    - Validate 30-minute rule before allowing reschedule
    - Check new slot availability
    - Update appointment date and timeSlot
    - Set `isRescheduled` flag to true
    - Add "Rescheduled" to tags array
    - _Requirements: 3.3, 3.5, 3.6, 10.2, 10.3_
  
  - [x] 4.2 Create helper methods for rescheduling
    - Implement `checkSlotAvailability()` method
    - Implement `addRescheduledTag()` method
    - Implement `enrichAppointmentWithTags()` method
    - _Requirements: 3.5, 3.6, 10.3_
  
  - [ ]* 4.3 Write unit tests for rescheduling logic
    - Test successful reschedule with valid new slot
    - Test rejection when slot unavailable
    - Test 30-minute rule enforcement
    - Test rescheduled flag is set correctly
    - Test "Rescheduled" tag is added
    - _Requirements: 3.3, 3.5, 3.6_

- [x] 5. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Backend: Update Doctor module with new endpoints
  - [x] 6.1 Add doctor cancellation endpoint
    - Create DELETE `/doctor/appointments/:id` endpoint in DoctorController
    - Allow cancellation without time restrictions
    - Verify doctor owns the appointment
    - Update appointment status to CANCELLED
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 6.2 Add doctor reschedule endpoint
    - Create PATCH `/doctor/appointments/:id/reschedule` endpoint
    - Allow rescheduling without time restrictions
    - Check new slot availability
    - Update appointment and set rescheduled flag
    - _Requirements: 4.7, 4.8, 4.9_
  
  - [x] 6.3 Add complete appointment endpoint
    - Create PATCH `/doctor/appointments/:id/complete` endpoint
    - Update appointment status to COMPLETED
    - Verify only doctors can complete appointments
    - _Requirements: 7.3_
  
  - [x] 6.4 Implement overdue appointment detection
    - Create `isAppointmentOverdue()` helper method
    - Check if appointment date/time is in the past
    - Only flag appointments with SCHEDULED status
    - Include overdue indicator in appointment response
    - _Requirements: 4.6, 10.4_
  
  - [ ]* 6.5 Write unit tests for doctor endpoints
    - Test doctor can cancel anytime
    - Test doctor can reschedule anytime
    - Test appointment completion
    - Test overdue detection logic
    - _Requirements: 4.3, 4.6, 4.7, 4.8_

- [x] 7. Backend: Update appointment list endpoints
  - [x] 7.1 Update patient appointments list endpoint
    - Ensure GET `/patient/appointments` returns all required fields
    - Include `isRescheduled` and `tags` in response
    - Support filtering by status, date range
    - Implement pagination
    - _Requirements: 10.3, 10.5_
  
  - [x] 7.2 Update doctor appointments list endpoint
    - Update existing GET `/doctor/appointments` endpoint
    - Include `isRescheduled`, `tags`, and overdue indicator
    - Support filtering and pagination
    - Include patient details in response
    - _Requirements: 4.1, 4.2, 10.3, 10.5_
  
  - [ ]* 7.3 Write integration tests for list endpoints
    - Test pagination works correctly
    - Test filtering by status
    - Test date range filtering
    - Test response includes all required fields
    - _Requirements: 10.5_

- [x] 8. Frontend: Create shared components
  - [x] 8.1 Create ConfirmationPopup component
    - Create `frontend/src/components/ConfirmationPopup.tsx`
    - Accept props: isOpen, title, message, onConfirm, onCancel
    - Apply application theme colors (teal primary, red danger)
    - Support variant types (danger, warning, info)
    - Make component reusable across patient and doctor portals
    - _Requirements: 2.4, 2.5, 2.6, 4.4, 4.5, 8.1, 8.2_
  
  - [x] 8.2 Create RescheduleForm component
    - Create `frontend/src/components/RescheduleForm.tsx`
    - Display current appointment details
    - Fetch available slots for selected date
    - Disable past dates in date picker
    - Format times in AM/PM format
    - Handle form submission and validation
    - _Requirements: 3.4, 3.5, 5.1_
  
  - [x] 8.3 Create time formatting utility functions
    - Create `frontend/src/utils/timeFormat.ts`
    - Implement `formatTimeToAMPM()` function
    - Implement `formatTimeSlotAMPM()` function
    - Handle edge cases (midnight, noon)
    - _Requirements: 1.3, 5.1_
  
  - [ ]* 8.4 Write unit tests for shared components
    - Test ConfirmationPopup renders correctly
    - Test RescheduleForm validation
    - Test time formatting functions
    - _Requirements: 1.3, 5.1_

- [x] 9. Frontend: Update patient booking form
  - [x] 9.1 Add terms and conditions checkbox
    - Add checkbox with text "You cannot cancel this appointment if 30 minutes or less remain before the appointment time"
    - Make checkbox required for form submission
    - Display validation error if not checked
    - _Requirements: 1.5, 1.6_
  
  - [x] 9.2 Implement comprehensive form validation
    - Validate all required fields (doctor, date, time slot)
    - Display specific error messages for each field
    - Disable past dates in date picker
    - Enable submit button only when form is valid
    - _Requirements: 1.2, 1.6, 1.7, 6.1, 6.2, 6.3_
  
  - [x] 9.3 Update time slot display to AM/PM format
    - Convert all time slots from 24-hour to AM/PM format
    - Update time slot selection UI
    - Apply formatting consistently across booking form
    - _Requirements: 1.3, 1.4_
  
  - [x] 9.4 Improve doctor selection dropdown styling
    - Update dropdown UI with better styling
    - Ensure consistent theme application
    - _Requirements: 1.1, 8.3_
  
  - [ ]* 9.5 Write unit tests for booking form
    - Test terms checkbox validation
    - Test required field validation
    - Test past date blocking
    - Test AM/PM time formatting
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

- [x] 10. Checkpoint - Ensure frontend component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Frontend: Update patient appointment card
  - [x] 11.1 Add Reschedule button for SCHEDULED appointments
    - Display "Reschedule" button when status is SCHEDULED
    - Open RescheduleForm component on click
    - Apply 30-minute rule validation before showing form
    - Display error if within 30-minute window
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 11.2 Add Cancel button with confirmation popup
    - Display "Cancel" button for SCHEDULED appointments
    - Show ConfirmationPopup on click
    - Submit cancellation on confirmation
    - Handle and display error messages
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 11.3 Display Rescheduled tag
    - Check `isRescheduled` flag or "Rescheduled" in tags array
    - Display visual tag indicator when appointment is rescheduled
    - Apply consistent styling with theme colors
    - _Requirements: 3.6, 4.9_
  
  - [x] 11.4 Format appointment times in AM/PM
    - Convert all displayed times to AM/PM format
    - Apply formatting consistently across appointment card
    - _Requirements: 1.3_
  
  - [ ]* 11.5 Write unit tests for appointment card
    - Test Reschedule button visibility logic
    - Test Cancel button functionality
    - Test Rescheduled tag display
    - Test time formatting
    - _Requirements: 3.1, 3.6_

- [x] 12. Frontend: Update doctor appointment card
  - [x] 12.1 Add overdue appointment indicator
    - Check if appointment time has passed and status is SCHEDULED
    - Display "This appointment is overdue" label
    - Apply warning styling to overdue appointments
    - _Requirements: 4.6_
  
  - [x] 12.2 Add Reschedule button for overdue appointments
    - Display "Reschedule" button for overdue appointments
    - Allow doctors to reschedule without time restrictions
    - Open RescheduleForm on click
    - _Requirements: 4.7, 4.8_
  
  - [x] 12.3 Add Cancel button with confirmation (no time restriction)
    - Display "Cancel" button for appointments
    - Show ConfirmationPopup on click
    - Allow cancellation regardless of time remaining
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 12.4 Display Rescheduled tag
    - Check `isRescheduled` flag or "Rescheduled" in tags array
    - Display visual tag indicator
    - _Requirements: 4.9_
  
  - [x] 12.5 Format appointment times in AM/PM
    - Convert all displayed times to AM/PM format
    - Apply formatting to appointment list
    - _Requirements: 4.2_
  
  - [ ]* 12.6 Write unit tests for doctor appointment card
    - Test overdue detection logic
    - Test Reschedule button for overdue appointments
    - Test Cancel button (no time restriction)
    - Test Rescheduled tag display
    - _Requirements: 4.6, 4.7, 4.9_

- [x] 13. Frontend: Update doctor schedule display
  - [x] 13.1 Format weekly availability times in AM/PM
    - Update Schedule tab to display times in AM/PM format
    - Convert all availability times (e.g., "9:00 AM - 5:00 PM")
    - Apply formatting consistently
    - _Requirements: 5.1_
  
  - [x] 13.2 Improve time slot selection UI
    - Update input controls for setting availability
    - Ensure consistent theme and styling
    - _Requirements: 5.2_

- [x] 14. Frontend: Implement error handling and display
  - [x] 14.1 Create error message display component
    - Create reusable error display component
    - Support error, warning, and info types
    - Include appropriate icons
    - Apply consistent styling
    - _Requirements: 6.6, 6.7_
  
  - [x] 14.2 Handle API error responses
    - Display validation errors (HTTP 400)
    - Display authorization errors (HTTP 403)
    - Display not found errors (HTTP 404)
    - Display network errors with user-friendly messages
    - Show server error messages
    - _Requirements: 6.4, 6.5, 10.6, 10.7, 10.8_
  
  - [x] 14.3 Add success message display
    - Display success messages after booking
    - Display success messages after cancellation
    - Display success messages after rescheduling
    - Use consistent format with success icon
    - _Requirements: 6.7_

- [x] 15. Frontend: Create React Query hooks for API integration
  - [x] 15.1 Create hooks for patient appointment operations
    - Create `useBookAppointment` mutation hook
    - Create `useCancelAppointment` mutation hook
    - Create `useRescheduleAppointment` mutation hook
    - Create `usePatientAppointments` query hook
    - Handle loading states and errors
    - _Requirements: 10.1, 10.2_
  
  - [x] 15.2 Create hooks for doctor appointment operations
    - Create `useDoctorCancelAppointment` mutation hook
    - Create `useDoctorRescheduleAppointment` mutation hook
    - Create `useCompleteAppointment` mutation hook
    - Create `useDoctorAppointments` query hook
    - Handle loading states and errors
    - _Requirements: 10.1, 10.2_
  
  - [ ]* 15.3 Write integration tests for API hooks
    - Test successful API calls
    - Test error handling
    - Test loading states
    - Test cache invalidation
    - _Requirements: 10.1, 10.2_

- [x] 16. Frontend: Wire components to patient appointments page
  - [x] 16.1 Update patient appointments page
    - Update `frontend/src/app/dashboard/patient/appointments/page.tsx`
    - Integrate updated BookingForm component
    - Integrate updated AppointmentCard component
    - Connect React Query hooks
    - Handle loading and error states
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 16.2 Integrate cancellation flow
    - Connect Cancel button to ConfirmationPopup
    - Handle cancellation API call
    - Display success/error messages
    - Refresh appointment list on success
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 16.3 Integrate rescheduling flow
    - Connect Reschedule button to RescheduleForm
    - Handle reschedule API call
    - Display success/error messages
    - Refresh appointment list on success
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 17. Frontend: Wire components to doctor appointments page
  - [x] 17.1 Update doctor appointments page
    - Update `frontend/src/app/dashboard/doctor/appointments/page.tsx`
    - Integrate updated AppointmentCard component
    - Connect React Query hooks
    - Handle loading and error states
    - _Requirements: 4.1, 4.2_
  
  - [x] 17.2 Integrate overdue appointment handling
    - Display overdue indicator for past appointments
    - Show Reschedule button for overdue appointments
    - Handle reschedule flow for overdue appointments
    - _Requirements: 4.6, 4.7, 4.8_
  
  - [x] 17.3 Integrate cancellation flow (no time restriction)
    - Connect Cancel button to ConfirmationPopup
    - Handle cancellation API call without time validation
    - Display success/error messages
    - Refresh appointment list on success
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 17.4 Update Schedule tab time formatting
    - Apply AM/PM formatting to weekly availability display
    - Update time slot selection UI
    - _Requirements: 5.1, 5.2_

- [x] 18. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Documentation and final polish
  - [x] 19.1 Create user documentation
    - Create `docs/APPOINTMENT_FEATURES.md`
    - Document how to book appointments
    - Explain 30-minute cancellation rule
    - Explain rescheduling process
    - Document patient vs doctor permissions
    - Explain overdue appointments
    - Explain Rescheduled tag
    - Include troubleshooting section
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 19.2 Update API documentation
    - Document all new/updated endpoints
    - Include request/response examples
    - Document error codes and messages
    - Document authentication requirements
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_
  
  - [x] 19.3 Apply consistent theme styling
    - Review all components for theme consistency
    - Ensure consistent spacing and typography
    - Verify border radius and shadow styles
    - Check button styling across all components
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 20. Final checkpoint - Complete testing and deployment preparation
  - Run all unit tests and integration tests
  - Perform manual testing of all user flows
  - Verify error handling works correctly
  - Ensure all documentation is complete
  - Prepare for deployment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- The implementation follows a backend-first approach to ensure APIs are ready before frontend integration
- Checkpoints are included at key milestones to validate progress
- All code should maintain consistency with existing application architecture and styling
- Property-based tests are not included as this feature focuses on business logic and UI enhancements rather than universal mathematical properties
