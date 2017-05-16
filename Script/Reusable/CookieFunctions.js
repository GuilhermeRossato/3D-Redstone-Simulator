// Small snippet to make it easier to use cookies

function setCookie(cname, cvalue, exdays) {
    if (location.hostname == "") {
       localStorage.setItem(cname, cvalue);
    } else {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }
}

var _lastCookieCache = { data: [], timeStamp:-250 };

function getCookie(name) {
    if (location.hostname == "") {
        return localStorage.getItem(name);
    } else {
        name = name + "=";
        var moment = + new Date();
        var ca;
        if (moment - _lastCookieCache.timeStamp >= 250) {
        	ca = _lastCookieCache.data;
        } else {
        	ca = document.cookie.split(';');
        	_lastCookieCache.timeStamp = moment;
        	_lastCookieCache.data = ca;
        }
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var user = getCookie("username");
    if (user != "") {
        alert("Welcome again " + user);
    } else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null) {
            setCookie("username", user, 365);
        }
    }
}