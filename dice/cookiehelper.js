/* 
 * Source: http://www.w3schools.com/js/js_cookies.asp
 */

//Set cookie with given name to given value with a expirydate exdays in the future (or past).
// if exdays not given, sets a session cookie
function setCookie(c_name,value,exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
}

// Get cookie with given name, if cookie does not exist return a default_value.
function getCookie(c_name, default_value)
{
var c_value = document.cookie;
var c_start = c_value.indexOf(" " + c_name + "=");
if (c_start == -1)
  {
  c_start = c_value.indexOf(c_name + "=");
  }
if (c_start == -1)
  {
  c_value = default_value;
  }
else
  {
  c_start = c_value.indexOf("=", c_start) + 1;
  var c_end = c_value.indexOf(";", c_start);
  if (c_end == -1)
  {
c_end = c_value.length;
}
c_value = unescape(c_value.substring(c_start,c_end));
}
return c_value;
}

// Delete cookie with given name
function deleteCookie(c_name)
{
    setCookie(c_name,null,-1);
}