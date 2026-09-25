1.In README_internals.md: rename a test Rider record. Does assigned_rider on linked Delivery Orders update automatically? Why or why not?
      No, Link fields store the document name,there they do not update automatically when linked.
      
2.In README_internals.md: why would you see a "Document has been modified after you have opened it" error when two dispatch staff edit the same Delivery Order at once, and how does Frappe prevent the second save from silently overwriting the first? (One paragraph.)
      Frappe checks whether the document was modified by someone else after you opened it. If it detects a change, it stops the save to prevent overwriting their updates and shows: “Document has been modified after you have opened it.”
      
3.
