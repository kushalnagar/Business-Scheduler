/**
 * GiPCordys Scheduler
 * @author Robin Rutten, Ilian van der Velden, Kevin Verpoort, Andrea Loing, Iris Trepels
 * @version 0.8
 */

if(typeof GiPCordys == "undefined")
{
	var GiPCordys = new Object();
}
GiPCordys.scheduler = {
	VERSION: "0.8"
};

/**
 * GiPCordys Utils
 */
GiPCordys.Utils = new Object();
GiPCordys.Utils.Element = function()
{
};
GiPCordys.Utils.Element.extend = function(destination) 
{
    var source = this.prototype;
	for (var property in source)
      destination[property] = source[property];
    return destination;
}
GiPCordys.Utils.Element.prototype = {
	getStyle: function(style)
	{
		var elem = this;
		if (elem.currentStyle)
			var y = elem.currentStyle[style];
		else if (window.getComputedStyle)
			var y = document.defaultView.getComputedStyle(elem,null).getPropertyValue(style);
		return y;
	},
	addClass: function(name)
	{
		if(!(new RegExp('\\b'+name+'\\b')).test(this.className))
		{
			this.className=(this.className?this.className+' ':'')+name;
		}
		return this;
	},
	removeClass: function(name)
	{
		var re=new RegExp(name+' ?| ?'+name);
		if(re.test(this.className)) 
		{
			this.className=this.className.replace(re, '');
		}
		return this;
	},
	hasClass: function(name)
	{
		var re=new RegExp(name+' ?| ?'+name);
		if((new RegExp('\\b'+name+'\\b')).test(this.className))
			return true;
		return false;
	},
	/*
	 * Get the outer width (includes the border and padding by default)
	 * @param margin (boolean) take margin into account
	 */
	outerWidth: function(margin)
	{	
		if(this.offsetWidth) // TODO margin (ie)?
			return this.offsetWidth;
			
		var margin = margin?parseInt(this.getStyle('margin-left'))+parseInt(this.getStyle('margin-right')):0;
		var padding = parseInt(this.getStyle('padding-left'))+parseInt(this.getStyle('padding-right'));
		var border = parseInt(this.getStyle('border-left-width'))+parseInt(this.getStyle('border-right-width'));
		return parseInt(this.getStyle('width'))+padding+border+margin;
	},
	/*
	 * Get the outer height (includes the border and padding by default)
	 * @param margin (boolean) take margin into account
     */
	outerHeight: function(margin)
	{
		if(this.offsetHeight) // TODO margin (ie)?
			return this.offsetHeight;
	
		var margin = margin?parseInt(this.getStyle('margin-top'))+parseInt(this.getStyle('margin-bottom')):0;
		
		var padding = parseInt(this.getStyle('padding-top'))+parseInt(this.getStyle('padding-bottom'));
		var border = parseInt(this.getStyle('border-top-width'))+parseInt(this.getStyle('border-bottom-width'));
		return parseInt(this.getStyle('height'))+padding+border+margin;
	},
	/*
	 * Get the current offset (pixels) relative to the document
	 */
	 // TODO borders (add border if browser does not add border)
	offset: function()
	{
		var elem = this;
		
		var offsetParent = elem.offsetParent;
		var doc = elem.ownerDocument, body = doc.body;
		var top = elem.offsetTop;
		var left = elem.offsetLeft;
		
		while((elem=elem.parentNode) && elem !== doc && elem !== body)
		{
			top -= elem.scrollTop, left -= elem.scrollLeft;
			if(elem === offsetParent)
			{
				top += elem.offsetTop;
				left += elem.offsetLeft;
			}
		}
		
		GiPCordys.Utils.Element.extend(elem);
		
		if(elem.getStyle('position') === "relative" || elem.getStyle('position') === "static")
		{
			top += body.offsetTop;
			left += body.offsetLeft;
		}
		//fixed?
		
		return {top: top, left: left};
	},
	windowLengthWidth: function()
	{
		var myWidth = 0, myHeight = 0;
			if( typeof( window.innerWidth ) == 'number' ) {
			myWidth = window.innerWidth;
			myHeight = window.innerHeight;
			} else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
			myWidth = document.documentElement.clientWidth;
			myHeight = document.documentElement.clientHeight;
			} else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
			myWidth = document.body.clientWidth;
			myHeight = document.body.clientHeight;
			}
			return {width: myWidth, height: myHeight}
	},
	
	addListener: function(event, handler)
	{
		if(window.addEventListener)
			this.addEventListener(event, handler, false);
		else
			this.attachEvent('on' + event, handler);
	},
	removeListener: function(event, handler)
	{
		if(window.removeEventListener)
			this.removeEventListener(event, handler, false);
		else
			this.detachEvent('on' + event, handler);
	}
};
GiPCordys.Utils.Event = {
	getMouseX: function( event )
	{
		var ev = event || window.event;
		return ev.pageX || ( ev.clientX + ( document.documentElement.scrollLeft || document.body.scrollLeft ) );
	},
	getMouseY: function( event )
	{
		var ev = event || window.event;
		return ev.pageY || ( ev.clientY + ( document.documentElement.scrollTop || document.body.scrollTop ) );
	},
	getMouseCoordinates: function ( event )
	{
		var ev = event || window.event;
		return {x: GiPCordys.Utils.Event.getMouseX(ev), y: GiPCordys.Utils.Event.getMouseY(ev)};
	}
};

/**
 * EventTypes
 */
GiPCordys.scheduler.Permissions = {
	ReadOnly: 'permission:readonly',
	ReadWrite: 'permission:readwrite'
};
GiPCordys.scheduler.EventTypes = {
	Scheduler: {
		Exception: 'scheduler:exception'
	},
	Activity: {
		DragStart: 'activity:dragstart',
		onDrag: 'activity:dragging',
		DragEnd: 'activity:dragend'
	},
	Date: {
		Changed: 'date:changed'
	},
	Week:{
	   Changed: 'week:changed'  
	},
	Resource: {
		Filter: 'resource:filter'
	}
};

/**
 * GiPCordys Scheduler
 *
 */
