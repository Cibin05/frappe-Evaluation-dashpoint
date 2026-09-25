import frappe
from frappe.utils import now
from frappe.utils import add_days,now_datetime
from frappe.query_builder import DocType
@frappe.whitelist()
def record_delivery_attempt(delivery_order_name, outcome, failure_reason=None):
    doc = frappe.get_doc("Delivery Order", delivery_order_name)

    if outcome == "Failed":
        doc.delivery_attempts_count = doc.delivery_attempts_count + 1

        max_attempts = int(
            frappe.db.get_single_value("Dispatch setting", "max_delivery_attempts")
        )

        if doc.delivery_attempts_count >= max_attempts:
            doc.status = "Escalated"
            doc.save()
            doc.submit()
            doc.cancel()
        else:
            doc.status = "Re-attempt Scheduled"
            doc.save()
 
    elif outcome == "Delivered":
        doc.status = "Delivered"
        doc.delivered_on = frappe.utils.now()
        doc.save()
        doc.submit()
import frappe

def after_install():
    doc = frappe.get_single("Dispatch setting")
    doc.dispatch_center_name = "TN"
    doc.max_delivery_attempts = 3
    doc.default_delivery_fee = 100
    doc.save()
    frappe.db.commit()
    frappe.msgprint("Welcome.. successfully installed") 
    if frappe.db.count('Delivery Zone') == 0:
         frappe.get_doc({'doctype': 'Delivery Zone','zone_name': 'North zone',}).insert()
         frappe.get_doc({'doctype': 'Delivery Zone','zone_name': 'East Zone', }).insert()
         frappe.get_doc({'doctype': 'Delivery Zone','zone_name': 'South zone',}).insert()

# settings = frappe.get_doc('Dispatch Settings')
#     frappe.db.set_value('Dispatch Settings', settings.name, 'dispatch_center_name','TN')
#     frappe.db.set_value('Dispatch Settings', settings.name, 'max_delivery_attempts',3)
#     frappe.db.set_value('Dispatch Settings', settings.name, 'default_delivery_fee',100)


@frappe.whitelist()
def rename_rider(old, new):
    return frappe.rename_doc(
        "Rider",
        old,
        new,
        merge=False
    )

def log_change(doc,method):
    log= frappe.get_doc({
          'doctype':"Audit Log",
          'doctype_name':doc.doctype,
          'document_name':doc.name,
          'action':method,
          'user':frappe.session.user,
          'timestamp':now()
     })
    log.insert()

@frappe.whitelist()
def get_struck_deliveries():
    do = DocType("Delivery Order")
    two_days = add_days(now_datetime(), -2)
    result = (
        frappe.qb.from_(do).select("*")
        .where(
            do.status.isin(["In Transit", "Re-attempt Scheduled"])
            & (do.creation < two_days)
        )
        .orderby(do.creation).run(as_dict=True)
    )
    return result

import frappe


@frappe.whitelist()
def get_delivery_status(delivery_order_name):
    if not frappe.db.exists("Delivery Order", delivery_order_name):
        return {"error": "Not found"}
    doc = frappe.get_doc("Delivery Order", delivery_order_name)
    return {
        "status": doc.status,
        "zone": doc.delivery_zone,
        "attempts_count": doc.delivery_attempts_count
    }


@frappe.whitelist()
def check_stuck_reattempts():
    docs = frappe.db.get_all('Delivery Order',
        filters={
            'status': 'Re-attempt Scheduled'
        },
        fields=['name', 'customer_name', 'assigned_rider', 'delivery_zone']
    )
    for row in docs:
        doc = frappe.new_doc('Ops Manager')
        doc.customer = row.customer_name
        doc.rider = row.assigned_rider
        doc.zone = row.delivery_zone
        doc.insert(ignore_permissions=True)

    frappe.db.commit()

    return docs