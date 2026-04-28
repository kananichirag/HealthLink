# Appointment API Documentation

All endpoints require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## Patient Endpoints

### Book Appointment
`POST /patient/appointments`

**Request Body:**
```json
{
  "doctorId": "uuid",
  "date": "2025-05-15",
  "timeSlot": "2:00 PM"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "doctorId": "uuid",
  "date": "2025-05-15T00:00:00.000Z",
  "timeSlot": "2:00 PM",
  "status": "SCHEDULED",
  "isRescheduled": false,
  "tags": [],
  "createdAt": "2025-04-28T10:00:00.000Z",
  "updatedAt": "2025-04-28T10:00:00.000Z",
  "patient": { "id": "uuid", "name": "John Doe" },
  "doctor": { "id": "uuid", "name": "Dr. Smith" }
}
```

---

### List Patient Appointments
`GET /patient/appointments`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by SCHEDULED, COMPLETED, or CANCELLED |
| startDate | string | ISO date string (inclusive) |
| endDate | string | ISO date string (inclusive) |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10, max: 100) |

**Response (200):**
```json
{
  "data": [ /* appointment objects */ ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

---

### Cancel Appointment (Patient)
`DELETE /patient/appointments/:id`

Enforces the 30-minute cancellation rule.

**Response (204):** No content on success.

**Error (400):**
```json
{ "statusCode": 400, "message": "Cannot cancel appointment within 30 minutes of scheduled time" }
```

---

### Reschedule Appointment (Patient)
`PATCH /patient/appointments/:id/reschedule`

Enforces the 30-minute rule. Sets `isRescheduled = true` and adds `"Rescheduled"` tag.

**Request Body:**
```json
{
  "newDate": "2025-05-20",
  "newTimeSlot": "3:00 PM"
}
```

**Response (200):** Updated appointment object.

---

## Doctor Endpoints

### List Doctor Appointments
`GET /doctor/appointments`

Same query parameters as patient list. Response includes `isOverdue` indicator.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "date": "2025-05-15T00:00:00.000Z",
      "timeSlot": "2:00 PM",
      "status": "SCHEDULED",
      "isRescheduled": false,
      "tags": [],
      "isOverdue": false,
      "patient": { "id": "uuid", "name": "John Doe" }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

---

### Cancel Appointment (Doctor)
`DELETE /doctor/appointments/:id`

No time restriction. Doctor must own the appointment.

**Response (204):** No content.

---

### Reschedule Appointment (Doctor)
`PATCH /doctor/appointments/:id/reschedule`

No time restriction. Sets `isRescheduled = true` and adds `"Rescheduled"` tag.

**Request Body:**
```json
{
  "newDate": "2025-05-20",
  "newTimeSlot": "3:00 PM"
}
```

**Response (200):** Updated appointment object.

---

### Complete Appointment
`PATCH /doctor/appointments/:id/complete`

Marks appointment as COMPLETED. Only doctors can call this.

**Response (200):** Updated appointment object.

---

## Error Codes

| HTTP Status | Message | Cause |
|-------------|---------|-------|
| 400 | "Cannot cancel appointment within 30 minutes of scheduled time" | Patient cancellation too close to appointment |
| 400 | "Cannot reschedule appointment within 30 minutes of scheduled time" | Patient reschedule too close to appointment |
| 400 | "The selected time slot is no longer available" | Slot conflict on reschedule |
| 400 | "Appointment is already cancelled" | Duplicate cancellation attempt |
| 400 | "Only scheduled appointments can be rescheduled" | Invalid status transition |
| 403 | "You do not have permission to perform this action" | Unauthorized role or ownership |
| 404 | "Appointment not found" | Invalid appointment ID or wrong tenant |

---

## Authentication

All endpoints require:
- `Authorization: Bearer <jwt_token>` header
- JWT payload must include `sub` (user ID) and `tenantId`
- Role-based access: patient endpoints require `PATIENT` role, doctor endpoints require `DOCTOR` role
