# Copyright (c) 2026, cibin and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from frappe.model.naming import getseries

class Packagingmaterial(Document):
	def autoname(self):
		if self.is_active:
			self.name=self.material_code.upper()
		else:
			series=getseries("PKG",4)
			self.name=f"{"PKG"}-{series}"

	

