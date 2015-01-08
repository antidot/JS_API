/*! Antidot javascript - V0.1 - 2014-12-09
*/

var Antidot = function () {
    this._version = "V0.1";
};

Antidot.ACP = function (options) {
    if (options == undefined) {
        options = {
        };
    }
    this.serviceID = options.serviceID || 0;
    this.serviceStatus = options.serviceStatus;
    this.domain = options.domain;
    this.language = options.language;
    
    this.siteOrigin = options.siteOrigin;
    this.timeOut = options.timeOut || 1500;
    
    this.maxResults = options.maxResults || 10;
    this.minLength = options.minLength || 1;
    
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.api_key = options.api_key;
    
    this.options = options.extraParams || {};
    
    
    this.async = true;
    this.acpURL = options.domain + '/acp';
    
    //acp.listenTextField('#autocomplete', callbacks);
    this.listenTextField = function (selector, callbacks) {
        //console.log("fieldSelector : " + this.serviceID)
        jQuery(selector).bind("keyup", {callbacks:callbacks} , function( event ) {
            //var res = ajaxGet(event.data.o, this.value, event.data.callbacks);
            var res = acp.getSuggestions(this.value, event.data.callbacks);
            //console.log(res);
        });
    }
    //acp.getSuggestions('t', callbacks);
    this.getSuggestions = function (searchStr, callbacks) {
        //console.log("getSuggestion : " + this.serviceStatus);
        return ajaxGet( searchStr, callbacks);
    }
    
    function ajaxGet(searchStr, callbacks) {
        var dataResJson;
        var urlParam = {"afs:service": this.acp.serviceID, 
                    "afs:status": this.acp.serviceStatus, 
                    "afs:sessionId": this.acp.sessionId, 
                    "afs:userId": this.acp.userId,
                    "afs:key": this.acp.api_key,
                    "afs:query": searchStr, 
                    "afs:lang=":this.acp.language, 
                    "siteOrigin":this.acp.siteOrigin, 
                    "afs:replies":this.acp.maxResults};
        
        if(this.acp.options != undefined){
            for (key in this.acp.options) {
                urlParam[key]=this.acp.options[key];
            }
        }
        
        if(searchStr.length>=this.acp.minLength){
            var request = jQuery.ajax({
                url: this.acp.acpURL,
                type: "GET",
                timeout:this.acp.timeOut,
                async:this.acp.async,
                data: urlParam,
                success: function (result) {
                    var feeds =[];
                    var jsonRes =[];
                    var queryText="";
                    //console.log("getSuggestion success : " + result);
                    if(result[0] != undefined ){
                        queryText=result[0];
                        feeds.push(readFeedFromAcpOutput(undefined, result[1], result[2]));
                    } else {
                        for (key in result) {
                            queryText=result[key][0];
                            var tmpObj = readFeedFromAcpOutput(key, result[key][1], result[key][2]);
                            
                            //console.log("getSuggestion success key : " + key);
                            feeds.push(tmpObj);
                        }
                    }
                    jsonRes.push({query:queryText,feeds:feeds})
                    dataResJson = jsonRes;
                    if(callbacks != undefined && callbacks.onSuccess != undefined){
                        callbacks.onSuccess(jsonRes);
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    if(textStatus == "timeout"){
                        if(callbacks != undefined && callbacks.onTimeOut != undefined){
                            callbacks.onTimeOut(xhr, textStatus, errorThrown);
                        }
                    } else {
                        if(callbacks != undefined && callbacks.onError != undefined){
                            callbacks.onError(xhr, textStatus, errorThrown);
                        }
                    }
                    //console.log("getSuggestion error : " + textStatus + " - xhr " + xhr);
                },
                async: false
            });
        }
        
        return dataResJson;
    }
    
    function readFeedFromAcpOutput(feedKey, vals, attribut) {
        var jsonValue =[];
        
        if (attribut != undefined) {
            for (i = 0; i < vals.length; i++) {
                jsonValue.push({
                    reply: vals[i],
                    metadata: attribut[i]
                });
            }
        } else {
            jsonValue = vals;
        }
        
        var jsonObj = {}
        
        if(feedKey != undefined){
            jsonObj = {
                name: feedKey,
                replies: jsonValue
            };
        } else {
            jsonObj = {
                replies: jsonValue
            };
        }
        
        return jsonObj;
    }
}

Antidot.getVersion = function () {
    var a = new Antidot();
    console.log("getVersion : " + a._version);
    return a._version;
}