GiPCordys.scheduler.Scheduler = function(container, options)
{
	this._lock = false;	// scheduler locked

	this._options = {colors: {}, translate: {}};
	this._activityType={};
	this.setOptions(options);
	
	this._container = container;
	this._resources = [];
	GiPCordys.Utils.Element.extend(this._container); // GiPCordys Element
	
	this._elems = {'container': container}; // scheduler HTML elements
	this._selectedActivity={newresource: {}, activity: {}, oldresource: {}};
    
	var render = function()
	{
		var table = document.createElement('table');
		table.cellPadding = 0;
		table.cellSpacing = 0;
		table.border = 0;
		var tbody = document.createElement('tbody');
		table.appendChild(tbody);
		
		tbody.appendChild(document.createElement('tr'));
		
		var td_1 = document.createElement('td');
		td_1.style.width = 90 + "px";
		var td_2 = document.createElement('td');
		td_2.style.width = 710 + "px";
		
		tbody.childNodes[0].appendChild(td_1);
		tbody.childNodes[0].appendChild(td_2);
		
		// resource title
		var resource_title = document.createElement('div');
		GiPCordys.Utils.Element.extend(resource_title);
		resource_title.addClass("resource_title");
		resource_title.innerHTML = this._options.translate.Resources?this._options.translate.Resources:"Resources";
		
		// resource container
		var resource_container = document.createElement('div');
		GiPCordys.Utils.Element.extend(resource_container);
		resource_container.addClass("resource_container");
		resource_container.id = "resources";
		
		//resource inner
		var resource_inner = document.createElement('div');
		GiPCordys.Utils.Element.extend(resource_inner);
		resource_inner.addClass("resource_inner");
		resource_inner.id = "resource_inner";
		resource_container.appendChild(resource_inner);
		
		//datetime container
		var datetime_container = document.createElement('div');
		GiPCordys.Utils.Element.extend(datetime_container);
		datetime_container.id = "datetime";
		datetime_container.addClass("datetime_container");
		
		
		//date inner
		var date_inner = document.createElement('div');
		GiPCordys.Utils.Element.extend(date_inner);
		date_inner.addClass("date_inner");
		date_inner.innerHTML = "";
		
		// date container
		var date_container = document.createElement('span');
	
		// navigation buttons
		var today_button = document.createElement('button');
		today_button.appendChild(document.createTextNode(this._options.translate.Today?this._options.translate.Today:"Today"));
		GiPCordys.Utils.Element.extend(today_button);
		if(this._options.view=='week')
		     today_button.disabled='true';
		
		var previous_button = document.createElement('button');
		previous_button.appendChild(document.createTextNode(this._options.translate.Earlier?this._options.translate.Earlier:"<<"));
		GiPCordys.Utils.Element.extend(previous_button);
		
		var next_button = document.createElement('button');
		next_button.appendChild(document.createTextNode(this._options.translate.Later?this._options.translate.Later:">>"));
		GiPCordys.Utils.Element.extend(next_button);
		
		today_button.addListener('click', function(e)
		{
     		var date = new Date();
			this.displayPeriod(date.getFullYear(), date.getMonth()+1, date.getDate());
		}.bind(this));
		
		previous_button.addListener('click', function(e)
		{
		    if(this._options.view=='week')
			{
			var date = new Date(this._weekperiod.year, this._weekperiod.month, this._weekperiod.day);
			date.setDate(date.getDate()-7);
			this.displayWeek(date.getFullYear(), date.getMonth(), date.getDate());
			}
		    else{
			var date = new Date(this._timeperiod.year, this._timeperiod.month, this._timeperiod.day);
			date.setDate(date.getDate()-1);
			this.displayPeriod(date.getFullYear(), date.getMonth(), date.getDate());
			}
		}.bind(this));
		next_button.addListener('click', function(e)
		{
		    if(this._options.view=='week')
			{
			var date = new Date(this._weekperiod.year, this._weekperiod.month, this._weekperiod.day);
			date.setDate(date.getDate()+7);
			this.displayWeek(date.getFullYear(), date.getMonth(), date.getDate());
			}
			else{
			var date = new Date(this._timeperiod.year, this._timeperiod.month, this._timeperiod.day);
			date.setDate(date.getDate()+1);
			this.displayPeriod(date.getFullYear(), date.getMonth(), date.getDate());
			}
		}.bind(this));
		
		date_inner.appendChild(today_button);
		date_inner.appendChild(previous_button);
		date_inner.appendChild(date_container);
		date_inner.appendChild(next_button);
		
		//time inner
		var time_inner = document.createElement('div');
		GiPCordys.Utils.Element.extend(time_inner);
		time_inner.id = "times";
		time_inner.addClass("time_inner");
		if(this._options.view=="week")
		 {
		  time_inner.innerHTML=""
		  }
		
		else{
		time_inner.innerHTML = '<div class="timediv">8:00</div><div class="timediv">9:00</div><div class="timediv">10:00</div><div class="timediv">11:00</div><div class="timediv">12:00</div><div class="timediv">13:00</div><div class="timediv">14:00</div><div class="timediv">15:00</div><div class="timediv">16:00</div><div class="timediv">17:00</div><div class="timediv">18:00</div><div class="timediv">19:00</div><div class="timediv">20:00</div><div class="timediv">21:00</div><div class="timediv">22:00</div>';
		}
		
		datetime_container.appendChild(date_inner);
		datetime_container.appendChild(time_inner);
		
		// activities_container
		var activities_container = document.createElement('div');
		GiPCordys.Utils.Element.extend(activities_container);
		activities_container.id = "activities_container";
		activities_container.addClass("activities_container");
		
		// activities_inner
		var activities_inner = document.createElement('div');
		GiPCordys.Utils.Element.extend(activities_inner);
		activities_inner.id = "activities";
		activities_inner.addClass("activities_inner");
		activities_container.appendChild(activities_inner);
		
				
		td_2.appendChild(datetime_container);
		td_2.appendChild(activities_container);
		
		//popup
		var popup=document.createElement('div')
		GiPCordys.Utils.Element.extend(popup);
		popup.id="popup"
		document.getElementsByTagName('body')[0].appendChild(popup);
		
		//inside popup
		  //close
			var close=document.createElement('div');
			GiPCordys.Utils.Element.extend(close);
			close.id="close_popup";
			popup.appendChild(close);
			close.addListener('click', function(e)
			{
				popup.style.display="none";
			}.bind(this));
		
		  //resource_name
			var resource_name=document.createElement('div');
			GiPCordys.Utils.Element.extend(resource_name);
			resource_name.id="resource_name";
			resource_name.addClass("resource_name");
			popup.appendChild(resource_name);
		 
		  //activity_displayname
			var activity_displayname=document.createElement('div');
			GiPCordys.Utils.Element.extend(activity_displayname);
			activity_displayname.id="activity_displayname";
			activity_displayname.addClass("activity_displayname");
			popup.appendChild(activity_displayname);
					
		  //activity_type
			var activity_type_div=document.createElement('div');
			GiPCordys.Utils.Element.extend(activity_type_div);
			activity_type_div.id="activity_type_div";
			popup.appendChild(activity_type_div);
			activity_type_div.addClass("activity_type_div");
		     
			 //activity_type_label
			   var activity_type_label=document.createElement('label');
			   activity_type_div.appendChild(activity_type_label);
			   activity_type_label.innerHTML="Type :  "
			 //activity_type
			   var activity_type=document.createElement('select');
			   activity_type.id="activity_type";
   			   activity_type_div.appendChild(activity_type);
			   
		  //activity_timeperiod
		    var activity_timeperiod=document.createElement('div');
			GiPCordys.Utils.Element.extend(activity_timeperiod);
			activity_timeperiod.id="activity_timeperiod";
			activity_timeperiod.addClass("activity_timeperiod")
			popup.appendChild(activity_timeperiod);
			  
				var activity_start_span=document.createElement('span');
				activity_start_span.id="start";
				activity_timeperiod.appendChild(activity_start_span)
				     //Start Date
					 
			        var activity_startDate=document.createElement('input');
				    activity_startDate.id="_startDate";
				    activity_start_span.appendChild(activity_startDate)
					 //startTime
					var activity_startTime=document.createElement('input');
					activity_startTime.id="activity_startTime";
					activity_start_span.appendChild(activity_startTime)
			  //label
			    var activity_label_to=document.createElement('label');
			    activity_timeperiod.appendChild(activity_label_to);
			    activity_label_to.innerHTML="To"
		 
				var activity_end_span=document.createElement('span');
				activity_end_span.id="end";
				activity_timeperiod.appendChild(activity_end_span)	
					//End Date
					var activity_endDate=document.createElement('input');
					activity_endDate.id="_endDate";
					activity_end_span.appendChild(activity_endDate)
					//endTime
					var activity_endTime=document.createElement('input');
					activity_endTime.id="activity_endTime";
					activity_end_span.appendChild(activity_endTime)
		
		  //
		    var save_changes=document.createElement('div')
			GiPCordys.Utils.Element.extend(save_changes);
			save_changes.addClass("save_changes");
			popup.appendChild(save_changes);
			  
			  //save
			  var save_button=document.createElement('button');
			  GiPCordys.Utils.Element.extend(save_button);
			  save_button.appendChild(document.createTextNode("Save"));
			  save_changes.appendChild(save_button)
			  
			  save_button.addListener('click', function(e)
			  {
			      
				  if(this._options.view=='week'){
						this.getSelectedActivity().activity.setType(this._elems['activity_type'].value);
						var oldstartdate=new Date(this.getSelectedActivity().activity.getStartDate());
						var startdate=this.getSelectedActivity().activity.getStartDate();
						startdate.setHours(this._elems['activity_startTime'].value.split(":")[0]);
						startdate.setMinutes(this._elems['activity_startTime'].value.split(":")[1]);
						startdate.setDate(this._elems['activity_startDate'].value.split("/")[0]);
						startdate.setMonth(this._elems['activity_startDate'].value.split("/")[1]-1);
						startdate.setFullYear(this._elems['activity_startDate'].value.split("/")[2]);
				  
				        var oldenddate=new Date(this.getSelectedActivity().activity.getEndDate());
						var enddate=this.getSelectedActivity().activity.getEndDate();
						enddate.setHours(this._elems['activity_endTime'].value.split(":")[0]);
						enddate.setMinutes(this._elems['activity_endTime'].value.split(":")[1]);
						enddate.setDate(this._elems['activity_endDate'].value.split("/")[0]);
						enddate.setMonth(this._elems['activity_endDate'].value.split("/")[1]-1);
						enddate.setFullYear(this._elems['activity_endDate'].value.split("/")[2]);
						
						if(oldstartdate.getDate()!=startdate.getDate() || oldenddate.getDate()!=enddate.getDate())    
                            {
                                this.updateWeeklyActivity(this.getSelectedActivity().activity,this.getSelectedActivity().newresource)
                        //this.changeActivityResourcePerDay(this.getSelectedActivity().activity,this.getSelectedActivity().newresource, this.getSelectedActivity().oldresource, startdate.getDay(), oldstartdate.getDay());
                                this.changeActivityResource(this.getSelectedActivity().activity,this.getSelectedActivity().newresource.obj,this.getSelectedActivity().oldresource.obj);
                            }
                        else
                            {
                            this.getSelectedActivity().activity.getElement().innerHTML="<span>"+this.getSelectedActivity().activity.getStartDate().getHours()+":"+this.getSelectedActivity().activity.getStartDate().getMinutes()+"-"+this.getSelectedActivity().activity.getEndDate().getHours()+":"+this.getSelectedActivity().activity.getEndDate().getMinutes()+"</span>";
                            
                                if(this.getSelectedActivity().activity.getType() && this._options.colors[this.getSelectedActivity().activity.getType()])
                                {
                                this.getSelectedActivity().activity.getElement().firstChild.style.backgroundColor = this._options.colors[this.getSelectedActivity().activity.getType()];
                                }
                        
                            }
						this._elems['popup'].style.display="none"
				  }
				  else{
						this.getSelectedActivity().activity.setType(this._elems['activity_type'].value);
						var startdate=this.getSelectedActivity().activity.getStartDate();
						startdate.setHours(this._elems['activity_startTime'].value.split(":")[0]);
						startdate.setMinutes(this._elems['activity_startTime'].value.split(":")[1]);
				  
						var enddate=this.getSelectedActivity().activity.getEndDate();
						enddate.setHours(this._elems['activity_endTime'].value.split(":")[0]);
						enddate.setMinutes(this._elems['activity_endTime'].value.split(":")[1]);
				  
						this.updateActivity(this.getSelectedActivity().activity,this.getSelectedActivity().newresource)
						this.changeActivityResource(this.getSelectedActivity().activity,this.getSelectedActivity().newresource.obj,this.getSelectedActivity().oldresource.obj);
						this._elems['popup'].style.display="none"
				  }
				  
			  }.bind(this));
		   
	
		  
		// set elements
		this._elems['resource_container'] = resource_container;
		this._elems['resource_inner'] = resource_inner;
		this._elems['activities_container'] = activities_container;
		this._elems['activities_inner'] = activities_inner;
		this._elems['times'] = time_inner;
		this._elems['date_container'] = date_container;
		this._elems['popup']=popup;
		this._elems['resource_name']=resource_name;
		this._elems['activity_displayname']=activity_displayname;
		this._elems['activity_type']=activity_type;
		this._elems['activity_startTime']=activity_startTime;
		this._elems['activity_endTime']=activity_endTime;
		this._elems['activity_startDate']=activity_startDate
		this._elems['activity_endDate']=activity_endDate
		
		td_1.appendChild(resource_title);
		td_1.appendChild(resource_container);

		this._container.innerHTML = "";	
		var scheduler = document.createElement('div');		
		scheduler.id = "scheduler";
		scheduler.setAttribute("id","scheduler");
		
		scheduler.appendChild(table);
		
		
		this._container.appendChild(scheduler);
	}.bind(this)();
	
	// handle scrolling
	this._elems['activities_container'].addListener('scroll', function(e)
	{
		this._elems['times'].style.left = -parseInt(this._elems['activities_container'].scrollLeft )+"px" ;
		this._elems['resource_inner'].style.top = -parseInt(this._elems['activities_container'].scrollTop )+"px" ;
		e.cancelBubble = true;
	}.bind(this));
	
};
GiPCordys.scheduler.Scheduler.prototype = {
	getPermissions: function()
	{
		if(this._options.permissions)
			return this._options.permissions;
		return GiPCordys.scheduler.Permissions.ReadOnly;
	},
	reload: function(year, month, day)
	{
	    if(this._options.view=='week')
			this.displayWeek(this._weekperiod.year, this._weekperiod.month, this._weekperiod.day)
		else
			this.displayPeriod(this._timeperiod.year, this._timeperiod.month, this._timeperiod.day);
	},
	addSelectBoxOption: function(options)
	{
	    
	    this._activityType=options
	    for(index in options){
		   this._elems['activity_type'].options[this._elems['activity_type'].length]=new Option(index, index);
		}  
       		
	},
	/*
	 * date to display
	 * @param year
	 * @param month
	 * @param day
	 */
	displayPeriod: function(year, month, day)
	{  
	    
		var today = new Date();
		var period = new Date(year,month, day);
			
		this._timeperiod = {
			day: period.getDate(),
			month: period.getMonth(), 
			year: period.getFullYear()
		};
			
		var display = "";
		if(today.getMonth()+1 == period.getMonth() && today.getFullYear() == period.getFullYear())
		{
			if(today.getDate() == period.getDate())
				display = this._options.translate.Today?this._options.translate.Today:"Today";
			else if(today.getDate()+1 == period.getDate())
				display = this._options.translate.Tomorrow?this._options.translate.Tomorrow:"Tomorrow";
			else if(today.getDate()-1 == period.getDate())
				display = this._options.translate.Yesterday?this._options.translate.Yesterday:"Yesterday";
			else
				display = day + '/' + month + '/' + year;
		}
			
		if(!display)
			display = day + '/' + month + '/' + year;
			
		this._elems['date_container'].innerHTML = display;
		this._triggerEvent(GiPCordys.scheduler.EventTypes.Date.Changed, this._timeperiod);
	},
	
	displayWeek : function(Start_Year, Start_month, Start_day)
	{
	    var months=new Array('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
	    var weekperiod = new Date(Start_Year, Start_month, Start_day);
	    this._weekperiod = {
			day: weekperiod.getDate(),
			month: weekperiod.getMonth(), 
			year: weekperiod.getFullYear()
		};
		var endDate=new Date()
		endDate.setDate(weekperiod.getDate()+6)
		
		var display=months[weekperiod.getMonth()]+" "+weekperiod.getDate()+"-"+months[endDate.getMonth()]+" "+endDate.getDate()
	    this._elems['date_container'].innerHTML = display;
		var days=[]
		for(var i=1;i<=7;i++)
	      {
		       days[i]=months[weekperiod.getMonth()]+" "+weekperiod.getDate();	
		       weekperiod.setDate(weekperiod.getDate()+1)
			   			 
		  }
		  this._elems['times'].innerHTML='<div class="timediv_week">'+days[1]+' ,Sun</div><div class="timediv_week">'+days[2]+' ,Mon</div><div class="timediv_week">'+days[3]+' ,Tus</div><div class="timediv_week">'+days[4]+' ,Wed</div><div class="timediv_week">'+days[5]+' ,Thu</div><div class="timediv_week">'+days[6]+'  ,Fri</div><div class="timediv_week">'+days[7]+' ,Sat</div>'
		  
	    this._triggerEvent(GiPCordys.scheduler.EventTypes.Week.Changed, this._weekperiod);
	    
	},
	
	/*
	 * set options
	 * @param options (object)
	 */
	setOptions: function(options)
	{
	   
		if(options.colors)
		{
			this._options.colors = options.colors;
		}
		if(options.translate)
		{
			this._options.translate = options.translate;
		}
		if(options.permissions)
		{
			this._options.permissions = options.permissions;
		}
		if(options.view)
		{
		    this._options.view=options.view;    
		}
	},
	/*
	 * clear scheduling board
	 */
	clear: function()
	{
		for(var i=0;i<this._resources.length;i++)
		{
			var resourceHolder = this._resources[i].obj.getElements().resourceHolder;
			var activityHolder = this._resources[i].obj.getElements().activityHolder;
			
			for(var j=0;j<this._resources[i].activities.length;j++)
			{
				//activityHolder.removeChild(this._resources[i].activities[j].getElement());
				this._resources[i].activities[j].getElement().parentNode.removeChild(this._resources[i].activities[j].getElement());
			}
			this._elems['resource_inner'].removeChild(resourceHolder);
			this._elems['activities_inner'].removeChild(activityHolder);
			
			delete activityHolder;
			delete resourceHolder; 
			delete this._resources[i].obj;
			delete this._resources[i].activities;
			delete this._resources[i];	
		}
		this._resources=[];
	},
	/*
	 * add a new resource to the scheduling board
	 */
	addResource: function(resource)
	{
		if(resource.getId())
		{
			var index = -1;
			for(var i=0;i<this._resources.length;i++)
			{
				if(this._resources[i].obj == resource)
					index = i;
			}
			if(index == -1)
			{
				resource.getElements().resourceHolder.innerHTML = resource.getName();
				this._elems['resource_inner'].appendChild(resource.getElements().resourceHolder);
				
				resource.getElements().activityHolder.id = resource.getId();
				
				if(this._options.view=="week")
				{
					resource.getElements().activityHolder.addClass("activities_resource_week");
				}
				else
					resource.getElements().activityHolder.addClass("activities_resource");
				
				this._elems['activities_inner'].appendChild(resource.getElements().activityHolder);
				
				this._resources.push({'obj': resource, 'activities': [], 'day_act':{'0':[],'1':[],'2':[],'3':[],'4':[],'5':[],'6':[]}});
				index = 0;
			}
			return this._resources[index];
		}
		throw("invalid resource object");
	},
	/*
	 * get activities of given resource
	 */
	getResourceActivities: function(resource)
	{
		if(resource.getId())
		{
			var index = -1;
			for(var i=0;i<this._resources.length;i++)
			{
				if(this._resources[i].obj == resource)
					return this._resources[i].activities;
			}
		}
		return [];
	},
	/*
	 * get all resources
	 */
	getResources: function()
	{
		var resources = [];
		for(var i=0;i<this._resources.length;i++)
		{
			resources.push(this._resources[i].obj);
		}
		return resources;
	},
	/*
	 * get all resources and corresponding activities
	 */
	getResourcesAndActivities: function()
	{
		var resources = [];
		for(var i=0;i<this._resources.length;i++)
		{
			resources.push([[this._resources[i].obj], [this._resources[i].activities]]);
		}
		return resources;
	},
	
	getResourceActivitiesPerDay: function(resource, day)
	{
	   if(resource.obj.getId())
		{
			var index = -1;
			for(var i=0;i<this._resources.length;i++)
			{
				if(this._resources[i] == resource)
					return this._resources[i].day_act[day];
			}
		}
		return [];
	
	},
	
	getAll: function()
	{
	     
		 return this._resources;
	},
	
	
	/*
	 * add a new activity to scheduling board
	 */
	addWeekActivity : function(resource, activity)
	{
	   if(resource.getId() && activity.getId())
		{
			try 
			{
			    var resource = this.addResource(resource);
				var resourceobj=resource;
				resource.activities.push(activity);
				activity.setResourceAttached(resource);
				var actperday=resource.day_act[activity.getStartDate().getDay()].length
				var i=activity.getStartDate().getDay();
				var j=activity.getEndDate().getDay();
				for(var k=i;k<=j;k++)
				     resource.day_act[k].push(activity);
				
				var activity_div = activity.getElement();
				GiPCordys.Utils.Element.extend(activity_div);
				activity_div.addClass("activity_week");
				activity_div.innerHTML = "<span>"+activity.getStartDate().getHours()+":"+activity.getStartDate().getMinutes()+"-"+activity.getEndDate().getHours()+":"+activity.getEndDate().getMinutes()+"</span>";
				activity_div.title=activity.getTitle();
				
				if(activity.getType() && this._options.colors[activity.getType()])
				{
					activity_div.firstChild.style.backgroundColor = this._options.colors[activity.getType()];
				}
				
				if(activity.getStartDate().getDate()!=activity.getEndDate().getDate())
				{
					var daydiff=activity.getEndDate().getDate()-activity.getStartDate().getDate();
					activity_div.style.left=activity.getStartDate().getDay()*171+"px";
					activity_div.style.width=(daydiff+1)*171+"px";
					activity_div.style.top=actperday*10+"px"
				}
				else
				{
					activity_div.style.width= "171px";
					activity_div.style.left=/*(actperday*25)+*/activity.getStartDate().getDay()*171+"px"
					activity_div.style.top=actperday*10+"px"
				}
				
				resource.obj.getElements().activityHolder.appendChild(activity_div);
				
				var dact = new GiPCordys.scheduler.DragableImp(activity_div);
				dact.setContainment(this._elems['activities_inner']);
				dact.setScrollContainment(this._elems['activities_container']);
				dact.setGrid(171,31);
				
				activity_div.addListener('click',function(e)
				{
				     var toppx = dact.getDragable().getElem().offset().top;
					 var r = Math.floor((toppx+dact.getScrollContainment().scrollTop)/31);
					 var leftpx = dact.getDragable().getElem().offset().left;
					 
					 var sidemargin;
					 if(activity.getElement().windowLengthWidth().width>=1300)
						sidemargin=(activity.getElement().windowLengthWidth().width-1300)/2+88;
					 else
					    sidemargin=90;	 
						this._elems['popup'].style.top=177+toppx+30+"px";
					    this._elems['popup'].style.left=sidemargin+leftpx+"px";
                     
				     if(this._elems['popup'].style.display=="none")
						this._elems['popup'].style.display="block"
					 else if(this.getSelectedActivity().activity==activity)
					    this._elems['popup'].style.display="none"
	                 
					 this._elems['resource_name'].innerHTML=activity.getResourceAttached().obj.getName();
					 this._elems['activity_displayname'].innerHTML=activity.getTitle();
					 this._elems['activity_startDate'].value=activity.getStartDate().getDate()+"/"+(activity.getStartDate().getMonth()+1)+"/"+activity.getStartDate().getFullYear();
		             this._elems['activity_startTime'].value=activity.getStartDate().getHours()+":"+activity.getStartDate().getMinutes();
					 this._elems['activity_endDate'].value=activity.getEndDate().getDate()+"/"+(activity.getEndDate().getMonth()+1)+"/"+activity.getEndDate().getFullYear();
		             this._elems['activity_endTime'].value=activity.getEndDate().getHours()+":"+activity.getEndDate().getMinutes();
					 this._elems['activity_type'].selectedIndex=this._activityType[activity.getType()];
					 this.setSelectedActivity(this._resources[r],activity,resource);
					 }.bind(this))

				dact.getDragable().onDragStart(function(e,activity)
				{
						if(this._elems['popup'].style.display=="block")
							this._elems['popup'].style.display="none";

						var toppx = dact.getDragable().getElem().offset().top;
						var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);	
			
						this._elems['activities_container'].addClass('dragging');
						this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragStart, {activity: activity});
				}.bind(this).curry(activity));
				
				dact.getDragable().onDrag(function(e,activity)
				{
					this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.onDrag, {activity: activity});
				}.bind(this).curry(activity));
				
				dact.getDragable().onDragEnd(function(e,activity,resource)
				{
						var leftpx = dact.getDragable().getElem().offset().left;
						var toppx = dact.getDragable().getElem().offset().top;
						var t = Math.round((leftpx+dact.getScrollContainment().scrollLeft)/171);
						var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);
				
						this._elems['activities_container'].removeClass('dragging');
					    
						var startdate = activity.getStartDate();
						var enddate = activity.getEndDate();
						var diff=enddate.getDate()-startdate.getDate();
						var oldday=startdate.getDay();
					
						var date = new Date(this._weekperiod.year, this._weekperiod.month, this._weekperiod.day);
					    var newDate;
						if(t >= 0)
						{
						   
							startdate.setDate(date.getDate()+t)
							enddate.setDate(startdate.getDate()+diff);
						}
						var newday=startdate.getDay();

						
						enddate.setDate(enddate.getDate());
						
				    if(this._resources[r].obj.getId()!=resourceobj.obj.getId() || newday!=oldday )
					{
								
								this.updateWeeklyActivity(activity,this._resources[r]);
								this.changeActivityResourcePerDay(activity,this._resources[r], resourceobj, newday, oldday);
								this.changeActivityResource(activity,this._resources[r].obj,resource.obj);
								
					}   
					// update resource
					if(this._resources[r])
					{
						
						this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragEnd, {resource: this._resources[r].obj, activity: activity, previousResource: resource.obj});
					}
				   resourceobj=this._resources[r];
				}.bind(this).curry(activity,resource));
            }
			catch(e)
			{
					//alert(e);
			}
	    }
	},
	addActivity: function(resource, activity)
	{
		if(resource.getId() && activity.getId())
		{
			try 
			{
				var resource = this.addResource(resource);
				resource.activities.push(activity);
				
				var activity_div = activity.getElement();
				GiPCordys.Utils.Element.extend(activity_div);
				activity_div.addClass("activity");
				activity_div.innerHTML = "<span>"+activity.getTitle()+"</span>";
				activity_div.id = "activity_"+activity.getId();
			
				if(activity.getType() && this._options.colors[activity.getType()])
				{
					activity_div.firstChild.style.backgroundColor = this._options.colors[activity.getType()];
				}
			
				activity_div.style.left = this._computePosition().activity.left(activity.getStartDate())+'px';
				activity_div.style.width = this._computePosition().activity.width(activity.getStartDate(), activity.getEndDate())+'px';
				resource.obj.getElements().activityHolder.appendChild(activity_div);
			
				var dact = new GiPCordys.scheduler.DragableImp(activity_div);
				dact.setContainment(this._elems['activities_inner']);
				dact.setScrollContainment(this._elems['activities_container']);
				dact.setGrid(40,31);
				
				activity_div.addListener('click',function(e)
				{
				     var toppx = dact.getDragable().getElem().offset().top;
					 var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);
					 var leftpx = dact.getDragable().getElem().offset().left;
					 
					 var sidemargin;
					 if(activity.getElement().windowLengthWidth().width>=1300)
						sidemargin=(activity.getElement().windowLengthWidth().width-1300)/2+88;
					 else
					    sidemargin=90;
              			//activities_container.height-popup.height		 
						this._elems['popup'].style.top=177+toppx+30+"px";
					    this._elems['popup'].style.left=sidemargin+leftpx+this._computePosition().activity.width(activity.getStartDate(), activity.getEndDate())+"px";
                      if(this._elems['popup'].style.display=="none")
							this._elems['popup'].style.display="block"
					  else if(this.getSelectedActivity().activity==activity)
							this._elems['popup'].style.display="none"
	                 //asigning values 
					 this._elems['resource_name'].innerHTML=this._resources[r].obj.getName();
					 this._elems['activity_displayname'].innerHTML=activity.getTitle();
					 this._elems['activity_startDate'].value=activity.getStartDate().getDate()+"/"+(activity.getStartDate().getMonth()+1)+"/"+activity.getStartDate().getFullYear();
		             this._elems['activity_startTime'].value=activity.getStartDate().getHours()+":"+activity.getStartDate().getMinutes();
					 this._elems['activity_endDate'].value=activity.getEndDate().getDate()+"/"+(activity.getEndDate().getMonth()+1)+"/"+activity.getEndDate().getFullYear();
		             this._elems['activity_endTime'].value=activity.getEndDate().getHours()+":"+activity.getEndDate().getMinutes();
					 this._elems['activity_type'].selectedIndex=this._activityType[activity.getType()];
					 this.setSelectedActivity(this._resources[r],activity,resource);
					
				}.bind(this))	
				
				if(this.getPermissions() == GiPCordys.scheduler.Permissions.ReadOnly)
				{
					dact.lock();
				}
				
				dact.getDragable().onDragStart(function(e,activity)
				{
				    if(this._elems['popup'].style.display=="block")
					   this._elems['popup'].style.display="none"
					   
					activity.getElement().addClass('dragging');
					var toppx = dact.getDragable().getElem().offset().top;
					var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);	
					//asigning class to holder
					this._elems['activities_container'].addClass('dragging');
					this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragStart, {activity: activity});
				}.bind(this).curry(activity));
				
				dact.getDragable().onDrag(function(e,activity)
				{
					
					this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.onDrag, {activity: activity});
				}.bind(this).curry(activity));
				
				dact.getDragable().onDragEnd(function(e,activity,resource)
				{
				
				    activity.getElement().removeClass('dragging');
					// start computing new dates
					var leftpx = dact.getDragable().getElem().offset().left;
					var toppx = dact.getDragable().getElem().offset().top;
					var t = Math.round((leftpx+dact.getScrollContainment().scrollLeft)/40);
					var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);
					
					//removing class
					this._elems['activities_container'].removeClass('dragging');
					
					var startdate = activity.getStartDate();
					var hours = 8;
					var minutes = 0;
					
					if(t > 0 && (t%2)!=0)
					{
						hours += ((t-t%2)/2);
						minutes += (t%2)*30;
					}
					else
					{
						hours += t/2;
						minutes += 0;
					}
					var hoursdif = hours-startdate.getHours();
					var minutesdif = minutes-startdate.getMinutes();
			
					startdate.setHours(hours);
					startdate.setMinutes(minutes);
					
					var enddate = activity.getEndDate();
					enddate.setHours(enddate.getHours()+hoursdif);
					enddate.setMinutes(enddate.getMinutes()+minutesdif);
					// end computing new dates
					
					this.updateActivity(activity,this._resources[r]);
				    
					// update resource
					if(this._resources[r])
					{
						this.changeActivityResource(activity,this._resources[r].obj,resource.obj);
						this.changeResizerResource(activity,this._resources[r].obj,resource.obj)
						this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragEnd, {resource: this._resources[r].obj, activity: activity, previousResource: resource.obj});
						
					}
					resource=this._resources[r];
					
					
			
				}.bind(this).curry(activity,resource));
		    }
			catch(e)
			{
					//alert(e);
			}
			
		}
	},	
	//resizer
	addResizer: function(resource, activity)
	{
	    
			var resource = this.addResource(resource);
			
			var resizer_div = activity.getResizer();
			GiPCordys.Utils.Element.extend(resizer_div);
			resizer_div.addClass("resizer");
			resizer_div.id="resizer_"+activity.getId();
		
			var left_div=this._computePosition().activity.left(activity.getStartDate())+this._computePosition().activity.width(activity.getStartDate(), activity.getEndDate())-2;
			resizer_div.style.left = left_div+"px"
		 
			resource.obj.getElements().activityHolder.appendChild(resizer_div);
		 
			var dact = new GiPCordys.scheduler.DragableImp(resizer_div);
			dact.setContainment(resource.obj.getElements().activityHolder);
			dact.setScrollContainment(this._elems['activities_container']);
			dact.setGrid(40,31);
		 
			if(this.getPermissions() == GiPCordys.scheduler.Permissions.ReadOnly)
			{
				dact.lock();
			}
		 
			dact.getDragable().onDragStart(function(e,activity)
			{
					if(this._elems['popup'].style.display=="block")
					   this._elems['popup'].style.display="none"
					   
					var toppx = dact.getDragable().getElem().offset().top;
					activity.setToppx(toppx);
					var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);	
					this._resources[r].obj.getElements().activityHolder.addClass('resizing');
			      
					this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragStart, {activity: activity});
				  
			}.bind(this).curry(activity));
		
			dact.getDragable().onDrag(function(e,activity)
			{
				var toppx=activity.getToppx();
				var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);	
				this._resources[r].obj.getElements().activityHolder.appendChild(e._resizer)
		     
			    //showing resizing
				var leftpx = resizer_div.offsetLeft;
				var t = Math.round((leftpx+dact.getScrollContainment().scrollLeft)/40);
			 
				var hours = 8;
				var minutes = 0;
					
				if(t > 0 && (t%2)!=0)
				{
					hours += ((t-t%2)/2);
					minutes += (t%2)*30;
				}
				else
				{
					hours += t/2;
					minutes += 0;
				}
			    var startdate=activity.getStartDate();
				if(startdate.getHours()<hours)
				{
				var enddate = activity.getEndDate();
				enddate.setHours(hours);
				enddate.setMinutes(minutes);
				}
				else if(startdate.getHours()==hours && (minutes-startdate.getMinutes())==30)
				{
				var enddate = activity.getEndDate();
				enddate.setHours(hours);
				enddate.setMinutes(minutes);
				}
				
					this.updateActivity(activity,this._resources[r])
			 
				this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.onDrag, {activity: activity});
			}.bind(this).curry(activity));
		 
			dact.getDragable().onDragEnd(function(e,activity,resource,r)
			{
		       		// start computing new dates
				var leftpx = resizer_div.offsetLeft;
				var t = Math.round((leftpx+dact.getScrollContainment().scrollLeft)/40);
				
                var toppx=activity.getToppx();
				var r = Math.round((toppx+dact.getScrollContainment().scrollTop)/31);	
		    	this._resources[r].obj.getElements().activityHolder.removeClass('resizing');					
          		
				leftpx=0;
				var hours = 8;
				var minutes = 0;
					
				if(t > 0 && (t%2)!=0)
				{
					hours += ((t-t%2)/2);
					minutes += (t%2)*30;
				}
				else
				{
					hours += t/2;
					minutes += 0;
				}
					
				var startdate=activity.getStartDate();
				if(startdate.getHours()<hours)
				{
				var enddate = activity.getEndDate();
				enddate.setHours(hours);
				enddate.setMinutes(minutes);
				}
				else if(startdate.getHours()==hours && (minutes-startdate.getMinutes())==30)
				{
				var enddate = activity.getEndDate();
				enddate.setHours(hours);
				enddate.setMinutes(minutes);
				}
			
				this.updateActivity(activity,this._resources[r])
				if(this._resources[r])
				{
					  
				   this._triggerEvent(GiPCordys.scheduler.EventTypes.Activity.DragEnd, {resource: this._resources[r].obj, activity: activity, previousResource: resource.obj});
					
				}
					
					
			}.bind(this).curry(activity,resource));
	},
		
	/*
	 * update existing activity
	 */
	updateActivity: function(activity,resource)
	{
		// TODO check overlapping items?
		if(activity.getId())
		{
			var activity_div = activity.getElement();
			activity_div.innerHTML = "<span>"+activity.getTitle()+"</span>";
			
			if(activity.getType() && this._options.colors[activity.getType()])
			{
				activity_div.firstChild.style.backgroundColor = this._options.colors[activity.getType()];
			}
			
			activity_div.id = "activity_"+activity.getId();
			activity_div.style.left = this._computePosition().activity.left(activity.getStartDate())+'px';
			activity_div.style.width = this._computePosition().activity.width(activity.getStartDate(), activity.getEndDate())+'px';
			
			var resizer_div = activity.getResizer();
			resource.obj.getElements().activityHolder.appendChild(resizer_div);
			resizer_div.id="resizer_"+activity.getId();
			var left_div=this._computePosition().activity.left(activity.getStartDate())+this._computePosition().activity.width(activity.getStartDate(), activity.getEndDate())-2;
			resizer_div.style.left = left_div+"px"
			activity.setResourceAttached(resource);	
		
		}
	},
	
	updateWeeklyActivity: function(activity,resource)
	{
	  if(activity.getId())
		{
			var activity_div = activity.getElement();
			activity_div.innerHTML = "<span>"+activity.getStartDate().getHours()+":"+activity.getStartDate().getMinutes()+"-"+activity.getEndDate().getHours()+":"+activity.getEndDate().getMinutes()+"</span>";
			
			if(activity.getType() && this._options.colors[activity.getType()])
			{
				activity_div.firstChild.style.backgroundColor = this._options.colors[activity.getType()];
			}
			//debugger;
			var day=activity.getStartDate().getDay()
			var end_day=activity.getEndDate().getDay();
			var len1=new Array();
			for(var i=0;i<=(end_day-day);i++)
				{
				var actperday=this.getResourceActivitiesPerDay(resource,(day+i))
				len1[i]=actperday.length;
				}
			var len=len1.sort()[(len1.length)-1];
			
			activity_div.id = "activity_"+activity.getId();
			//activity_div.style.width= "50px";
			/*var left;
			left=(len*25)+activity.getStartDate().getDay()*171+"px"
				for(var i=0;i<actperday.length;i++)
				{
					if(actperday[i].getId()==activity.getId())
						left=(i*25)+activity.getStartDate().getDay()*171+"px"
				}
			activity_div.style.left=left;*/
			
				if(activity.getStartDate().getDate()!=activity.getEndDate().getDate())
				{
					var daydiff=activity.getEndDate().getDate()-activity.getStartDate().getDate();
					activity_div.style.width=(daydiff+1)*171+"px";
				}
				else
				{
					activity_div.style.width= "171px";
				}
				activity_div.style.left=/*(actperday*25)+*/activity.getStartDate().getDay()*171+"px"
				activity_div.style.top=len*10+"px"
				if (len >= 3) {
					resource.obj._elements.activityHolder.style.height = (len+1)*10+1 + "px";
					resource.obj._elements.resourceHolder.style.height = (len+1)*10+1 + "px";					
				}	
				activity.setResourceAttached(resource);			
		}
	},
	/*
	 * update existing resource
	 */
	updateResource: function(resource)
	{
		if(resource.getId())
		{
			resource.getElements().resourceHolder.innerHTML = resource.getTitle();
		}
	},
	
	/*
	 * change resource of given activity
	 */
	changeActivityResource: function(activity, newResource, oldResource)
	{
		if(activity.getId())
		{ 
		  	if(this._options.view!="week")
				activity.getElement().style.top = "0px"
			
			newResource.getElements().activityHolder.appendChild(activity.getElement());
			/* */
			var or_activities = this.getResourceActivities(oldResource);
			var tmpArray = [];
			for(var i=0;i<or_activities.length;i++)
			{
				if(or_activities[i].getId() == activity.getId())
					var activity1 = or_activities[i];
				else
					tmpArray.push(or_activities[i]);
			}
			or_activities.length=0;
			for(var k=0;k<tmpArray.length;k++)
			{
				or_activities.push(tmpArray[k]); 
			}
			delete tmpArray;				
			this.getResourceActivities(newResource).push(activity1);
			activity.setResourceAttached(newResource);	
		}
	},
	
	changeActivityResourcePerDay: function(activity, newresource, oldresource, newday, oldday)
	{
        var i1=activity.getStartDate().getDay();
		var j1=activity.getEndDate().getDay();
		var diff=j1-i1
		var day=0;
		while(diff>=day)
		{
		    var tmpArray=[];
			var oldResource=oldresource.day_act[oldday+day]
		
			for(var i=0; i<oldResource.length;i++)
			{
				if(oldResource[i].getId()==activity.getId())
					var activity1=oldResource[i];
				else
					tmpArray.push(oldResource[i])
			}	
			oldResource.length=0;
		
			for(var k=0;k<tmpArray.length;k++)
			{
				oldResource.push(tmpArray[k]); 
				this.updateoldresource(tmpArray[k],oldresource)
			}
		        day++;
				delete tmpArray;
		}
		
		for(var k=i1;k<=j1;k++)
			newresource.day_act[k].push(activity);
		
    },
	updateoldresource: function(activity, resource)
	{
	            var activity_div = activity.getElement();
				activity_div.innerHTML = "<span>"+activity.getStartDate().getHours()+":"+activity.getStartDate().getMinutes()+"-"+activity.getEndDate().getHours()+":"+activity.getEndDate().getMinutes()+"</span>";
			
			if(activity.getType() && this._options.colors[activity.getType()])
			{
				activity_div.firstChild.style.backgroundColor = this._options.colors[activity.getType()];
			}
			var day=activity.getStartDate().getDay()
			var actperday=this.getResourceActivitiesPerDay(resource,day)
			var len=actperday.length
			activity_div.id = "activity_"+activity.getId();
			
				if(activity.getStartDate().getDate()!=activity.getEndDate().getDate())
				{
					var daydiff=activity.getEndDate().getDate()-activity.getStartDate().getDate();
					activity_div.style.width=(daydiff+1)*171+"px";
				}
				else
				{
					activity_div.style.width= "171px";
				}
				activity_div.style.left=/*(actperday*25)+*/activity.getStartDate().getDay()*171+"px"
				activity_div.style.top=(len-1)*9+"px"
	},
	
	changeResizerResource: function(activity, newResource, oldResource)
	{
	    if(activity.getId())
		{
			newResource.getElements().activityHolder.appendChild(activity.getResizer());
		}
	},
	
	 
	/*
	 * deletes an activity from scheduling board
	 */
	deleteActivity: function(activity)
	{
		if(activity.getId())
		{
		 
		}
	},
	
	_computePosition: function()
	{
		var calcminutes = function (hours, min)
		{
			return (hours*60)+min;
		};
		
		return {
			activity: {
				left: function (startTime) 
				{
					var min = calcminutes (startTime.getHours(), startTime.getMinutes() );
					return Math.round( ( min - 480 ) * 1.33333333333);
				},
				width: function(startTime, endTime) 
				{
					var startMin = calcminutes (startTime.getHours(), startTime.getMinutes() );
					var endMin = calcminutes (endTime.getHours(), endTime.getMinutes() );
					return Math.floor( (endMin - startMin) * 1.33333333333); 
				}
			}
		};
	},
	
	_triggerEvent: function(event, data)
	{
		var listeners = GiPCordys.scheduler.event.getListeners(this, event);
		if(listeners)
		{
			for(var i=0;i<listeners.length;i++)
			{
				listeners[i].call(this,data);
			}
		}
	},
	updateListeners: function(listener)
	{
	},
	
	setSelectedActivity: function(newresource,activity,oldresource)
	{
       this._selectedActivity.newresource=newresource;
	   this._selectedActivity.activity=activity;
	   this._selectedActivity.oldresource=oldresource;
	},
	
	getSelectedActivity: function()
	{
	   return this._selectedActivity;
	}
	
	

	
};
/**
 * events
 */
