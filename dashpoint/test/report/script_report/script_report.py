# Copyright (c) 2026, cibin and contributors
# For license information, please see license.txt

import frappe


def execute(filters=None):
	columns = [
		{
			'fieldname': 'rider_name',
			'label': 'Rider',
			'fieldtype': 'Data',
		},
		{
			'fieldname': 'total_deliveries',
			'label': 'Total deliveries',
			'fieldtype': 'Int',
		},
		{
			'fieldname': 'total_revenue',
			'label': 'Total Revenue',
			'fieldtype': 'Currency'
		},
		{
			'fieldname': 'avg_attepmpt',
			'label': 'Avg Attempts per Delivery',
			'fieldtype': 'Int'
		},
		
	]

	data = frappe.db.sql("""
		SELECT
			r.rider_name,
			COUNT(d.name) AS total_deliveries,
			AVG(d.delivery_attempts_count) as avg_attepmpt, 
			SUM(d.final_amount) AS total_revenue
		FROM `tabRider` r
		JOIN `tabDelivery Order` d
		ON r.name = d.assigned_rider
		WHERE d.status = 'Delivered'
		GROUP BY r.rider_name
	""", as_dict=1)

	return columns, data