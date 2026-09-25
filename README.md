1.In README_internals.md: rename a test Rider record. Does assigned_rider on linked Delivery Orders update automatically? Why or why not?
      No, Link fields store the document name,there they do not update automatically when linked.
      
2.The snippet below has two bugs related to document lifecycle. Identify both and write the corrected version in README_internals.md:
 validate() is already part of the save process. Calling self.save() again causes recursive saving.

3.In README_internals.md: why would you see a "Document has been modified after you have opened it" error when two dispatch staff edit the same Delivery Order at once, and how does Frappe prevent the second save from silently overwriting the first? 
Frappe checks whether the document was modified by someone else after you opened it. If it detects a change, it stops the save to prevent overwriting their updates and shows: “Document has been modified after you have opened it.”
      
4.In README_internals.md: why is frappe.get_all dangerous in a whitelisted method exposed to low-privilege users?
Because it shows all the record of an doctype to user even if that user don't have permission to access the data. That will leads to unauthorized access and data loss.

5.Call self.save() inside on_update and observe what breaks so happens?
on_update automatically save so when we use save again inside on_update it made into recursion

6.In README_internals.md: why does a frappe.call inside the validate client event not work, and why must async fetches happen in onload/refresh instead?
 validate is a synchronous method, frappe.call is asynchronous and takes time to complete. The document will saved before the frappe.call response.

7.README_internals.md: show the f-string version side by side with the parameterized version, and explain why the latter is always preferred.
F-strings insert values directly into the SQL query, which can make it error to sql.parameterized sql keeps the values separate from the query,making it safer.

8.In README_internals.md: explain the difference between putting a frappe.get_all() call directly inside the Jinja template versus pre-computing in before_print() and referencing doc.precomputed_field.
when frappe.get_all() is called directly inside the Jinja template everytime the whole data is fetched but if it is pre-computed it can be used easily and is optimized.
