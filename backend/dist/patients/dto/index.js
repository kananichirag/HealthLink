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
    get CreatePatientDto () {
        return _createpatientdto.CreatePatientDto;
    },
    get PaginatedPatientsResponseDto () {
        return _patientresponsedto.PaginatedPatientsResponseDto;
    },
    get PatientResponseDto () {
        return _patientresponsedto.PatientResponseDto;
    },
    get UpdatePatientDto () {
        return _updatepatientdto.UpdatePatientDto;
    }
});
const _createpatientdto = require("./create-patient.dto");
const _updatepatientdto = require("./update-patient.dto");
const _patientresponsedto = require("./patient-response.dto");

//# sourceMappingURL=index.js.map