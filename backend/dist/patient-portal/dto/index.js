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
    get BookAppointmentDto () {
        return _bookappointmentdto.BookAppointmentDto;
    },
    get PatientAppointmentQueryDto () {
        return _appointmentquerydto.PatientAppointmentQueryDto;
    },
    get PatientPrescriptionQueryDto () {
        return _prescriptionquerydto.PatientPrescriptionQueryDto;
    }
});
const _bookappointmentdto = require("./book-appointment.dto");
const _appointmentquerydto = require("./appointment-query.dto");
const _prescriptionquerydto = require("./prescription-query.dto");

//# sourceMappingURL=index.js.map