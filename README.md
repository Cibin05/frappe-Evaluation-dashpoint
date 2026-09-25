1.In README_internals.md: rename a test Rider record. Does assigned_rider on linked Delivery Orders update automatically? Why or why not?
      No, Link fields store the document name,there they do not update automatically when linked.
      
2.The snippet below has two bugs related to document lifecycle. Identify both and write the corrected version in README_internals.md:
 validate() is already part of the save process. Calling self.save() again causes recursive saving.

3.In README_internals.md: why would you see a "Document has been modified after you have opened it" error when two dispatch staff edit the same Delivery Order at once, and how does Frappe prevent the second save from silently overwriting the first? (One paragraph

Frappe checks whether the document was modified by someone else after you opened it. If it detects a change, it stops the save to prevent overwriting their updates and shows: “Document has been modified after you have opened it.”
      
4.In README_internals.md: why is frappe.get_all dangerous in a whitelisted method exposed to low-privilege users?

Because it shows all the record of an doctype to user even if that user don't have permission to access the data. That will leads to unauthorized access and data loss.

5.Call self.save() inside on_update and observe what breaks so happens?
on_update automatically save so when we use save again inside on_update it made into recursion

6.In README_internals.md: why does a frappe.call inside the validate client event not work, and why must async fetches happen in onload/refresh instead?
 validate is a synchronous method, frappe.call is asynchronous and takes time to complete. The document will saved before the frappe.call response.
