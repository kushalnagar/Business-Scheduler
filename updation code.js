/*noreload = false;
	var processModifiedAct = function(req)
	{
		if(req.responseXML.getElementsByTagName("result")[0].childNodes[0].nodeValue == "success")
		{
			 data.activity.setLastUpdate(new Date(req.responseXML.getElementsByTagName("modificationDate")[0].childNodes[0].nodeValue));
		}
		else
		{
			alert('Fout opgetreden bij het opslaan naar de database');
		}
	};
	
	var processModifiedDate = function(req)
	{
		var modifyDate = new Date(req.responseXML.getElementsByTagName("modificationDate")[0].childNodes[0].nodeValue);
		
		if(modifyDate <= data.activity.getLastUpdate())
		{			
			var startdate = data.activity.getStartDate();
			var enddate = data.activity.getEndDate();

			var soaprequest3 = sendSoapData("http://www.dysprostar.com/giphousetest/test.php", "<soapenv:Envelope xmlns:soapenv='http://www.w3.org/2003/05/soap-envelope' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>" +
					"<soapenv:Body>" +
						"<modifyScheduledItem>" +
							"<resource>"+
							"<id>" + data.resource.getId() + "</id>"+
								"<activity>"+
									"<id>" + data.activity.getId() + "</id>"+
									"<displayName>" + data.activity.getTitle() + "</displayName>"+
									"<type>" + data.activity.getType() + "</type>"+
									'<date start="'+data.activity.getStartDate().toGMTString()+'" end="'+data.activity.getEndDate().toGMTString()+'"/>'+
								"</activity>"+
							"</resource>"+
						"</modifyScheduledItem>"+
					"</soapenv:Body>" +
				"</soapenv:Envelope>", processModifiedAct);	
		} 
		else
		{	
			document.getElementById("messages").addClass("notification");
			document.getElementById('messages').innerHTML = "Dit item is gewijzigd door iemand anders, de scheduler wordt herladen.";
			
			document.getElementById('popup').style.display = "block";
			document.getElementById('popup_message').innerHTML = "<p>Dit item is gewijzigd door iemand anders, de scheduler wordt herladen.</p>";
			
			var button = document.createElement('button');
			button.appendChild(document.createTextNode('Ok, sluit dit venster'));
			GiPCordys.Utils.Element.extend(button);
			
			button.addListener('click', function(e)
			{
				document.getElementById('popup').style.display = "none";
			});
			
			document.getElementById('popup_message').appendChild(button);
			
			scheduler.reload();
		}
	};
    
	
	var soaprequest2 = sendSoapData("http://www.dysprostar.com/giphousetest/test.php", "<soapenv:Envelope xmlns:soapenv='http://www.w3.org/2003/05/soap-envelope' xmlns:xsd='http://www.w3.org/2001/XMLSchema' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>" +
						"<soapenv:Body>" +
							"<retrieveModificationDate>" +
								"<activityId>" + data.activity.getId() + "</activityId>" +
							"</retrieveModificationDate>" +
						"</soapenv:Body>" +
					"</soapenv:Envelope>", processModifiedDate
	);*/