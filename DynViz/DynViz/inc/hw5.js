function cleandata(indata) {
	//Someone tell NOAA they've got a typo in their column names.
	//Filtering out non-hourly reporting.
    var filtered = _.filter(indata,{'REPORTTPYE':'FM-15'}); 
	//Grab relevant fields only.
	var picked = _.map(filtered, function(elem) { return _.pick(elem, 'STATION', 'STATION_NAME', 'LONGITUDE', 'LATITUDE','HOURLYPrecip','HOURLYVISIBILITY','HOURLYWindSpeed','DATE'); });
	//Nest on Station (4 results).
	var shifted = d3.nest().key(function(elem) { return elem['STATION'] }).entries(picked);
	shifted.forEach(function(elem) { 
		elem.Name = elem.values[5].STATION_NAME;
		elem.Lat = elem.values[5].LATITUDE;
		elem.Long = elem.values[5].LONGITUDE;
		//Cleanup parent-stored value data.		
		elem.values = _.map(elem.values, function(subelem) { return _.pick(subelem, 'HOURLYPrecip','HOURLYVISIBILITY','HOURLYWindSpeed','DATE'); }); 
		//Nest each station's results on the Date component of the DATE field.
		elem.values = d3.nest().key(function (subelem) { return subelem['DATE'].substring(0,10); }).entries(elem.values);
		//Grab overall daily values, rather than hourly ones.
		elem.values.forEach(function(subelem) {
			subelem.TotalPrecip = d3.sum(subelem.values,function(sse) { return sse.HOURLYPrecip; });
			subelem.AvgWind = d3.sum(subelem.values,function(sse) { return sse.HOURLYWindSpeed; })/subelem.values.length;
			subelem.AvgVis = d3.sum(subelem.values,function(sse) { return sse.HOURLYVISIBILITY; })/subelem.values.length;					
		});
	});
	return shifted;
};

//Variables i require in multiple locations for ease of coding.
var final_data = {};
var yscale = d3.scaleLinear().range([500,0]).domain([37.5,38]);
var xscale = d3.scaleLinear().range([500,0]).domain([-122,-122.5]);
var rscale = d3.scaleLinear().range([5,50]);
var cscale = d3.scaleLinear().range([0,1]);
var keydate = "";
var rdim = "";
var cdim = "";
var svg = d3.select("svg").append("g").attr("transform", "translate(0,0)");


//Screwbally stuff for an "axis"...
/*
var colorscale = d3.scaleLinear().range(["rgb(247, 251, 255)","rgb(8, 48, 107)"]);
var caxis = d3.select("svg").append("g").attr("transform", "translate(650,150)");
var raxis = d3.select("svg").append("g").attr("transform", "translate(530,150)");
var ca = d3.legendColor().cells(10).scale(colorscale).shapeWidth(30).orient("vertical");
var ra = d3.legendSize().scale(rscale).shape("circle").shapePadding(5).labelOffset(12).orient("vertical");		   
*/

//Screw it. D3.Legend's busted. Do it myself.
var raxis = d3.select("svg").append("g").attr("transform", "translate(530,150)");
var caxis = d3.select("svg").append("g").attr("transform", "translate(660,180)");
var ly = [40,75,125,200,300];
for(i = 0; i < 5; i++) {
	raxis.append("circle").attr("r",5+(9*i)).attr("cx",25).attr("cy",ly[i]);
	raxis.append("text").classed('ral',true).attr("x",80).attr("y",ly[i]+5);
}
for(i = 0; i < 10; i++) {
	caxis.append("rect").attr("x",0).attr("y",i*30).attr("height",30).attr("width",15).attr("fill",d3.interpolateBlues(i/9));
	caxis.append("text").classed('cal',true).attr("x",30).attr("y",(i*30)+17);
}

//Reusing variables is fun.
var tooltip = d3.select("svg").append("g").attr("transform", "translate(0,0)");
  var tts = tooltip.append("text").attr("x", 510).attr("y", 16);
  tts.append("tspan").classed("label",true).text("Location:      ");  
  tts.append("tspan").classed("value",true).attr("id","loc");
  //Bad way to text wrap, but I can't find an easy way that's been mass adopted.
  tts = tooltip.append("text").attr("x", 510).attr("y", 34); 
  tts.append("tspan").classed("value",true).attr("id","loc2");   
  tts = tooltip.append("text").attr("x", 510).attr("y", 56);
  tts.append("tspan").classed("label",true).text("Precipitation: ");  
  tts.append("tspan").classed("value",true).attr("id","Precip");
  tts = tooltip.append("text").attr("x", 510).attr("y", 76);
  tts.append("tspan").classed("label",true).text("Wind Speed:    ");  
  tts.append("tspan").classed("value",true).attr("id","WS");
  tts = tooltip.append("text").attr("x", 510).attr("y", 96);
  tts.append("tspan").classed("label",true).text("Visibility:    ");  
  tts.append("tspan").classed("value",true).attr("id","Vis");
		 
