//'use strict';

// First we'll set up some scales, at least the pixel side of things.
var xScale = d3.scaleBand().range([10, 530]).padding(0.2);
var yScale = d3.scaleLog().range([560, 50]);
// The "tickFormat" method makes the numbers on the axis look more reasonable.
var yAxis = d3.axisLeft(yScale)
              .tickFormat(d3.format(".1r"));

// Provide a pointer to our SVG DOM element (technically the "g" inside it).
var svg = d3.select("#viz").attr("width", 600).attr("height", 600)
            .append("g").attr("transform", "translate(50,20)");

// Provide a plot title.
svg.append("text").classed("title", true)
   .attr("x", 350).attr("y", 10)
   .text("Number of Events");
svg.append("text").classed("title", true)
   .attr("x", 350).attr("y", 40)
   .text("broken down by Category");

// Provide a placeholder for the axis.
svg.append("g").attr("id", "axis");


// This function will take incoming fairly raw JSON data and clean it up.
var cleanData = function(incoming_data) {
      // Pick out only these handful of attributes of the event.
      incoming_data = _.map(incoming_data, function(elem) {
        return _.pick(elem, 'category', 'event_name', 'event_url', 'free',
                      'kid_friendly', 'venue_name', 'web_description');
      });

// LOOKS LIKE event_url IS AN ERROR - NO SUCH FIELD IN DATA	  COIULD BE event_detail_url
	  
	  
//category
//critic_name
//date_time_description
					//event_detail_url
//event_id
//event_name
//event_schedule_id
//festival
//free
//kid_friendly
//last_chance
//last_modified
//long_running_show
//previews_and_openings
//recur_days
//recurring_end_date
//recurring_start_date
//state
//street_address
//subcategory
//telephone
//times_pick
//venue_name
//venue_website
//web_description
	  

	  
	  
	  
	  
	  	  
      // Ensure that each event has a "category".
      incoming_data.forEach(function(elem) {
        if (elem.category === undefined | elem.category === null) {
          elem.category = 'None';
        }
      });
	  
      // Nest on the category.
      var nested_data = d3.nest().key(function(elem) {
            return elem['category'];
          }).entries(incoming_data);
		  
	  // Calculate the number of events in each category.
      nested_data.forEach(function(elem) {
        elem.num_events = elem.values.length;
		
	  // Calculate the number of free events in each category.		
        elem.num_free = elem.values.reduce(function(total, first) {
          return total + first.free;
        }, 0);
	  // Calculate the number of kid_friendly events in each category.
        elem.num_kid_friendly = elem.values.reduce(function(total, first) {
          return total + first.kid_friendly;
        }, 0);
      });
      return nested_data;

};






