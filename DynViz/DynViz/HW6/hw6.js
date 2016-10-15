//Global Variable Storage
var clean_data = [];
var sites = {};
var xScale = d3.scaleLinear().range([0,720]);
var yScale = d3.scaleLinear().range([520,0]);
var zScale = d3.scaleLinear().range([0,1]);
var rScale = d3.scaleLinear().range([1,50]);
var raScale = d3.scaleLinear().range([520,0]);
var zaScale = d3.scaleLinear().range([520,0]);
var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);
var zAxis = d3.axisLeft(zaScale);
var rAxis = d3.axisRight(raScale);
var keydate = {};
var xcat,ycat,zcat,rcat,slice,curtt;
var chart = {
	"width": 700,
	"height": 500,
}
var ttkeys = [
{ "field":"GHI","name":"Global Horizontal Irradiance (PSP)" },
{ "field":"DNI","name":"Direct Normal Irradiance"},
{ "field":"DHI","name":"Diffuse Horizontal Irradiance"},
{ "field":"GHI-L","name":"Global Horizontal Irradiance (LI-COR)"},
{ "field":"TEMP","name":"Air Temperature"},
{ "field":"HUM","name":"Humidity"},
{ "field":"VOLTS","name":"Battery Voltage"}
];
var ttwidth = "350px";
var ttheight = "215px";

//Data Sorting
function data_sort(error,data) {
   if(error) { throw error; } //Fail-Loud
   console.log("Cleaning Data...");
   sites = data.pop(); //Chunk off the last element, because thats different.
   clean_data = [] //Storage for merging...
   data.forEach(function(file) {
		var nested = d3.nest()
						.key(function (elem) { return elem.STATION; })
						.key(function (elem) { return elem.YEAR + "/" + elem.MONTH + "/" + elem.DAY + " " + elem.HOUR + ":00"})
						.entries(file);
		//Cleanup. Because i'm pedantic about redundancy i guess?
		var cleaned = _.map(nested,function (elem) { 
			elem.image = sites.images[elem.key];
			elem.name = sites.names[elem.key];
			elem.values = _.map(elem.values, function(subelem) {
				subelem.values = _.map(subelem.values,function (subsubelem) {
					return _.omit(subsubelem,['STATION','YEAR','MONTH','DAY','HOUR','MINUTE']); 
					//In another moment down went Alice after it, never once considering how in the world she was to get out again.
				});
				//Rollup the averages of the remaining statistics.
				Object.keys(subelem.values[0]).forEach(function (keyname) {
					subelem[keyname] = d3.sum(subelem.values, function(wark) { return wark[keyname]; })/subelem.values.length;
				});
				return subelem;
			});
			return elem;
		});
		//Could be done with an array reference, but this way i dont lose any information if more than 1 station is in a file.
		cleaned.forEach(function (elem) { clean_data.push(elem) }); 
   });
   console.log("Data Cleaned. Initializing Chart")
   create_chart();
}

//Chart Initialization
function create_chart() {
	//Create Circles
	var g = canvas.selectAll("g").data(clean_data).enter().append("g").on("click",show_tooltip).on("mouseover",function (d) { d3.select(this).select("circle").attr('stroke','black').attr('stroke-width','5px'); }).on("mouseout",function (d) { if(this != curtt) { d3.select(this).select("circle").attr('stroke','none').attr('stroke-width','0px'); } });
	g.append("circle").on("mouseover",function (d) { d3.select(this).attr('stroke','black').attr('stroke-width','5px'); });
	g.append("image").attr("xlink:href", function(elem) { return elem.image; }).attr('width','0px').attr('height','0px');
	// ... and... that's all?
	//Hide the "Loading" screen, so we can see the graph.
	loading.style('display','none');
	//Initial display call.
	update_chart();
}

