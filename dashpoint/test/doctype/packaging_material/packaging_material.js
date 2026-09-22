// Copyright (c) 2026, cibin and contributors
// For license information, please see license.txt

frappe.ui.form.on("Packaging material", {
	before_save(frm) {
        if(frm.doc.charge_to_customer <= frm.doc.unit_cost){
            frappe.throw("Selling cost can't less then unit cost")
        }
	}
});
