/*! Antidot javascript - V1.0 - 2015-03-02
*/

var _AntidotGlobalParam={};

var Antidot = function () {
    this._version = "V1.0";
};

Antidot.ACP = function (options) {
    if (options == undefined) {
        options = {
        };
    }
    this.serviceId = options.serviceId || 0;
    this.serviceStatus = options.serviceStatus;
    this.domain = options.domain;
    this.language = options.language;
    
    this.feeds = options.feeds;
    this.timeOut = options.timeOut || 1500;
    
    this.maxResults = options.maxResults;
    this.minLength = options.minLength || 1;
    
    this.sessionId = options.sessionId;
    this.userId = options.userId;
    this.key = options.key;
    
    this.siteOrigin = options.siteOrigin;
    
    this.disableTraceEmptyQueries = options.disableTraceEmptyQueries || false;
    
    this.options = options.extraParams || {
    };
    
    this.async = false;
    this.acpURL = options.domain + '/acp';
    
    //*****************************************************************
    //Init global var to get general param.
    _AntidotGlobalParam["siteOrigin"]=this.siteOrigin;
    _AntidotGlobalParam["serviceId"]=this.serviceId;
    _AntidotGlobalParam["serviceStatus"]=this.serviceStatus;
    _AntidotGlobalParam["domain"]=this.domain;
    _AntidotGlobalParam["key"]=this.key;
    _AntidotGlobalParam["sessionId"]=this.sessionId;
    _AntidotGlobalParam["userId"]=this.userId;
    //*****************************************************************
    
    //acp.listenTextField('#autocomplete', callbacks);
    this.listenTextField = function (selector, callbacks) {
        //console.log("fieldSelector : " + this.serviceId)
        jQuery(selector).bind("keyup", { callbacks: callbacks },
        function (event) {
            //var res = ajaxGet(event.data.o, this.value, event.data.callbacks);
            var res = acp.getSuggestions(this.value, event.data.callbacks);
            //console.log(res);
        });
    }
    //acp.getSuggestions('t', callbacks);
    this.getSuggestions = function (searchStr, callbacks) {
        //console.log("getSuggestion : " + this.serviceStatus);
        var dataResJson = ajaxGet(searchStr, callbacks);
        return dataResJson;
    }
    
    function ajaxGet(searchStr, callbacks) {
        var dataResJson;
        var urlParam = {
            "afs:service": this.acp.serviceId,
            "afs:key": this.acp.key,
            "afs:query": searchStr,
            "afs:lang": this.acp.language
        };
        
        if (this.acp.maxResults != undefined) {
            urlParam[ "afs:replies"] = this.acp.maxResults;
        }
        
        if (this.acp.serviceStatus != undefined) {
            urlParam[ "afs:status"] = this.acp.serviceStatus;
        }
        
        if (this.acp.sessionId != undefined) {
            urlParam[ "afs:sessionId"] = this.acp.sessionId;
        }
        
        if (this.acp.userId != undefined) {
            urlParam[ "afs:userId"] = this.acp.userId;
        }
        
        if (this.acp.options != undefined) {
            for (key in this.acp.options) {
                urlParam[key] = this.acp.options[key];
            }
        }
        
        var urlCall = this.acp.acpURL + "?";
        
        if (this.acp.feeds != undefined) {
            var strFeeds = "";
            for (key in this.acp.feeds) {
                if (key == 0) {
                    urlCall = urlCall + "afs:feed=" + this.acp.feeds[key];
                } else {
                    urlCall = urlCall + "&afs:feed="  + this.acp.feeds[key];
                }
            }
        }
        
        if (this.acp.minLength != undefined && searchStr.length >= this.acp.minLength) {
            try {
                if (window.XDomainRequest) {
                
                    var urlIE = urlCall + "&";
                    
                    for(key in urlParam){
                        var urlValue = urlParam[key];
                        urlIE = urlIE +key+"="+urlValue+"&";
                    }
                    
                    var xdr = new XDomainRequest();
                    xdr.open("get", urlIE);
                    xdr.onprogress = function () {
                    };
                    xdr.ontimeout = function (e) {
                        callbacks.onTimeOut(xdr, xdr.responseText, e);
                    };
                    xdr.onerror = function (e) {
                        callbacks.onError(xdr, xdr.responseText, e);
                    };
                    
                    xdr.onload = function () {
                        var result = jQuery.parseJSON(xdr.responseText);
                        dataResJson = callbackSuccesAcpRequest(result, callbacks);
                    }
                    
                    xdr.send();
                } else {
                    var request = jQuery.ajax({
                        url: urlCall,
                        type: "GET",
                        timeout: this.acp.timeOut,
                        async: this.acp.async,
                        data: urlParam,
                        crossDomain: true,
                        success: function (result) {
                            dataResJson = callbackSuccesAcpRequest(result, callbacks);
                        },
                        error: function (xhr, textStatus, errorThrown) {
                            if (textStatus == "timeout") {
                                if (callbacks != undefined && callbacks.onTimeOut != undefined) {
                                    callbacks.onTimeOut(xhr, textStatus, errorThrown);
                                }
                            } else {
                                if (callbacks != undefined && callbacks.onError != undefined) {
                                    callbacks.onError(xhr, textStatus, errorThrown);
                                }
                            }
                            //console.log("getSuggestion error : " + textStatus + " - xhr " + xhr);
                        }
                    });
                }
            } catch (err) {
                callbacks.onError(err);
            }
        }
        
        return dataResJson;
    }
    
    function callbackSuccesAcpRequest(result, callbacks){
        
        var jsonRes =[];
        //console.log("getSuggestion success : " + result);
        if(result.query != undefined){
            jsonRes.push(result);
        } else {
            var feeds =[];
            var queryText="";
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
            jsonRes.push({query:queryText,feeds:feeds});
        }
        
        
        var isResEmpty = ctrlEmptyResult(jsonRes);
        //console.log("Suggestion response is empty : " + isResEmpty);
        if(!this.acp.disableTraceEmptyQueries && isResEmpty){
            if(jsonRes[0] != undefined){
                Antidot.trace(jsonRes[0].query, "Emptyqueries");
            } else {
                Antidot.trace("", "Emptyqueries");
            }
        }
        
        if(callbacks != undefined && callbacks.onSuccess != undefined){
            callbacks.onSuccess(jsonRes);
        }
        return jsonRes;
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
        
        var jsonObj = {
        }
        
        if (feedKey != undefined) {
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

    function ctrlEmptyResult(dataResJson){
        var isEmpty=false;
        if(dataResJson != undefined && dataResJson.length > 0){
            if(dataResJson[0].feeds != undefined && dataResJson[0].feeds.length > 0){
                for (feed in dataResJson[0].feeds) {
                    var feed = dataResJson[0].feeds[feed];
                    if(feed != undefined && feed.replies.length > 0){
                        return false;
                    } else {
                        isEmpty=true;
                    }
                }
            } else {
                isEmpty=true;
            }
        } else {
            isEmpty=true;
        }
        
        return isEmpty;
    }

}

Antidot.getVersion = function () {
    var a = new Antidot();
    //console.log("getVersion : " + a._version);
    return a._version;
}

Antidot.ajaxCall = function (urlCall, urlParam) {
    try {
        if (window.XDomainRequest) {
        
            var urlIE = urlCall;
            for(key in urlParam){
                var urlValue = urlParam[key];
                urlIE = urlIE +key+"="+urlValue+"&";
            }
            
            var xdr = new XDomainRequest();
            xdr.open("get", urlIE);
            xdr.onprogress = function () {
            };
            xdr.ontimeout = function (e) {
                //console.log("ajaxcall timeout");
            };
            xdr.onerror = function (e) {
                //console.log("ajaxcall error ");
            };
            
            xdr.onload = function () {
                //console.log("ajaxcall success");
            }
            
            xdr.send();
        } else {
            var request = jQuery.ajax({
                url: urlCall,
                type: "GET",
                async: true,
                data: urlParam,
                crossDomain: true,
                success: function (result) {
                    //console.log("ajaxcall success");
                },
                error: function (xhr, textStatus, errorThrown) {
                    //console.log("ajaxcall error : " + textStatus + " - xhr " + xhr);
                }
            });
        }
    } catch (err) {
        callbacks.onError(err);
    }
}


// feed doit prend les valeurs suivante : Lastqueries ou Emptyqueries
Antidot.trace = function(query, feed, options) {
    var urlParam = {
            "afs:service": _AntidotGlobalParam.serviceId,
            "afs:key": _AntidotGlobalParam.key,
            "afs:query": query,
            "afs:feed":feed
        };
        
    if (_AntidotGlobalParam.serviceStatus != undefined) {
        urlParam[ "afs:status"] = _AntidotGlobalParam.serviceStatus;
    }
    
    if (_AntidotGlobalParam.sessionId != undefined) {
        urlParam[ "afs:sessionId"] = _AntidotGlobalParam.sessionId;
    }
    
    if (_AntidotGlobalParam.userId != undefined) {
        urlParam[ "afs:userId"] = _AntidotGlobalParam.userId;
    }
    
    if (_AntidotGlobalParam.siteOrigin != undefined) {
        urlParam[ "siteOrigin"] = _AntidotGlobalParam.siteOrigin;
    }
    
    if (window.location.host != undefined) {
         urlParam[ "host"] = window.location.host;
    }
    
    if (options != undefined) {
        for (key in options) {
            urlParam[key] = options[key];
        }
    }
    
    var urlCall = _AntidotGlobalParam.domain + "/search?";
    Antidot.ajaxCall(urlCall, urlParam);
}

Antidot.click = function(target, options) {
    var label="";
    var urlParam = {
            "afs:service": _AntidotGlobalParam.serviceId,
            "afs:key": _AntidotGlobalParam.key,
            "afs:action": "log",
            "afs:target":target
        };
        
    if (_AntidotGlobalParam.serviceStatus != undefined) {
        urlParam[ "afs:status"] = _AntidotGlobalParam.serviceStatus;
    }
    
    if (_AntidotGlobalParam.sessionId != undefined) {
        urlParam[ "afs:sessionId"] = _AntidotGlobalParam.sessionId;
    }
    
    if (_AntidotGlobalParam.userId != undefined) {
        urlParam[ "afs:userId"] = _AntidotGlobalParam.userId;
    }
    
    if (_AntidotGlobalParam.siteOrigin != undefined) {
        label = label + 'siteOrigin:' + _AntidotGlobalParam.siteOrigin + ';';
    }
    
    if (window.location.host != undefined) {
        label = label + 'host:' + window.location.host + ';';
    }
    
    if (options != undefined) {
        for (key in options) {
            label = label + key + ':' + options[key] + ';';
        }
    }
    
    urlParam[ "afs:label"] = label;
    
    var urlCall = _AntidotGlobalParam.domain + "/click?";
    Antidot.ajaxCall(urlCall, urlParam);
}

Antidot.traceAndClick = function(inputQuery,selectedValue, options) {
    Antidot.trace(inputQuery, "Lastqueries", options);
    Antidot.click(selectedValue, options);
}



