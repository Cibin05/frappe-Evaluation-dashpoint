frappe.ui.form.on("Delivery Order", {
  refresh(frm){
      frm.set_query('assigned_rider', () => {
    return {
        filters: {
            status: 'Active'
        }
    }
}),
  },
    async validate(frm) {
        let total = 0;

        if (!frm.doc.customer_phone || frm.doc.customer_phone.length != 10) {
            frappe.throw("Number should have exactly 10 digits");
        }

        if (
            frm.doc.status == "In Transit" ||
            frm.doc.status == "Delivery Failed" ||
            frm.doc.status == "Re-attempt Scheduled" ||
            frm.doc.status == "Delivered" ||
            frm.doc.status == "Escalated" ||
            frm.doc.status == "Cancelled"
        ) {
            if (!frm.doc.assigned_rider) {
                frappe.throw("Beyond transit assigned rider is must");
            }
        }

        frm.doc.packaging_used.forEach(row => {
            row.total_price = row.unit_price * row.quantity;
            total = total + row.total_price;
        });

        if (frm.doc.status == "Delivery Failed") {
            frm.set_df_property("failure_reason", "reqd", 1);
        }

        frm.set_value("packaging_total", total);

        let fees = await frappe.db.get_single_value(
            "Dispatch setting",
            "default_delivery_fee"
        );

        frm.set_value("delivery_fee", fees);

        let final = total + fees;
        frm.set_value("final_amount", final);
    },

    async before_submit(frm) {
        if (frm.doc.status != "Delivered") {
            frappe.throw("Still the product is not delivered");
        }

        for (let row of frm.doc.packaging_used) {
            let r = await frappe.db.get_value(
                "Packaging material",
                row.material,
                "stock_qty"
            );

            if (r.message.stock_qty < row.quantity) {
                frappe.throw("Stock is low for " + row.material);
            }
        }
    },

    async on_submit(frm) {
        for (let row of frm.doc.packaging_used) {
            let r = await frappe.db.get_value(
                "Packaging material",
                row.material,
                "stock_qty"
            );

            await frappe.db.set_value(
                "Packaging material",
                row.material,
                "stock_qty",
                r.message.stock_qty - row.quantity
            );
        }
    },

    async on_cancel(frm) {
        for (let row of frm.doc.packaging_used) {
            let r = await frappe.db.get_value(
                "Packaging material",
                row.material,
                "stock_qty"
            );

            await frappe.db.set_value(
                "Packaging material",
                row.material,
                "stock_qty",
                r.message.stock_qty + row.quantity
            );
        }
    },

  async after_save(frm) {
    if (frm.doc.status == "Delivery Failed" || frm.doc.status == "Delivered") {
        await frappe.call({
            method: "dashpoint.api.record_delivery_attempt",
            args: {
                delivery_order_name: frm.doc.name,
                outcome: frm.doc.status
            }
        });

        await frm.reload_doc();
    }
},
before_discard(frm){
    if(frm.doc.status=="Draft" || frm.doc.status=="Cancelled"){
        frappe.throw("Can't delete the order that not cancel or not in draft")
    }
}
});


