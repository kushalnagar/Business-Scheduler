(function () {
	function toArray(pseudoArray) 
	{
		var result = [];
		for (var i = 0; i < pseudoArray.length; i++)
			result.push(pseudoArray[i]);
		return result;
	}
	Function.prototype.bind = function (object)
	{
		var method = this;
		var oldArguments = toArray(arguments).slice(1);
		return function () {
			var newArguments = toArray(arguments);
			return method.apply(object, oldArguments.concat(newArguments));
		};
	}
	Function.prototype.bindEventListener = function (object)
	{
		var method = this;
		var oldArguments = toArray(arguments).slice(1);
		return function (event) {
			return method.apply(object, [event || window.event].concat(oldArguments));
		};
	};
	Function.prototype.curry = function (arg)
	{
		var func = this;
		var newargs = [arg];
		for (var i = 0; i < arguments.length; i++)
			newargs.push(arguments[i]);
			
		return function () {
			return func.apply(this, newargs);
		};
	};
	Function.prototype.prependArg = function (arg) 
	{  
		var func = this;  
	  
		return function () 
		{  
			var newargs = [arg];  
			for (var i = 0; i < arguments.length; i++)  
				newargs.push(arguments[i]);  
			return func.apply(this, newargs);  
		};
	}
	/*Array.prototype.clear=function()
	{
		while(this.length != 0)
			this.pop();
	}*/
})();




function XHttpReq()
{
	this.readyFn = null;
	
	if (window.XMLHttpRequest) 
	{
		this.xhttp = new XMLHttpRequest();
	}
	else // Internet Explorer 5/6
	{
		this.xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	this.getRequest().onreadystatechange = function() 
	{
		if (this.getRequest().readyState == 4)
		{
			if(this.readyFn)
			{
				this.readyFn.call(this,this.getRequest());
			}
		}
	}.bind(this);
}
XHttpReq.prototype = {
	openConnection: function(method, url, async)
	{
		this.getRequest().open(method, url, async);
	},
	setRequestHeader: function(header,value)
	{
		this.getRequest().setRequestHeader(header, value);
	},
	send: function(data)
	{
		this.getRequest().send(data);
	},
	onReady: function(fn)
	{
		this.readyFn = fn;
	},
	getRequest: function()
	{
		return this.xhttp;
	}
	
};
function sendSoapData(url,data,fn)
{
	var req = new XHttpReq();
	
	req.openConnection('POST', url, true);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.send(data);
	req.onReady(fn);
}
function loadXMLDoc(dname)
{
if (window.XMLHttpRequest)
  {
  xhttp=new XMLHttpRequest();
  }
else
  {
  xhttp=new ActiveXObject("Microsoft.XMLHTTP");
  }
xhttp.open("GET",dname,false);
xhttp.send();
return xhttp.responseXML;
}