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
    get AddMedicineDto () {
        return _addmedicinedto.AddMedicineDto;
    },
    get InventoryQueryDto () {
        return _inventoryquerydto.InventoryQueryDto;
    },
    get MedicineQueryDto () {
        return _medicinequerydto.MedicineQueryDto;
    },
    get PrescriptionCheckoutDto () {
        return _prescriptioncheckoutdto.PrescriptionCheckoutDto;
    },
    get PrescriptionQueryDto () {
        return _prescriptionquerydto.PrescriptionQueryDto;
    },
    get PurchaseQueryDto () {
        return _purchasequerydto.PurchaseQueryDto;
    },
    get RecordPurchaseDto () {
        return _recordpurchasedto.RecordPurchaseDto;
    },
    get ReportQueryDto () {
        return _reportquerydto.ReportQueryDto;
    },
    get UpdateMedicineDto () {
        return _updatemedicinedto.UpdateMedicineDto;
    }
});
const _prescriptionquerydto = require("./prescription-query.dto");
const _medicinequerydto = require("./medicine-query.dto");
const _addmedicinedto = require("./add-medicine.dto");
const _updatemedicinedto = require("./update-medicine.dto");
const _recordpurchasedto = require("./record-purchase.dto");
const _purchasequerydto = require("./purchase-query.dto");
const _inventoryquerydto = require("./inventory-query.dto");
const _prescriptioncheckoutdto = require("./prescription-checkout.dto");
const _reportquerydto = require("./report-query.dto");

//# sourceMappingURL=index.js.map