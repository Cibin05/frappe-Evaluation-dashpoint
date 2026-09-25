# Copyright (c) 2026, cibin and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			"fieldname": "rider_name",
			"label": "Rider",
			"fieldtype": "Data",
		},
		{
			"fieldname": "total_deliveries",
			"label": "No of Deliveries",
			"fieldtype": "Int",
		},
		{
			"fieldname": "delivered",
			"label": "Total Delivery",
			"fieldtype": "Int",
		},
		{
			"fieldname": "total_revenue",
			"label": "Total Revenue",
			"fieldtype": "Currency",
		},
		{
			"fieldname": "avg_attempt",
			"label": "Avg Attempts per Delivery",
			"fieldtype": "Float",
		}
	]
	data = frappe.db.sql("""
		SELECT
			r.rider_name,
			COUNT(d.name) AS total_deliveries,
			SUM(CASE WHEN d.status = 'Delivered' THEN 1 ELSE 0 END) AS delivered,
			AVG(d.delivery_attempts_count) AS avg_attempt,
			SUM(d.final_amount) AS total_revenue
		FROM `tabRider` r
		JOIN `tabDelivery Order` d
			ON r.name = d.assigned_rider
		GROUP BY r.rider_name
		ORDER BY r.rider_name
	""", as_dict=True)
	graph = get_chart(data)
	return columns, data, None, graph


def get_chart(data):
	if not data:
		return None
	labels = [row.rider_name for row in data]
	total = [int(row.total_deliveries or 0) for row in data]
	delivered = [int(row.delivered or 0) for row in data]
	return {
		"data": {
			"labels": labels,
			"datasets": [
				{"name": "Total Deliveries","values": total},
				{"name": "Delivered","values": delivered
				}
			]
		},
		"type": "bar",
		"height": 300,
		"colors": ["#7cd6fd", "black"]
	}