/**
 * Facebook Firefox Toolbar Software License 
 * Copyright (c) 2007 Facebook, Inc. 
 *
 * Permission is hereby granted, free of charge, to any person or organization
 * obtaining a copy of the software and accompanying documentation covered by
 * this license (which, together with any graphical images included with such
 * software, are collectively referred to below as the "Software") to (a) use,
 * reproduce, display, distribute, execute, and transmit the Software, (b)
 * prepare derivative works of the Software (excluding any graphical images
 * included with the Software, which may not be modified or altered), and (c)
 * permit third-parties to whom the Software is furnished to do so, all
 * subject to the following:
 *
 * The copyright notices in the Software and this entire statement, including
 * the above license grant, this restriction and the following disclaimer,
 * must be included in all copies of the Software, in whole or in part, and
 * all derivative works of the Software, unless such copies or derivative
 * works are solely in the form of machine-executable object code generated by
 * a source language processor.  
 *
 * Facebook, Inc. retains ownership of the Software and all associated
 * intellectual property rights.  All rights not expressly granted in this
 * license are reserved by Facebook, Inc.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
 * FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

// Note that this file is intended for login-related API function calls only
// (ie facebook.auth.*).  Other API calls go through the Facebook xpcom service.
var Cc = Components.classes;
var Ci = Components.interfaces;

// Load MD5 code...
Cc['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Ci.mozIJSSubScriptLoader)
    .loadSubScript('chrome://facebook/content/md5.js');

function FacebookLoginClient() {
    this.fbSvc = Cc['@facebook.com/facebook-service;1'].getService().QueryInterface(Ci.fbIFacebookService);
}

FacebookLoginClient.prototype = {
    findNamespace: /xmlns=(?:"[^"]*"|'[^']*')/,
    generateSig: function (params) {
        var str = '';
        params.sort();
        for (var i = 0; i < params.length; i++) {
            str += params[i];
        }
        str += this.fbSvc.secret;
        return MD5(str);
    },
    callMethod: function (method, params, callback) {
        params.push('method=' + method);
        params.push('api_key=' + this.fbSvc.apiKey);
        params.push('v=1.0');
        params.push('sig=' + this.generateSig(params));
        var req = new XMLHttpRequest();
        var ns_re = this.findNamespace;
        req.onreadystatechange = function (event) {
            if (req.readyState == 4) {
                var status;
                try {
                    status = req.status;
                } catch (e) {
                    status = 0;
                }

                if (status == 200) {
                    dump( 'login:' + req.responseText.indexOf("\n") + "\n" );
                    req.text = req.responseText.substr(req.responseText.indexOf("\n"));
                    var ns = req.text.match(ns_re);
                    if (ns)
                      default xml namespace = ns;
                    req.xmldata = new XML(req.text);
                    callback(req);
                }
            }
        };
        try {
            var restserver = 'https://api.facebook.com/restserver.php';
            req.open('POST', restserver, true);
            req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            req.send(params.join('&'));
            dump( params.join('&') + "\n" );
        } catch (e) {
            dump('Exception sending REST request: ' + e + '\n');
        }
    }
};

dump('loaded facebook.js\n');
