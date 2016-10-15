<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-15"> 
<title>Scheduler</title>
<script src="js/library.js"></script>
<script src="js/code.js"></script>
<script type="text/javascript">


function changeLink()
{
   var style=window.location.search
   if(style=='?style=old')
   {
   var newLink=document.getElementsByTagName('link')[0]
   newLink.href="style/styles_bck.css"
   }
   else
   {
   var newLink=document.getElementsByTagName('link')[0]
   newLink.href="style/styles.css"
   
   }
} 
</script>

<link href="style/styles.css" rel="stylesheet" type="text/css" />
<link href="style/custom.css" rel="stylesheet" type="text/css" />

</head>
<body onload="changeLink()">



<div id="container">
	<div id="header">
		<h2>VG Scheduler</h2><p><a href="?lang=nl">NL</a>, <a href="?style=old">ENG</a></p>
	</div>
	<div>
		<div id='views'>
	       <span id="day" class="selected"><a href="?">Day</a></span>
		   <span id="week"><a href="?view=week">Week</a></span>
		</div>
		<div id="messages"></div>
	
	</div>
	
	<div id="myScheduler">
		<!-- this is where the scheduler will be placed-->
	</div>
</div>

<script type="text/javascript">

GiPCordys.Utils.Element.extend(document.getElementById("messages"));
GiPCordys.Utils.Element.extend(document.getElementById("day"));
GiPCordys.Utils.Element.extend(document.getElementById("week"));
var conf ={};
var style=window.location.search;
if(style=='?lang=nl'||style!='?style=old')
{
conf = {
	colors: {
		'activitytype1': '#ccc',
		'activitytype2': 'red'
	},
    translate: {
		'Resources': 'Gebruikers',
		'Today': 'Vandaag',
		'Tomorrow': 'Morgen',
		'Yesterday': 'Gisteren',
		'Earlier': '<<',
		'Later': '>>'
	},

	permissions: GiPCordys.scheduler.Permissions.ReadWrite // GiPCordys.scheduler.Permissions.ReadOnly
};
}
else 
{
conf = {
	colors: {
		'activitytype1': '#ccc',
		'activitytype2': 'red'
	},
	permissions: GiPCordys.scheduler.Permissions.ReadWrite    //  GiPCordys.scheduler.Permissions.ReadOnly //
};

}

if(style=='?view=week')
{
    document.getElementById("day").removeClass('selected');
	document.getElementById("week").addClass('selected');
    conf.view="week"
}

var scheduler = new GiPCordys.scheduler.Scheduler(document.getElementById("myScheduler"), conf);

noreload = false;
var interval = 1000*60*5;
var timer = setInterval(function() { if(!noreload) { scheduler.reload() } }, interval);

//for Creating popup window
/*
 * Define observers
 */

GiPCordys.scheduler.event.addListener(scheduler, GiPCordys.scheduler.EventTypes.Activity.DragStart, function(data) 
{
	noreload = true;
});