//Initialization Function. Set up the objects, put the circles in their initial positions.
function create_graph() {
	svg.selectAll("circle").data(final_data).enter()
	   .append("circle")
	   .attr("cx",function(d) { return xscale(parseFloat(d.Long)); })
	   .attr("cy",function(d) { return yscale(parseFloat(d.Lat)); })
	   .style("stroke","black")
	   .style("stroke-width",1)
	   .on("mouseover",do_display)
	   .on("mouseout",hide_display);
}

//The main "update" function.
function show_graph() {
	//This block just figures out what date the slider is set to.
    var sliderval = $('#controls').slider("option", "value");
	var d2 = d.addDays(sliderval);
	var zeromonth = (d2.getMonth()+1 > 9) ? parseInt(d2.getMonth())+1 : "0"+(d2.getMonth()+1);
	var zeroday = (d2.getDate() > 9) ? d2.getDate() : "0"+(d2.getDate());
	keydate = "2016-"+zeromonth+"-"+zeroday;
    
	//And we need to know what scales we're using.
	rdim = d3.select("#SizeScale").property("value");
	cdim = d3.select("#ColorScale").property("value");

	//Figure out the domains for those scales.
	rscale.domain([0,d3.max(final_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[rdim]); }); })])
	cscale.domain([0,d3.max(final_data,function(elem) { return d3.max(elem.values,function (subelem) { return parseFloat(subelem[cdim]); }); })])
	
	//Update our circles. The Lat and Long doesnt change, so it's just the size and color we need to worry about.
	var circles = svg.selectAll("circle").data(final_data);
	circles.merge(circles)
	.transition(1500)
	.attr("r",function (elem) {
		var daydata = _.filter(elem.values,{'key':keydate});
		var value = (daydata.length == 1) ? daydata[0][rdim] : 0;
		return rscale(value);
	})
	.style("fill", function (elem) {
		var daydata = _.filter(elem.values,{'key':keydate});
		var value = (daydata.length == 1) ? daydata[0][cdim] : 0;
		return d3.interpolateBlues(cscale(value));
	});
	
	//Update the legend... this is buggy :(
	//The numbers update, but the colors and shapes go rather badly wrong.
	//raxis.call(ra);
	//caxis.call(ca);
	//My Bodged Way - JQuery
	$(".ral").each(function(idx,elem) { $(this).text((rscale.domain()[0]+((rscale.domain()[1]-rscale.domain()[0])/4*idx)).toFixed(2));});
	$(".cal").each(function(idx,elem) { $(this).text((cscale.domain()[0]+((cscale.domain()[1]-cscale.domain()[0])/9*idx)).toFixed(2));});	
}

function do_display() {
	//Show the text in the tooltip. First grab the data from the object..
	var data = d3.select(this).data()[0]
	//Fill in the location name.
	tooltip.select("#loc").text(data.Name.substring(0,18));
	tooltip.select("#loc2").text(data.Name.substring(18));
	//Now we need to figure out the specific stats for this day.
    var sliderval = $('#controls').slider("option", "value");
	var d2 = d.addDays(sliderval);
	var zeromonth = (d2.getMonth()+1 > 9) ? parseInt(d2.getMonth())+1 : "0"+(d2.getMonth()+1);
	var zeroday = (d2.getDate() > 9) ? d2.getDate() : "0"+d2.getDate();
	keydate = "2016-"+zeromonth+"-"+zeroday;	
	var daydata = _.filter(data.values,{'key':keydate});
	daydata = (daydata.length == 1) ? daydata[0] : {'TotalPrecip': "<No Data>",'AvgWind': "<No Data>",'AvgVis': "<No Data>"};
	//And now populate our text boxes.
	tooltip.select("#Precip").text(daydata.TotalPrecip + " in");
	tooltip.select("#WS").text(daydata.AvgWind + " mph");
	tooltip.select("#Vis").text(daydata.AvgVis + " mi");	
}

function hide_display() {
	//Hooray for mass-erasure.
	tooltip.selectAll(".value").text("");	
}

//The data loader and initializer.
d3.csv("./inc/808085.csv", function(error, data) {
	if (error) {
		console.log(error);
	} else {
		final_data = cleandata(data);
		create_graph();
		show_graph();
	}
});

//Trigger for the select boxes to update the graph.
d3.selectAll("select").on("change",show_graph);

//Screwed up stuff i gotta add because date maths.
Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];