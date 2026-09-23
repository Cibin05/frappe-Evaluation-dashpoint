import frappe
def delivery_order_query_conditions(user):
    if not user:
        user = frappe.session.user

    if "DP Rider" in frappe.get_roles(user):
        return """
            `tabDelivery Order`.`assigned_rider` IN (
                SELECT `name`
                FROM `tabRider`
                WHERE `user` = {user}
            )
        """.format(
            user=frappe.db.escape(user)
        )

    return ""


@frappe.whitelist()
def get_delivery_orders_unsafe():
    return frappe.get_all(
        "Delivery Order",
        fields=["*"]
    )

@frappe.whitelist()
def get_delivery_orders_safe():
    orders = frappe.get_list(
        "Delivery Order",
        fields=["*"]
    )

    if "DP Ops Manager" not in frappe.get_roles():
        for order in orders:
            order.pop("customer_phone", None)
            order.pop("customer_email", None)

    return orders