frappe.ui.form.on("Delivery Order", {
  refresh(frm){
      frm.set_query('assigned_rider', () => {
    return {
        filters: {
            status: 'Active',
            assigned_zone: frm.doc.delivery_zone   
        }
    };
});     
  },
  assigned_rider(frm) {
        if (!frm.doc.assigned_rider) {
            return;
        }
        frappe.db.get_value("Rider",frm.doc.assigned_rider,"assigned_zone").then(r => {
            if (r.message &&r.message.assigned_zone !== frm.doc.delivery_zone) {
                frappe.msgprint("Warning: Rider's assigned zone does not match the Delivery Zone.");
            }
        });
    },
  refresh(frm){
         if (frm.doc.status === "In Transit") {
            frm.dashboard.add_indicator("In Transit", "orange");
        } else if (frm.doc.status === "Delivered") {
            frm.dashboard.add_indicator("Delivered", "green");
        } else if (frm.doc.status === "Delivery Failed") {
            frm.dashboard.add_indicator("Delivery Failed", "red");
        } else if (frm.doc.status === "Re-attempt Scheduled") {
            frm.dashboard.add_indicator("Re-attempt Scheduled", "orange");
        }
        if (frm.doc.status === "In Transit" || frm.doc.status === "Re-attempt Scheduled") {
             frm.add_custom_button("Log Delivery Attempt", function () {
                let dialog = new frappe.ui.Dialog({
                    title: "Log Delivery Attempt",
                    fields: [
                        {
                            label: "Outcome",
                            fieldname: "outcome",
                            fieldtype: "Select",
                            options: ["Delivered","Failed"],
                            reqd: 1
                        },
                        {
                            label: 'Failure Reason',
                            fieldname: 'failure_reason',
                            fieldtype: 'Small Text',
                            depends_on: 'eval:doc.outcome   == "Failed"'
                        }
                    ],
                    primary_action_label: "Submit",
                    primary_action(values) {
                        if (values.outcome === "Failed" && !values.failure_reason) {
                            frappe.msgprint("Failure reason is mandatory when outcome is failed.");
                            return;
                        }
                        frappe.call({
                            method: "dashpoint.api.record_delivery_attempt",
                            args: {
                                delivery_order_name: frm.doc.name,
                                outcome: values.outcome,
                                failure_reason: values.failure_reason
                            },
                            callback: function () {
                                dialog.hide();
                                frm.reload_doc();
                            }
                        });
                    }
                });
                dialog.show();
            });
        }
        frm.add_custom_button("Reassign Rider", function () {
            frappe.prompt(
                [{
                        label: "New Rider",
                        fieldname: "new_rider",
                        fieldtype: "Link",
                        options: "Rider",
                        reqd: 1
                    }],
                function (values) {
                    frappe.confirm(
                        "Are you sure you want to reassign the rider?",
                        function () {
                            frappe.call({
                                method: "frappe.client.set_value",
                                args: {
                                    doctype: "Delivery Order",
                                    name: frm.doc.name,
                                    fieldname: "assigned_rider",
                                    value: values.new_rider
                                },
                                callback: function () {
                                    frm.trigger("assigned_rider");
                                }
                            });
                        }
                    );
                },
                "Reassign Rider",
                "Reassign"
            );
        });
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
on_trash(frm){
    if(frm.doc.status!="Draft" && frm.doc.status!="Cancelled"){
        frappe.throw("Can't delete the order that not cancel or not in draft")
    }
}
}); 