GiPCordys.scheduler.event.addListener(scheduler, GiPCordys.scheduler.EventTypes.Date.Changed, function(data) 
{
	document.getElementById("messages").addClass("loading");
	document.getElementById('messages').innerHTML = "Loading...";
	
		function processActivities(req)
		{
		
				scheduler.clear();
				document.getElementById("messages").removeClass("loading");
				document.getElementById("messages").addClass("success");
				document.getElementById('messages').innerHTML = "Loaded.";
		
				var colorList = {};
				//var colors=req.getElementsByTagName("colors")[0];
		
				//var activityColors = colors.getElementsByTagName('activity');	
				var activitytypes= {};
		
		/*		for (i=0;i<activityColors.length;i++)
				{
					activityType = activityColors[i].attributes.getNamedItem("type").value;
					activityColor = activityColors[i].attributes.getNamedItem("color").value;
					colorList[activityType] = activityColor;
					activitytypes[activityType]=i;
				}
		*/
        colorList={
				General:'#FF8000',
				Free: '#00FF00',
				Runaway: '#2E9AFE',
				Programmed: '#FAAC58',
				Tentamen:'#FF0000'
		};
		activitytypes={
			General :0,
			Free:1,
			Runaway:2,
			Programmed:3,
			Tentamen:4
		};
				scheduler.setOptions({colors: colorList});
				scheduler.addSelectBoxOption(activitytypes);
		
				//display each resource
				var x=req.getElementsByTagName("resource");
				for (i=0;i<x.length;i++)
				{
					empId = x[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
					resourceName = x[i].getElementsByTagName("displayName")[0].childNodes[0].nodeValue;
			
					var resource = new GiPCordys.scheduler.Resource({
					'id': empId, 
					'name': resourceName
					});
			
					scheduler.addResource(resource);
			
					//get all activities from this resource from xml
					var activity=x[i].getElementsByTagName("activity");

					for (y=0;y<activity.length;y++)
					{
						activityName = activity[y].getElementsByTagName("displayName")[0].childNodes[0].nodeValue; 
						activityType = activity[y].getElementsByTagName("type")[0].childNodes[0].nodeValue;
						activityId   = activity[y].getElementsByTagName("id")[0].childNodes[0].nodeValue;
				
						starttime = activity[y].getElementsByTagName("date")[0].attributes.getNamedItem("start").value;
						endtime = activity[y].getElementsByTagName("date")[0].attributes.getNamedItem("end").value;
				
						lastUpdate = activity[y].getElementsByTagName("lastUpdate")[0].childNodes[0].nodeValue; 
				
						var activityobj = new GiPCordys.scheduler.Activity({
							'id': activityId, 
							'title': activityName,
							'startdate': new Date(starttime),
							'enddate': new Date(endtime),
							'type': activityType,
							'lastupdate': new Date(lastUpdate)
						});
						scheduler.addActivity(resource, activityobj);
						scheduler.addResizer(resource, activityobj);	
					}
				}
		};
	
	//input to the scheduler
	
		var soaprequest1 = loadXMLDoc("http://cin400181/schedular.xml");
		processActivities(soaprequest1);
	
	
});
GiPCordys.scheduler.event.addListener(scheduler, GiPCordys.scheduler.EventTypes.Activity.DragEnd, function(data) 
{
  
   
  //back end updation code.
	
	
	
}
);
GiPCordys.scheduler.event.addListener(scheduler, GiPCordys.scheduler.EventTypes.Scheduler.Exception, function(data) 
{
	//alert(data.msg);
});
GiPCordys.scheduler.event.addListener(scheduler, GiPCordys.scheduler.EventTypes.Week.Changed, function(data) 
{
		function processActivities(req)
		{
		
				scheduler.clear();
				document.getElementById("messages").removeClass("loading");
				document.getElementById("messages").addClass("success");
				document.getElementById('messages').innerHTML = "Loaded.";
		
				var colorList = {};
				//var colors=req.getElementsByTagName("colors")[0];
		
				//var activityColors = colors.getElementsByTagName('activity');	
				var activitytypes= {};
		
		/*		for (i=0;i<activityColors.length;i++)
				{
					activityType = activityColors[i].attributes.getNamedItem("type").value;
					activityColor = activityColors[i].attributes.getNamedItem("color").value;
					colorList[activityType] = activityColor;
					activitytypes[activityType]=i;
				}
		*/
        colorList={
				General:'#FF8000',
				Free: '#00FF00',
				Runaway: '#2E9AFE',
				Programmed: '#FAAC58',
				Tentamen:'#FF0000'
		};
		activitytypes={
			General :0,
			Free:1,
			Runaway:2,
			Programmed:3,
			Tentamen:4
		};
				scheduler.setOptions({colors: colorList});
				scheduler.addSelectBoxOption(activitytypes);
		
				//display each resource
				var x=req.getElementsByTagName("resource");
				for (i=0;i<x.length;i++)
				{
					empId = x[i].getElementsByTagName("id")[0].childNodes[0].nodeValue;
					resourceName = x[i].getElementsByTagName("displayName")[0].childNodes[0].nodeValue;
			
					var resource = new GiPCordys.scheduler.Resource({
					'id': empId, 
					'name': resourceName
					});
			
					scheduler.addResource(resource);
			
					//get all activities from this resource from xml
					var activity=x[i].getElementsByTagName("activity");

					for (y=0;y<activity.length;y++)
					{
						activityName = activity[y].getElementsByTagName("displayName")[0].childNodes[0].nodeValue; 
						activityType = activity[y].getElementsByTagName("type")[0].childNodes[0].nodeValue;
						activityId   = activity[y].getElementsByTagName("id")[0].childNodes[0].nodeValue;
				
						starttime = activity[y].getElementsByTagName("date")[0].attributes.getNamedItem("start").value;
						endtime = activity[y].getElementsByTagName("date")[0].attributes.getNamedItem("end").value;
				
						lastUpdate = activity[y].getElementsByTagName("lastUpdate")[0].childNodes[0].nodeValue; 
				
						var activityobj = new GiPCordys.scheduler.Activity({
							'id': activityId, 
							'title': activityName,
							'startdate': new Date(starttime),
							'enddate': new Date(endtime),
							'type': activityType,
							'lastupdate': new Date(lastUpdate)
						});
						scheduler.addWeekActivity(resource, activityobj);
					}
				}
		};
	
	//input to the scheduler
	
		var soaprequest1 = loadXMLDoc("http://cin400181/Weekly_Sch.xml");
		processActivities(soaprequest1);
	
});

if(window.location.search=="?view=week")
    scheduler.displayWeek(2011,1,13)
else
	scheduler.displayPeriod(2010,6,22);
	

</script>
</body>
</html>