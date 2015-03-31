var superFilterPlugin;

(function( $ ) { 
	
	var tableArray = new Array();
	var filteredColumnsArray = new Array();//holds the column names on which filter is applied
	var superTable;
	var version = 0.14;
	var ignoreColumnIndexes;
	var groupColumnIndex;
	var external;
	var isModified=false;
    $.fn.superFilter = function(options ) {
    	 var settings = $.extend({ }, options );
    	 ignoreColumnIndexes = settings.ignoreColumnIndexes;
    	 groupColumnIndex = settings.groupColumnIndex;
    	 superTable = this.selector
    	 
    	 init();
        return external;
    };
    
    //public functions
    external={
	    'disableFilter': function(){
    		disableFilter();
	    	return external;
	    },
	    'enableFilter': function(){
	    	enableFilter();
	    	return external;
	    },
	    'extractFilterValues' : function(extractFiltersFieldId){
	    	extractFilterValues(extractFiltersFieldId);
	    	return external;
	    },
	    'applyFilters' : function(filters){
	    	applyFilters(filters);
	    	return external;
	    },
		'isModified' : function(){
			return isModified;
		}
	}
    
    function applyFilters(filters){
    	log("applying filters : " + filters);
    	
    	var filtersAr = filters.split("\n")
    	$.each(filtersAr, function(idx){
    		var line = $(this)[0];
    		if(line==''){
    			return;
    		}
    		log("\tHandling filter : "+line);
    		
    		var tokens = line.split("|")
    		log("\t tokens "+ tokens)
    		var headerName = tokens[0];
    		var filterOrder = tokens[1];
    		var values= tokens[2];
    		var valuesTokens = values.split('~~');
    		$.each(valuesTokens, function(idx){
    			var text = this.toString();
    			valuesTokens[idx] = text.split("//")[0];
    		});
    		
    		buildFilterData(headerName);
    		
    		log("\tUpdating filter values : "+ valuesTokens);
    		//update filter values 
    		 $ .each(tableArray[headerName].filterValuesAr , function(index){
					var text = $(this)[0] ;
					log("\t\tChecking filter value : "+ text);
					//handle on click checkbox filter
					
					if($.inArray(text.toString(), valuesTokens) != -1){
						log("\t\tFound filter value : "+ text);
						tableArray[headerName].filterCheckedAr[index]= false;	
					}
    		 });
    		 
    		 filterColumn(headerName, false);
    	});
    	
    }
    
    function extractFilterValues(extractFiltersFieldId){
    	var encodedFilterValues="";
    	$.each(filteredColumnsArray, function(filteredRowIndex){
    		var columnHeader = this.toString() ;
    		encodedFilterValues = encodedFilterValues + columnHeader + "|"+filteredRowIndex+"|";
    		log("clearing header : "+ columnHeader);
    		$.each(tableArray[columnHeader].filterValuesAr, function(filteredValsIndex){
    			var value = tableArray[columnHeader].filterValuesAr[filteredValsIndex] ;
    			var isChecked = tableArray[columnHeader].filterCheckedAr[filteredValsIndex];
    			var spoItemIdAr = tableArray[columnHeader].spoItemIdAr[filteredValsIndex] ;
    			if(isChecked == false ){
    				encodedFilterValues = encodedFilterValues + value +"//"+ spoItemIdAr + "~~";
    			}
    		});
    		encodedFilterValues = encodedFilterValues + "\n";
    		
    	});	   
    	$('#'+extractFiltersFieldId).val(encodedFilterValues);
    }
    
    function disableFilter(){
    	$('.filterDropDown').hide();
    	//clear all filter applied
    	var filteredColumnsArrayTemp = jQuery.extend(true, {}, filteredColumnsArray); //clone it
    	$.each(filteredColumnsArrayTemp, function(filteredRowIndex){
	    		var columnHeader = this.toString() ;
	    		log("clearing header : "+ columnHeader);
	    		tableArray[columnHeader].filterValuesAr = [];
				tableArray[columnHeader].filterCheckedAr = [];
				tableArray[columnHeader].multiFilterAppliedAr =[];	
				tableArray[columnHeader].spoItemIdAr = [];
				updateFilteredRowsDetail(columnHeader, false);
    	});
    	
    	filteredColumnsArray=[];
    	$('tr:[class=tableStyleRow]').show();
    	  
    }
    
    function enableFilter(){
    	$('.filterDropDown').show();
    }
    
    //private functions
    function init(){
    	log("*** super filter init *** version :"+ version);
		//load table head columns
		loadHeader();
    	//dumpTable();
	 }
    
    function loadHeader(){
		 var headers = $(superTable).find('tr[class="tableHeaderRow"] td');
		log("Caching table headers  " );
		 $(headers).each(function(index){
			   
			   var label =  $(this).attr("filterName");
			   if(index == groupColumnIndex ){ //is group column found
				   var anchorId= '__SubVendor';  label= "SUBVEN";
				   var appendFilterHtml = label + '<a href="#" id="' + anchorId + '" class="filterDropDown" style="text-decoration:none;padding:1px" > <img height="20px" src="images/select.png" border="0"></img></a> ';
				   appendFilterToHeader(this, appendFilterHtml, label, -1, anchorId);
				   
				   anchorId= '__Class';  label= "CLS";
				   var appendFilterHtml = label + '<a href="#" id="' + anchorId + '" class="filterDropDown" style="text-decoration:none;padding:1px" > <img height="20px" src="images/select.png" border="0"></img></a> ';
				   appendFilterToHeader(this, appendFilterHtml, label, index, anchorId);
				   
			   } else if($.inArray(index, ignoreColumnIndexes)<0){			   
				   var anchorId= '__'+removeSpace(label);
				   var appendFilterHtml = '<a href="#" id="' + anchorId + '" class="filterDropDown" style="text-decoration:none;padding:1px" > <img height="20px" src="images/select.png" border="0"></img></a> ';
				   appendFilterToHeader(this, appendFilterHtml, label, index, anchorId);
			   }
			}
			);
		 log("Table headers: " + tableArray);
	}
    
    function appendFilterToHeader(currentObj, appendFilterHtml, label, index, anchorId ){
    	 $(currentObj).append(appendFilterHtml);
		 $('#'+anchorId).bind("click", function() {
			   log("Bound event called on : "+ label);
			   showFilter(label , this)
		   });
		   
		 if( $.inArray(label, tableArray) == -1 ){
			   tableArray.push(label);
			   tableArray[label]= new FilterData(index, new Array(), new Array(),new Array(), new Array());
		 }
    }
    
	function buildFilterData(headerTxt){
		log("buildFilterData() - > building filter data on demand : " +headerTxt );
		index = tableArray[headerTxt].columnPosition;
		
		log('handling header :' + index +' : '+ headerTxt);
		
		if(  $.inArray(headerTxt, filteredColumnsArray) != -1 ){ //already filter applied
			log("Not building filter again as filter data was previously built. Only updatign isMultifiler");
		}else{ //clear array 
			log("clearing tableArray for header :"+ headerTxt)
			tableArray[headerTxt].filterValuesAr = [];
			tableArray[headerTxt].filterCheckedAr = [];
			tableArray[headerTxt].multiFilterAppliedAr =[];
			tableArray[headerTxt].spoItemIdAr = [];
		}
			
		//load data
		var findRowPattern = 'tr:[class=tableStyleRow] > td:nth-child(' + (index+1) + ')';
		if(headerTxt == "SUBVEN"){
			findRowPattern = 'tr:[class=tableSubVendorRow] > td:nth-child(3)' ;
		}
		
		$(superTable).find(findRowPattern).each( function(){
			dataTxt = getTextFromInputOrLabel(this);
			var row = $(this).parent();
			var isMultiFilter = $(row).is(":hidden") ? true : false;
			var indxFilterVal = $.inArray(dataTxt, tableArray[headerTxt].filterValuesAr);
			if( indxFilterVal == -1 ){// add unique values if not previously added
					log("\t\t Pushing unique data :"+dataTxt +", isMultiFilter :"+isMultiFilter );
					tableArray[headerTxt].filterValuesAr.push(dataTxt);
					tableArray[headerTxt].filterCheckedAr.push(true);					
					tableArray[headerTxt].multiFilterAppliedAr.push(isMultiFilter);
					tableArray[headerTxt].spoItemIdAr.push(new Array());
			 }else if(isMultiFilter == false){ //update isMultiFilter if it is not hidden
				 	log("\t\t Resetting isMultiFilter : "+ isMultiFilter);
				 	tableArray[headerTxt].multiFilterAppliedAr[indxFilterVal] = isMultiFilter; //false
			 }
		  }
		);
		log('\t Finished loading data  : '+ tableArray[headerTxt].filterValuesAr);
		dumpTable(headerTxt);
			
	 }

	
	//displays the filter checkbox window
	function showFilter(header, obj){
		buildFilterData(header);
		var offset = $(obj).offset();
		var checkboxContent='';
		
		var id = removeSpace(header)+'_selectAll';
		checkboxContent = checkboxContent + '<input type="checkbox" checked="checked"  id="'+ id+'" name="' + id + '" value ="">Select All</input></br>';
		
		 $ .each(tableArray[header].filterValuesAr , function(index){
					text = $(this)[0] ;
					//handle on click checkbox filter
					var isChecked = tableArray[header].filterCheckedAr[index];
					var isMultifilterApplied = tableArray[header].multiFilterAppliedAr[index];
					var checkedTxt= isChecked ? 'checked="checked"' : "";
					//TODO: along with multi filter check if the column value is visible in any rows then display
					var isMultiDataVisible = false;
					$(superTable).find('tr:visible[class=tableStyleRow] > td:nth-child(' + ( tableArray[header].columnPosition + 1) + ')').each(function(pos){
						var dataTxt = getTextFromInputOrLabel(this);
						if(text ===  dataTxt){
							isMultiDataVisible = true;
							return;
						}
					});
					
					if(isMultifilterApplied==false || isMultiDataVisible == true ){  
						checkboxContent = checkboxContent + '<input type="checkbox"' + checkedTxt + ' id="' + removeSpace(header)+'_'+ removeSpace(text)+ '" name="' + text+ '" value ="' + text +'">'+ text +'</input></br>';
					}
		});
		
		  $('#popupFilterBody').html(checkboxContent)
		  $('#popupFilter').css('left', (offset.left + 10)+'px' );
		  $('#popupFilter').css('top', (offset.top + 10)+'px' );
		  
		  $('#FilterApplyButton').unbind();
		  $('#FilterApplyButton').bind("click", function() {
			  filterColumn(header, true);
		  });
		  
		  $("#"+ id).unbind();
		  $("#"+ id).click(function() { //bind select all event
			   log("Bound select all event called on : "+ header);
			   filterColumnSelectAll(header, this);	
		  });
		  
		  $('#popupFilter').show()

	}
	
	//filter rows once user clicks 'Apply' button
	function filterColumn(columnHeader, isEventFromView){
		    isModified = true;			 
			log("Before filtering on : "+ columnHeader);
			dumpTable(columnHeader);
			var columnPosition = tableArray[columnHeader].columnPosition
			var filterValuesAr = tableArray[columnHeader].filterValuesAr;
			var filterCheckedAr = tableArray[columnHeader].filterCheckedAr;
			
		    var isFilterApplied = false;
		    //update checked status in matrix
		    if(isEventFromView == true){
				    $.each(filterValuesAr, function(index){
						    	filterValue = this.toString() ;
						    	var checkBoxId = '#'+ removeSpace(columnHeader )+ '_'+ removeSpace(filterValue);
						    	if($( checkBoxId).is(':visible') == true){
							    	var isChecked = $( checkBoxId).is(':checked');
							    	isChecked = isChecked==undefined ? alert("isChecked undefined :("): isChecked;
							    	filterCheckedAr[index] = isChecked; //update check status
							    	if(isFilterApplied == false && (isChecked == false)){
							    		isFilterApplied = true;
							    	}
							    	log(checkBoxId +" :: "+ index + ' ::: ' + filterValue +', isChecked = ' + isChecked);
						    	}
						    	
						    	
				    });
			}else{
				isFilterApplied = true;
			}
		    
		    applyFilterOnRows(columnHeader)
			updateFilteredRowsDetail(columnHeader, isFilterApplied);
			
			log("After applying filtering on : "+ columnHeader);
			dumpTable(columnHeader);
	}
	
	function applyFilterOnRows(columnHeader){
		log("Applying filter based on row data text for : " + columnHeader );
		var columnPosition = tableArray[columnHeader].columnPosition
		var filterValuesAr = tableArray[columnHeader].filterValuesAr;
		var filterCheckedAr = tableArray[columnHeader].filterCheckedAr;
		var multiFilterAppliedAr = tableArray[columnHeader].multiFilterAppliedAr;
		var spoItemIdAr = tableArray[columnHeader].spoItemIdAr;
		var spoItemIdTempAr = new Array();
		
		//hide or show rows based on checked status
		$(superTable).find('tr[class=tableStyleRow] > td:nth-child('+(columnPosition+1)+')').each(function(){
			var label = getTextFromInputOrLabel(this);
			//log("Matching rowd data text :" + label );					
			var dataIndex = $.inArray(label, filterValuesAr);
			var isSelected = filterCheckedAr[dataIndex];
			var row = $(this).parent();
			var spoItemId = $(row).find("[name=SpoItemId]").val();
				
			if(isSelected == false){
				$(row).hide();
				pushUniqueToArray(spoItemId, spoItemIdAr[dataIndex]);  
			}else{
				$(row).show();
				removeFromArray(spoItemId, spoItemIdAr[dataIndex])
			}
			
			// handle multi filter values : reset flag on other filter data values which are unselected on this filter column
		    $.each(filteredColumnsArray, function(filteredRowIndex){
		    		var filterHeaderName = this.toString() ;
		    		if(filterHeaderName != columnHeader){
		    			log("Handling multi filtering on "+ filterHeaderName);
		    			var filterHeaderColumnPosition = tableArray[filterHeaderName].columnPosition;  //remove the corresponding data value
		    			var inputOrTextField=$(row).children("td:nth-child("+(filterHeaderColumnPosition + 1)+")");
		    			
	    				var filterRowLabel = getTextFromInputOrLabel(inputOrTextField);
	    				var filterColumnIndex = $.inArray(filterRowLabel, tableArray[filterHeaderName].filterValuesAr);
	    				 
	    				//log("\t Clearing filter value if available : "+ filterRowLabel +", index : "+ filterColumnIndex);
	    				 
	    				if(filterColumnIndex >=0){
		    					 if(tableArray[filterHeaderName].filterCheckedAr[filterColumnIndex] ==true){
		    						 log("\t\t Resetting multifilter flag from >> filterHeaderName :"+ filterHeaderName+ ", filterRowLabel : "+ filterRowLabel +", multifiler : "+ !isSelected);
		    						 tableArray[filterHeaderName].multiFilterAppliedAr[filterColumnIndex] = !isSelected;
		    					 }else if(tableArray[filterHeaderName].multiFilterAppliedAr[filterColumnIndex] == true){
		    						 log("\t\t Resetting multifilter flag from >> filterHeaderName :"+ filterHeaderName+ ", filterRowLabel : "+ filterRowLabel +", multifiler : "+ !isSelected);
		    						 tableArray[filterHeaderName].multiFilterAppliedAr[filterColumnIndex] = !isSelected;
		    					 }
		    					// check multi filter applied
		    					 var isFilterSelectedOnMultiFilter = tableArray[filterHeaderName].filterCheckedAr[filterColumnIndex];
		    					 if(isFilterSelectedOnMultiFilter==false){
		    						 $(row).hide();
		    						 pushUniqueToArray(spoItemId, tableArray[filterHeaderName].spoItemIdAr[filterColumnIndex]);
		    					 }
	    				}
	    				
		    		}
		    		
		    });
	    	
		});
		
		
	} 
	
	function removeFromArray(elementToRemove, elementAr){
		var index = $.inArray(elementToRemove, elementAr)
		if(index > -1)
			elementAr.splice(index, 1);
	}
	
	function pushUniqueToArray(elementToPush, elementAr){
		var index = $.inArray(elementToPush, elementAr)
		if(index == -1)
			elementAr.push(elementToPush);
	}
	
	function getTextFromInputOrLabel(obj){
		var label;
		if($(obj).find(':input').length > 0 ){ 
			label = $(obj).find(':input').val(); //handle input text
		}else{
			label = $.trim( $(obj).text() ); 					
		}
		return label;
	}
	

	function updateFilteredRowsDetail(columnHeader, isFilterApplied){
		    var index = $.inArray(columnHeader, filteredColumnsArray)
		    
		    if(isFilterApplied){
		    	if(index < 0){
		    		filteredColumnsArray.push(columnHeader);
		    		$('#__' + removeSpace(columnHeader)).html("<img height='20px' src='images/filter.png' border='0'></img>")
		    	}
		    }else if (index >= 0) {
		    	filteredColumnsArray.splice(index, 1); //remove from array
		    	 var indexTblAr = $.inArray(columnHeader, tableArray)
		    	 log("Clearing multi filter flag on tableArray for : "+columnHeader);
		    	 $.each(tableArray[columnHeader].multiFilterAppliedAr, function(filteredRowIndex){
		    		 tableArray[columnHeader].multiFilterAppliedAr[filteredRowIndex]=false;
		    	 });
		    	 dumpTable(columnHeader);
		    	 
		    	$('#__' + removeSpace(columnHeader)).html("<img height='20px' src='images/select.png' border='0'></img>")
		    }
		    
		    log("Following rows have filter applied : " + filteredColumnsArray);
	}
	
	function filterColumnSelectAll(header, thisObj){
		log("Calling : filterColumnSelectAll");
		$ .each(tableArray[header].filterValuesAr , function(index){
			text = $(this)[0] ;
			var isChecked = $(thisObj).attr('checked');	
			isChecked = isChecked==undefined ? false: isChecked;
			var id = removeSpace(header)+'_'+ removeSpace(text)
			tableArray[header].filterCheckedAr[index] = isChecked;
			
			$('#'+id).attr('checked', isChecked);
		});
		
	}
	
	function removeSpace(str1){
			return str1.replace(/[^a-z0-9A-Z]+/g, '_')									
	}
	
	
    function log(obj){
		if(window.console!=null){
					console.log(obj);
		}
    }
    
	function dumpTable(headerTxt){
		log("\nDumping table header with values :  " + headerTxt );
			
			$(tableArray[headerTxt]).each( function(index){
					log( "\t ColumnPosition : "+ this.columnPosition );
					log( "\t Values  	 : "+ this.filterValuesAr );
					log( "\t Checked 	 : "+ this.filterCheckedAr );
					log(  "\t Multifilter: "+ this.multiFilterAppliedAr);
					log(  "\t SpoItemIdAr: "+ this.spoItemIdAr);
			});
		log("\n" );
	}
 
    //Class to hold filter data and checked status
	function FilterData(columnPosition, filterValuesAr, filterCheckedAr, multiFilterAppliedAr, spoItemIdAr) {
		this.columnPosition = columnPosition;
	    this.filterValuesAr= filterValuesAr;
	    this.filterCheckedAr= filterCheckedAr;
	    this.multiFilterAppliedAr = multiFilterAppliedAr;
	    this.spoItemIdAr = spoItemIdAr;
	}
	
	
}( jQuery ));

function initSpoUploadFilter(tableId){
	superFilterPlugin = $(tableId).superFilter({ignoreColumnIndexes:[5], groupColumnIndex:2});
	
	$("#toggleFilter").change(function() {
	   var isChecked = $("#toggleFilter").attr("checked");
	   if(isChecked){
		   superFilterPlugin.enableFilter();
	    }   else{
	    	superFilterPlugin.disableFilter();
	    }
	});	
	
	$("#toggleFilter").attr("checked",true);
}
function extractToggleFilter(){
	return true; //TODO: fix toggle filter button
}
function extractFilters(){
	superFilterPlugin.extractFilterValues('extractedFilters');
	return $('#extractedFilters').val();
}

function applyFilters(){
	var filters = $('#extractedFilters').val();
	superFilterPlugin.applyFilters(filters);
}
function isFilterModified(){
	return superFilterPlugin.isModified();
}