GiPCordys.scheduler.event = (function(){
	var objects = [];
	function addListener(object, event, fn)
	{
		var j = -1;
		for(var i=0;i<objects.length;i++)
			if(objects[i].object === object)
				var j = i;
		if(j == -1)
		{
			objects.push({
				object: object, 
				listeners: {}
			});
			j = 0;
		}
		if(objects[j].listeners[event])
			objects[j].listeners[event].push(fn);
		else
			objects[j].listeners[event] = [fn];
		
		object.updateListeners({event: event, fn: fn});
	}
	/*
	 *
	 */
	function getListeners(object, event)
	{
		var listeners = null;
		for(var i=0;i<objects.length;i++)
		{
			if(objects[i].object === object)
				listeners = objects[i].listeners;
		}
		
		if(event && listeners)
			return listeners[event];
		return listeners;
	}
	return {
		addListener: addListener,
		getListeners: getListeners
	}
})();

/**
 * Dragable Implementation (Activity)
 */
GiPCordys.scheduler.DragableImp = function(elem)
{
	this._dragable = new GiPCordys.scheduler.Dragable(elem);
	this._scrollContainment = null;
	
	// mouseCoordinates
	this._mouseStartCoords;
	this._mouseCoords;
	
	this._dragable.onDragStart(function(e)
	{
		var elem = this._dragable.getElem();
			
		this._left = elem.offset().left + this.getScrollContainment().scrollLeft;
		this._top = elem.offset().top + this.getScrollContainment().scrollTop;
		
		elem.parentNode.parentNode.firstChild.appendChild(elem);
		elem.style.left = this._left + 'px'; 
		elem.style.top = this._top + 'px';
		
		this._opdx = 0;
		this._opdy = 0;
		
		this._mouseStartCoords = GiPCordys.Utils.Event.getMouseCoordinates(e);
	}.bind(this));
	this._dragable.onDrag(function(e)
	{
	    
		this._mouseCoords = GiPCordys.Utils.Event.getMouseCoordinates(e);
		var elem = this._dragable.getElem();
		
		var dx = this._mouseCoords.x - this._mouseStartCoords.x + this._opdx;
		var dy = this._mouseCoords.y - this._mouseStartCoords.y + this._opdy;
				
		if(grid = this._dragable.getGrid())
		{
			if(grid.x)
				dx = parseInt(dx/grid.x)*grid.x;
			if(grid.y)
				dy = parseInt(dy/grid.y)*grid.y;
		}
		/*
		 *	autoscroll
		 */
		if(elem.offset().left + elem.outerWidth() >= this.getScrollContainment().outerWidth())
		{
			this._opdx += grid.x;
			this.getScrollContainment().scrollLeft += grid.x*1;
		}
		if(elem.offset().left < 0)
		{
			this._opdx -= grid.x;	
			this.getScrollContainment().scrollLeft -= grid.x*1;
		}
		
		if(elem.offset().top + elem.outerHeight() >= this.getScrollContainment().outerHeight())
		{
			this._opdy += grid.y;
			this.getScrollContainment().scrollTop += grid.y*1;
		}
		if(elem.offset().top < 0)
		{
			this._opdy -= grid.y;	
			this.getScrollContainment().scrollTop -= grid.y*1;
		}

		
		if(boundaries = this.getDragable().getBoundaries())
		{				
			if(this._left + dx < boundaries.left)
			{
				dx = boundaries.left-this._left;
			}
			else if(this._left + elem.outerWidth() + dx >= boundaries.right)
			{
				dx = boundaries.right - this._left - elem.outerWidth() - 1;
			}
			if(this._top + dy < boundaries.top)
			{
				dy = boundaries.top - this._top;
			}
			else if(this._top + dy >= boundaries.bottom)
			{
				dy = boundaries.bottom - this._top - (grid.y?grid.y:this.outerHeight());
			}
		}		
		elem.style.position = 'absolute';
		elem.style.left =  this._left + dx + 'px';
		elem.style.top =  this._top + dy + 'px';		
			
	}.bind(this));
	this._dragable.onDragEnd(function(e)
	{
		
	}.bind(this));
};
GiPCordys.scheduler.DragableImp.prototype = {
	lock: function()
	{
		this.getDragable().lock();
	},
	unlock: function()
	{
		this.getDragable().unlock();
	},
	getDragable: function()
	{
		return this._dragable;
	},
	setGrid: function(x,y)
	{
		this.getDragable().setGrid(x,y);
	},
	setContainment: function(elem)
	{
		this.getDragable().setContainment(elem);
	},
	setScrollContainment: function(elem)
	{
		this._scrollContainment = elem;
	},
	getScrollContainment: function()
	{
		return this._scrollContainment;
	},
	setBoundaries: function(top, right, bottom, left)
	{
		this.getDragable().setBoundaries(top, right, bottom, left);
	}
};
 
