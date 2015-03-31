super-tablefilter
----------------
   Simple jquery plugin to display checkbox based filter option next to table columns. Tested on ie8, FF 22
   
   Features:
     Checkbox based filter
	 Automatically creates filter popup using table values on client side.
	 Multi checkbox filter support(like in excel spreadsheet filter)
	 
 1. To initialize use:  
	superFilterPlugin = $(tableId).superFilter({ignoreColumnIndexes:[5], groupColumnIndex:2});

 2. call extractFilters() method to retreive the filter parameters used (for storing to db etc)
 3. call applyFilters() to apply filters previously selected
 
 4. A div with below htmls for checkbox popup is required in html page
 
 <div id="popupFilter" style="position: absolute; display: none; height: 200px; width: 200px; border: 1px solid #B6B6B6; background: #CCDDE6; opacity: 0.98;" tabindex="-1" onblur="$('#popupFilter').hide() ">
	<table>
		<tr>
			<td>
				<div id="popupFilterBody" style="height: 150px; width: 200px; border: 1px solid #B6B6B6; background: #CCDDE6; opacity: 0.98; overflow-y: scroll; font-size: 10px"></div>
			</td>
		</tr>
		<tr>
			<td><input type="button" id="FilterApplyButton" name="Apply" value="Apply" /> <input type="button" name="Close" value="Close" onclick="$('#popupFilter').hide()" /></td>
		</tr>
	</table>
</div>