// I have called the main callback function from d3.json simply "main".
var main = function(error, raw_data) {
  if (error) {
    alert("We had trouble accessing the data:\n\n" + error.currentTarget
            .responseURL + "\n\n" + error.currentTarget.statusText + "!!");
  }
// Clean up the data.
  var data = cleanData(raw_data.results);
  
 var dim = {
	transition: 1000,
	delay: 200,
	};
 
 
tmp_rdata = raw_data.results

// Define the domain side of our scales, now that we know the data.

  // Get the key element names by which the data is nested to use as X axis domain names 
  xScale.domain(data.map(function(elem) {
    return elem.key;
  }));
	// ["Theater", "Movies", "spareTimes", "forChildren", "Art", "Comedy", "Dance", "Jazz", "Classical", "Pop"]
  
  
  
  
// Get max numnber of events in all key types to set the Y scale (1 to the max data value)
  yScale.domain([1, d3.max(data, function(elem) {
           return elem.num_events;
         })]);

//COULD CHANGE PLOT FROM NUMBER OF EVENTS TO FREE OR KID FRIENDLY		 
//elm.num_free
//elm.num_kid_friendly
		 // This just gets max number to set axis scale
		 // Also have the change "return yScale(elem.num_events);" below
		 

//tmp_data.map(function(elem) {
//    return elem;
//  })
 
//[Objectkey: "Theater"
//num_events: 56
//num_free: 0
//num_kid_friendly: 0
//values: Array[56]
	//0: Object
		//category: //"Theater"
		//event_name: "‘A 24-Decade History of Popular Music’"
		//free: false
		//kid_friendly: false
		//venue_name: "St. Ann’s Warehouse"
		//web_description: "<p>Taylor Mac has a song in his heart &#8212; actually, 246 of them. In this //new work, Mr. Mac, a playwright, performer and part-time bird of paradise, traces America through its ditties //and anthems, from the Revolutionary War to present insurrections. A series of three-hour concerts, featuring as //many as two dozen musicians and assorted special guests, will culminate in a daylong marathon //performance.</p>"
		//__proto__: Object]		 

		 
// Now the axis can be generated.
  svg.select("#axis").call(yAxis);

// Define our bars, the rectangles that will describe our data.
var bars = svg.selectAll("rect").data(data).enter().append("rect")
                .classed("bar", true).attr("width", xScale.bandwidth());
  bars.attr("width", xScale.bandwidth())  // redundant?
      .attr("x", function(elem) {
         return xScale(elem.key);
       })
      .attr("y", function(elem) {
         return yScale(elem.num_events);   //CHANGE THIS IF CHANGING TO FREE OR KID FRIENDLY
       })
      .attr("height", function(elem) {
         return 560 - yScale(elem.num_events);  //CHANGE THIS IF CHANGING TO FREE OR KID FRIENDLY
       })
      // Give a mouseover event to highlight where we've placed the mouse.
	  
	  


//tmp_vart = dim.transition
//tmp_vard = dim.delay

      // Give a mouseover event to highlight where we've placed the mouse.
      .on("mouseover", function() {
         d3.selectAll(".bar").classed("hovered", false);
         d3.selectAll(".bar").classed("unhovered", true);
         d3.select(this)
		 .transition("mouseover")
		 .duration(dim.transition)
		 .classed("hovered", true);
       })
      // Now negate the mouseover.
      .on("mouseout", function() {
         d3.selectAll(".bar")
		 .transition("unmouseover")
		 .duration(dim.transition)
		 .classed("hovered", false);
         d3.selectAll(".bar")		 
		 .transition("unnmouseover")
		 .duration(dim.transition)
		 .classed("unhovered", false);
       });
	   

  // Provide some in-place labels for each rectangle.
  var labels = svg.selectAll(".label").data(data).enter().append("text")
                  .classed("label", true);
  labels.attr("transform", function(elem) {
           return "translate(" + (xScale.bandwidth() + xScale(elem.key))
             + "," + (10 + yScale(elem.num_events))
             + ") rotate(-60)";
         })
        .text(function(elem) {
           return elem.key;
         });

  // Below, this is providing an example to help show the structure of
  // the underlying data.  May be useful for your quiz work??
  d3.select("body").append("p")
     .attr("id", "tooltip")
     .html("Example event: " + data[0].values[0].event_name +
              data[0].values[0].web_description);
			  
//event_name:"‘A 24-Decade History of Popular Music’"
			  
//web_description:"<p>Taylor Mac has a song in his heart &#8212; actually, 246 of them. In this new work, Mr. Mac, a playwright, performer and part-time bird of paradise, traces America through its ditties and anthems, from the Revolutionary War to present insurrections. A series of three-hour concerts, featuring as many as two dozen musicians and assorted special guests, will culminate in a daylong marathon performance.</p>"


// COULD DO DIFFERENT EVENT [1,2,3,4 etc]		not 0  

// COULD DO DIFFERENT EVENT DATA (not .event_name or .web_description ) 
//category
//critic_name
//date_time_description
//event_detail_url
//event_id
//event_name
//event_schedule_id
//festival
//free
//kid_friendly
//last_chance
//last_modified
//long_running_show
//previews_and_openings
//recur_days
//recurring_end_date
//recurring_start_date
//state
//street_address
//subcategory
//telephone
//times_pick
//venue_name
//venue_website
//web_description

		  
};


// And here is our trusty "d3.json" function that gets the data.
d3.json("./data/nytimes_event_listings.json", main);
