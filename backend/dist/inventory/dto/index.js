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
    get BulkUpdateStockDto () {
        return _inventoryfilterdto.BulkUpdateStockDto;
    },
    get CreateMedicineDto () {
        return _createmedicinedto.CreateMedicineDto;
    },
    get ExpiryStatus () {
        return _inventoryfilterdto.ExpiryStatus;
    },
    get InventoryFilterDto () {
        return _inventoryfilterdto.InventoryFilterDto;
    },
    get InventoryStatsDto () {
        return _medicineresponsedto.InventoryStatsDto;
    },
    get MedicineResponseDto () {
        return _medicineresponsedto.MedicineResponseDto;
    },
    get PaginatedMedicinesResponseDto () {
        return _medicineresponsedto.PaginatedMedicinesResponseDto;
    },
    get StockStatus () {
        return _inventoryfilterdto.StockStatus;
    },
    get UpdateMedicineDto () {
        return _updatemedicinedto.UpdateMedicineDto;
    }
});
const _createmedicinedto = require("./create-medicine.dto");
const _updatemedicinedto = require("./update-medicine.dto");
const _medicineresponsedto = require("./medicine-response.dto");
const _inventoryfilterdto = require("./inventory-filter.dto");

//# sourceMappingURL=index.js.map