/**
 * Dragable
 */
GiPCordys.scheduler.Dragable = function(elem)
{
    
	this._elem = elem;
	this._treshold = 500; 	// in miliseconds
	this._locked = false;	// boolean indicating whether element is locked
	this._isDragging = false; // boolean indicating element being dragged
	
	this._containment = null;
	this._boundaries = {};
	this._grid = {};
	
	this._listeners = {dragStart: [], onDrag: [], dragEnd: []};
		
	var mouseDown = function(e)
	{	
		var eCopy = {};
		for (var i in e) eCopy[i] = e[i];

		if(this._treshold > 0)
			this._dragDelayTimer = setTimeout(dragDelayTimerExpired.curry(eCopy), this._treshold);
		
		document.addListener("mousemove", mouseMove.bindEventListener(this));
		
		// disable selectstart
		document.addListener("selectstart", function() {return false});
		if(e.preventDefault)
			e.preventDefault(); // disable selection
		else
			e.returnValue = false;
			
		return false;
	};
	var dragDelayTimerExpired = function(e)
	{		
		this._dragDelayTimer = null;
		this._dragStart(e);
	}.bind(this);
	
	var mouseUp = function(e)
	{
		if(this._dragDelayTimer)
			clearTimeout(this._dragDelayTimer);
		this._dragDelayTimer = null;
		if(this._isDragging)
			this._dragEnd(e);
			
		document.removeListener("mousemove", mouseMove.bindEventListener(this));
	};
	var mouseMove = function(e)
	{
		if(this._isDragging)
			this._dragging(e);
	};
	
	GiPCordys.Utils.Element.extend(document);
	GiPCordys.Utils.Element.extend(this._elem);
	this._elem.addListener("mousedown", mouseDown.bindEventListener(this));
	document.addListener("mouseup", mouseUp.bindEventListener(this));
};
GiPCordys.scheduler.Dragable.prototype = {
	getElem: function()
	{
		return this._elem;
	},
	isLocked: function()
	{
		return this._locked;
	},
	lock: function()
	{
		this._locked = true;
	},
	unlock: function()
	{
		this._locked = false;
	},
	setTresHold: function(treshold)
	{
		this._treshold = parseInt(treshold);
	},
	_dragStart: function(e)
	{
		if(!this.isLocked())
		{
			this._isDragging = true;
			this.computeBoundaries();
			if(this._listeners.dragStart)
				for(var i=0;i<this._listeners.dragStart.length;i++)
					this._listeners.dragStart[i].call(this,e);
		}
	},
	_dragging: function(e)
	{
		if(!this.isLocked())
		{
			if(!e) var e = window.event;
			
			if(this._listeners.onDrag)
				for(var i=0;i<this._listeners.onDrag.length;i++)
					this._listeners.onDrag[i].call(this, e);
		}
	},
	_dragEnd: function(e)
	{
		this._isDragging = false;
		
		if(this._listeners.dragEnd)
			for(var i=0;i<this._listeners.dragEnd.length;i++)
				this._listeners.dragEnd[i].call(this, e);
	},
	onDragStart: function(fn)
	{
		this._listeners.dragStart.push(fn);
	},
	onDrag: function(fn)
	{
		this._listeners.onDrag.push(fn);
	},
	onDragEnd: function(fn)
	{
		this._listeners.dragEnd.push(fn);
	},
	/*
	 * GiPCordys Util Elem
	 */
	setContainment: function(elem)
	{
		this._containment = elem;
	},
	getContainment: function()
	{
		return this._containment;
	},
	setBoundaries: function(top, right, bottom, left)
	{
		this._boundaries = {'top': top, 'right': right, 'bottom': bottom, 'left': left};
	},
	/*
	 * update boundaries
	 */
	updateBoundaries: function(top, right, bottom, left)
	{
		if(b = this._boundaries && this._boundaries.top && this._boundaries.left && this._boundaries.right && this._boundaries.bottom)
		{
			this.setBoundaries(Math.min(top, b.top), Math.min(right, b.right), Math.min(bottom, b.bottom), Math.min(left, b.left));
		}
		else
		{
			this.setBoundaries(top, right, bottom, left);
		}
	},
	computeBoundaries: function()
	{
		if(elem = this._containment)
		{
			if(elem.getStyle('position') == 'relative' || elem.getStyle('position') == 'static')
			{
				//this.updateBoundaries(0, elem.outerWidth(), elem.outerHeight(), 0);
				this.updateBoundaries(0, elem.scrollWidth, elem.scrollHeight, 0);
			}
			else
				this.updateBoundaries(elem.offset().top, elem.offset().left+elem.outerWidth(), elem.offset().top+elem.outerHeight(), elem.offset().left);
		}
	},
	getBoundaries: function()
	{
		return this._boundaries;
	},
	setGrid: function(x,y)
	{
		this._grid = {x:x, y:y};
	},
	getGrid: function()
	{
		return this._grid;
	}
};