//Display update.
function update_chart() {
	//The Workhorse.
    //Initial Variable Retrieval: Scales and Slider
	var datetoadd = $('#date').slider("option", "value");
	xcat = document.getElementById('x').value;
	ycat = document.getElementById('y').value;
	zcat = document.getElementById('z').value;
	rcat = document.getElementById('r').value;
	
	//Close the tooltip if it's open.
	hide_tooltip();
	
	//Hour/day math to make the slider work.
	keydate = Date.parse("January 1, 1998").addHours(datetoadd).toString("yyyy/M/d H:mm");
	
	//Make the display show what date was chosen.
	d3.select("#datetext").text(keydate);
	
	//Domain the Scales.
	xScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[xcat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[xcat]); }); })]);
	yScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[ycat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[ycat]); }); })]);	
	zScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[zcat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[zcat]); }); })]);
	rScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[rcat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[rcat]); }); })]);
	zaScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[zcat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[zcat]); }); })]);
	raScale.domain([d3.min(clean_data,function(elem) { return d3.min(elem.values,function (subelem) { return parseFloat(subelem[rcat]); }); }),d3.max(clean_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[rcat]); }); })]);


	//Update the Axes
	d3.select("#xaxis").call(xAxis);
	d3.select("#yaxis").call(yAxis);
	d3.select("#zaxis").call(zAxis);
	d3.select("#raxis").call(rAxis);
	
	//Move the Circles, Recolor, and Resize them.
	var groups = canvas.selectAll("g");
	groups.selectAll("circle")
		  .transition()
			.delay(50)
			.duration(2000)
		  .attr("r",function(d){ 
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return 0; } else { data = data[0] };
			return (data.hasOwnProperty(xcat) & (data.hasOwnProperty(ycat)) & (data.hasOwnProperty(rcat)) & (data.hasOwnProperty(zcat)) ) ? rScale(data[rcat]) : 0; })		  
		  .attr("cx",function(d){ 
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return 0; } else { data = data[0] };
			return (data.hasOwnProperty(xcat)) ? xScale(data[xcat]) : 0; })
		  .attr("cy",function(d){ 
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return 0; } else { data = data[0] };
			return (data.hasOwnProperty(ycat)) ? yScale(data[ycat]) : 0; })
		  .style("fill",function(d){ 
		    var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return "#000000"; } else { data = data[0] };		
			return (data.hasOwnProperty(zcat)) ? d3.interpolateRdYlGn(zScale(data[zcat])) : 0; });
			
    //Also the images. Ew, Maths.
	//For those that dont get the 'maths' bit: inscribing a square image into a circle means the size of the image (after a lot of simplifying) is Sqrt(2)*R.
	groups.selectAll("image")
		  .transition()
			.delay(50)
			.duration(2000)
		  .attr("height", function(d) { 
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return "0px"; } else { data = data[0] };			
			return (data.hasOwnProperty(rcat) & data.hasOwnProperty(xcat) & data.hasOwnProperty(ycat) & data.hasOwnProperty(zcat)) ?  Math.floor(Math.sqrt(2)*rScale(data[rcat]))+"px" : "0px"; })
		  .attr("width", function(d) {  
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return "0px"; } else { data = data[0] };			
			return (data.hasOwnProperty(rcat) & data.hasOwnProperty(xcat) & data.hasOwnProperty(ycat) & data.hasOwnProperty(zcat)) ?  Math.floor(Math.sqrt(2)*rScale(data[rcat]))+"px" : "0px"; })		  
		  .attr("x", function(d) {  
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return 0; } else { data = data[0] };			
			return (data.hasOwnProperty(rcat) & data.hasOwnProperty(xcat)) ?  xScale(data[xcat])-Math.floor(Math.sqrt(2)*rScale(data[rcat]))/2 : 0; })
		  .attr("y", function(d) {  
			var data = _.filter(d.values,{'key':keydate});
			if (data.length == 0) { return 0; } else { data = data[0] };			
			return (data.hasOwnProperty(rcat) & data.hasOwnProperty(ycat)) ?  yScale(data[ycat])-Math.floor(Math.sqrt(2)*rScale(data[rcat]))/2 : 0; });		  

}

function hide_tooltip() {
	//Hide the tooltip when something happens (scale change, date change, etc)
	d3.select(curtt).on("click",show_tooltip);
	var tt = d3.select("#tooltip");
	//Erase all text boxes.
	tooltip.selectAll("text").remove();
	//Hide the box.
	tt.transition().duration(50)
	.attr("width","0px")
	.attr("height","0px");
}

