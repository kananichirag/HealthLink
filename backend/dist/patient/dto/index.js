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
    get BookAppointmentDto () {
        return _bookappointmentdto.BookAppointmentDto;
    },
    get RescheduleDto () {
        return _rescheduledto.RescheduleDto;
    }
});
const _bookappointmentdto = require("./book-appointment.dto");
const _rescheduledto = require("./reschedule.dto");
const _appointmentquerydto = require("./appointment-query.dto");

//# sourceMappingURL=index.js.map