/**
 * Resource
 */
GiPCordys.scheduler.Resource = function(options)
{
	this._options;
	this._name;
	this._id;
	this._elements = {};
	
	this.setOptions(options);
}
GiPCordys.scheduler.Resource.prototype = {
	setOptions: function(options)
	{
		this._options = options?options:{};
		if(this._options.id != "undefined")
			this.setId(this._options.id);
		if(this._options.name != "undefined")
			this.setName(this._options.name);

		this._elements['resourceHolder'] = document.createElement("div");
		GiPCordys.Utils.Element.extend(this._elements['resourceHolder']);
		this._elements['resourceHolder'].innerHTML = "";	
		this._elements['activityHolder'] = document.createElement("div");
		GiPCordys.Utils.Element.extend(this._elements['activityHolder']);
		this._elements['activityHolder'].innerHTML = "";
	},
	setId: function(id)
	{
		this._id = id;
	},
	getId: function()
	{
		return this._id;
	},
	setName: function(name)
	{
		this._name = name;
	},
	getName: function()
	{
		return this._name;
	},
	getElements: function()
	{
		return this._elements;
	}
};

/**
 * Activity
 */
GiPCordys.scheduler.Activity = function(options)
{
	this._options;
	this._id;
	this._title;
	this._startdate;
	this._enddate;
	this._type;
	this._lastupdate;
	this._element = document.createElement('div'); // HTMLDivElement;
	this._resizer = document.createElement('div');
	this._toppx;
	this._resourceAttached;
	
	this.setOptions(options);	
}
GiPCordys.scheduler.Activity.prototype = {
	setOptions: function(options)
	{
		this._options = options?options:{};
		if(this._options.id != "undefined")
			this.setId(this._options.id);
		if(this._options.title != "undefined")
			this.setTitle(this._options.title);
		if(this._options.startdate  != "undefined")
			this.setStartDate(this._options.startdate);
		if(this._options.enddate != "undefined")
			this.setEndDate(this._options.enddate);
		if(this._options.type != "undefined")
			this.setType(this._options.type);
		if(this._options.lastupdate != "undefined")
			this.setLastUpdate(this._options.lastupdate);
		    
	},
	setId: function(id)
	{
		this._id = id;
	},
	getId: function()
	{
		return this._id;
	},	
	setTitle: function(title)
	{
		this._title = title;
	},
	setStartDate: function(date)
	{
		this._startdate = date;
	},
	setEndDate: function(date)
	{
		this._enddate = date;
	},
	setType: function(type)
	{
		this._type = type;
	},
	getType: function(type)
	{
		return this._type;
	},
	getTitle: function()
	{
		return this._title;
	},
	getStartDate: function()
	{
		return this._startdate;
	},
	getEndDate: function()
	{
		return this._enddate;
	},
	getElement: function()
	{
		return this._element;
	},
	setLastUpdate: function(date)
	{
		this._lastupdate = date;
	},
	getLastUpdate: function()
	{
		return this._lastupdate;
	},
	getResizer: function()
	{
	    return this._resizer;
	},
	setToppx: function(toppx)
	{
	   this._toppx=toppx;
	},
	getToppx: function()
	{
	   return this._toppx
	},
	setResourceAttached: function(resource)
	{
	   this._resourceAttached=resource;
	},
	getResourceAttached: function()
    {
	   return this._resourceAttached;
	}
};
//callback();