function show_tooltip() {
	//Oh boy this one got complex.
    //If someone clicked on a point while a tooltip is open, remove the stroke on the old point.
	d3.select(curtt).select("circle").attr('stroke','none').attr('stroke-width','0px');
	//Change the Onclick to close the tooltip on click.
	d3.select(this).on("click",hide_tooltip);
	//Need to store the current point that's being tooltip'd.
    curtt = this;	
	//Get the data for this point.
	var data = d3.select(this).data()[0];
	var datetoadd = $('#date').slider("option", "value");	
	keydate = Date.parse("January 1, 1998").addHours(datetoadd).toString("yyyy/M/d H:mm");
	slice = _.filter(data.values,{'key':keydate})[0];
	var tt = d3.select("#tooltip");
	
	//Do i put this tooltip to the left, or the right? Depends on if we're on the left or the right of the center point.
	var diff = parseFloat(d3.select(this).select("circle").attr('cx'))-355;
	if(diff == 0) { diff = 1 };
	var mult = (diff/Math.abs(diff))*-1;
	//Offset because the X coordinate refers to the left side of the box.
	var add = (diff > 0) ? 350 : 0 ;
	
	//Configure the X and Y coordinates of the box.
	var xmod = parseFloat(d3.select(this).select("circle").attr('cx')) + ((parseFloat(d3.select(this).select("circle").attr('r')) + 20)*mult) - add;
	var ymod = Math.min((550-parseInt(ttheight)-40),Math.max(10,parseFloat(d3.select(this).select("circle").attr('cy')) - (parseInt(ttheight) / 2)));
	//Close any existing textbox, move it to it's new coordinates while it is closed, and then open it to its proper size.
	tooltip.selectAll("text").remove();	
	tt.transition().duration(50)
	.attr("width","0px")
	.attr("height","0px")
	.transition().duration(0)
	.attr("x",xmod)
	.attr("y",ymod)
	.transition().duration(2000)
	.attr("width",ttwidth)
	.attr("height",ttheight);
	//Wait for the animation to complete, then....
	setTimeout(function() {
	 //Put the location name in.	
	 tooltip.append("text").classed("tttile",true).text(data.name).attr("x",xmod+10).attr("y",ymod+30);
	var i = 0;
	// For each data point element for this point, add a text box to display it.
	ttkeys.forEach(function (ttkey) { if(slice.hasOwnProperty(ttkey.field)) { 
		i++;
		tooltip.append("text")
		  .attr("x",xmod+10)
		  .attr("y",ymod+50+(20*i))
		  .text(ttkey.name+": "+parseFloat(slice[ttkey.field]).toFixed(2)+"\r\n"); 
	}});		
	},2050);	
}

//SVG setup
var svg = d3.select("svg").attr('width','1000px').attr('height','550px');
svg.append("g").classed("axis",true).attr("id","xaxis").attr('transform','translate(40,530)');
svg.append("g").classed("axis",true).attr("id","yaxis").attr('transform','translate(40,10)');
svg.append("g").classed("axis",true).attr("id","raxis").attr('transform','translate(800,10)');
svg.append("g").classed("axis",true).attr("id","zaxis").attr('transform','translate(875,10)');

//The actual 'graph area'.
var canvas = svg.append("g").attr('transform','translate(30,10)');
//For my legend-scales.
svg.append("image").attr("xlink:href","./images/RdYlGn.png").attr("x",780).attr("y",10).attr('height',"520px").attr('width',"20px").attr("stroke","black").attr("stroke-width","1px");
for(i = 0; i < 7; i++) {
	svg.append("circle").attr("cx",920).attr("cy",530-(i*104)).attr("r",1+(i*9.8))
}

//The "Loading" screen that displays until the data loads.
var loading = svg.append("g").attr('transform','translate(0,0)').attr('id','loading');
loading.append("rect").attr("height","550px").attr("width","1000px").attr("fill","#FFFFE0");
loading.append("text").classed('title',true).attr('text-anchor','middle').attr('x',500).attr('y',275).text("Loading");
//The tooltip.
var tooltip = svg.append("g").attr('transform','translate(30,10)').on("click",hide_tooltip);
tooltip.append("rect").attr("id","tooltip").attr("rx",15).attr("ry",15).attr("fill","#CCC");

//Setup Select Boxes
d3.select("#x").selectAll("option").data(ttkeys).enter().append("option").text(function(d) {return d.name;}).attr("value",function(d) {return d.field;});
d3.select("#y").selectAll("option").data(ttkeys).enter().append("option").text(function(d) {return d.name;}).attr("value",function(d) {return d.field;});
d3.select("#z").selectAll("option").data(ttkeys).enter().append("option").text(function(d) {return d.name;}).attr("value",function(d) {return d.field;});
d3.select("#r").selectAll("option").data(ttkeys).enter().append("option").text(function(d) {return d.name;}).attr("value",function(d) {return d.field;});

//Listeners
d3.selectAll('select').on('change',update_chart);
d3.select('input').on('change',update_chart);

//Data Loading
console.log("Loading Data...")
d3.queue()
  .defer(d3.csv,'./data/ep.csv')
  .defer(d3.csv,'./data/ec.csv')
  .defer(d3.csv,'./data/cn.csv')
  .defer(d3.csv,'./data/cl.csv')
  .defer(d3.csv,'./data/fs.csv')
  .defer(d3.json,'./data/images.json')
  .awaitAll(data_sort);  