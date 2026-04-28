# Appointment Features Guide

## Overview

This document describes the appointment booking and management features available to patients and doctors in the healthcare platform.

---

## Booking an Appointment (Patient)

1. Navigate to **My Appointments** in the patient dashboard.
2. Click **Book New Appointment**.
3. Select a **doctor** from the dropdown.
4. Choose a **date** (past dates are disabled).
5. Select an available **time slot** (displayed in AM/PM format, e.g., "2:00 PM").
6. Check the terms and conditions checkbox:
   > "You cannot cancel this appointment if 30 minutes or less remain before the appointment time"
7. Click **Confirm Booking**.

---

## The 30-Minute Cancellation Rule

Patients **cannot cancel or reschedule** an appointment if fewer than 30 minutes remain before the scheduled time.

- **Allowed**: Cancel/reschedule when 30+ minutes remain.
- **Blocked**: Cancel/reschedule when less than 30 minutes remain.
- **Error message**: "Cannot cancel appointment within 30 minutes of scheduled time"

Doctors are **not subject** to this restriction and can cancel or reschedule any appointment at any time.

---

## Cancelling an Appointment

### Patient
1. Find the appointment card with status **Scheduled**.
2. Click **Cancel**.
3. A confirmation popup appears: "Are you sure you want to cancel this appointment?"
4. Click **Yes, Cancel** to confirm, or **No, Keep** to dismiss.
5. If within 30 minutes of the appointment, the cancellation will be rejected with an error message.

### Doctor
1. Find the appointment card.
2. Click **Cancel** — no time restriction applies.
3. Confirm in the popup.

---

## Rescheduling an Appointment

### Patient
1. Find a **Scheduled** appointment card.
2. Click **Reschedule** (blocked if within 30 minutes of the appointment).
3. A form appears showing the current appointment details.
4. Select a new **date** and **time slot**.
5. Click **Reschedule Appointment**.
6. The appointment is updated and a **Rescheduled** tag is added.

### Doctor
1. Find any **Scheduled** or **Overdue** appointment.
2. Click **Reschedule** — no time restriction applies.
3. Select a new date and time slot.
4. Confirm.

---

## Patient vs Doctor Permissions

| Action | Patient | Doctor |
|--------|---------|--------|
| Book appointment | ✅ | ❌ |
| Cancel appointment | ✅ (30-min rule) | ✅ (anytime) |
| Reschedule appointment | ✅ (30-min rule) | ✅ (anytime) |
| Complete appointment | ❌ | ✅ |
| View all appointments | Own only | All in tenant |

---

## Overdue Appointments (Doctor View)

An appointment is **overdue** when:
- Its scheduled date and time have passed, **and**
- Its status is still **Scheduled** (not completed or cancelled).

Overdue appointments are highlighted with an orange border and display the label:
> "This appointment is overdue"

Doctors can reschedule overdue appointments to a new date and time.

---

## The "Rescheduled" Tag

When an appointment is rescheduled (by either a patient or doctor), a **Rescheduled** tag is automatically added to the appointment record. This tag is visible on the appointment card as a purple badge.

---

## Appointment Statuses

| Status | Description |
|--------|-------------|
| **Scheduled** | Appointment is upcoming and active |
| **Completed** | Appointment has been marked as done by the doctor |
| **Cancelled** | Appointment was cancelled by patient or doctor |

---

## Troubleshooting

### "Cannot cancel appointment within 30 minutes of scheduled time"
You are trying to cancel too close to the appointment time. Contact the clinic directly if you need to cancel urgently.

### "The selected time slot is no longer available"
Another patient booked that slot while you were selecting. Choose a different time slot.

### "Unable to connect. Please check your connection and try again"
A network error occurred. Check your internet connection and try again.

### "Appointment not found"
The appointment may have already been cancelled or does not exist. Refresh the page.

### "You do not have permission to perform this action"
You are trying to modify an appointment that does not belong to you, or your role does not allow this action.
