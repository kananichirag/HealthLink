"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AppointmentQueryDto () {
        return _appointmentquerydto.AppointmentQueryDto;
    },
    get AvailabilitySlotDto () {
        return _setavailabilitydto.AvailabilitySlotDto;
    },
    get BlockDateDto () {
        return _blockdatedto.BlockDateDto;
    },
    get CreateAllergyReportDto () {
        return _createallergyreportdto.CreateAllergyReportDto;
    },
    get CreatePatientDto () {
        return _createpatientdto.CreatePatientDto;
    },
    get CreatePrescriptionDto () {
        return _createprescriptiondto.CreatePrescriptionDto;
    },
    get PatientQueryDto () {
        return _patientquerydto.PatientQueryDto;
    },
    get PrescriptionItemDto () {
        return _createprescriptiondto.PrescriptionItemDto;
    },
    get RequestConnectionDto () {
        return _requestconnectiondto.RequestConnectionDto;
    },
    get RescheduleDto () {
        return _rescheduledto.RescheduleDto;
    },
    get SetAvailabilityDto () {
        return _setavailabilitydto.SetAvailabilityDto;
    },
    get SetMaxAppointmentsDto () {
        return _setmaxappointmentsdto.SetMaxAppointmentsDto;
    }
});
const _createpatientdto = require("./create-patient.dto");
const _patientquerydto = require("./patient-query.dto");
const _createallergyreportdto = require("./create-allergy-report.dto");
const _createprescriptiondto = require("./create-prescription.dto");
const _requestconnectiondto = require("./request-connection.dto");
const _setavailabilitydto = require("./set-availability.dto");
const _blockdatedto = require("./block-date.dto");
const _setmaxappointmentsdto = require("./set-max-appointments.dto");
const _appointmentquerydto = require("./appointment-query.dto");
const _rescheduledto = require("../../patient/dto/reschedule.dto");

//# sourceMappingURL=index.js.map