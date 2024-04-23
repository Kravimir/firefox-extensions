// ==Web-Extension==
// @author       David "Kravimir" S.
// @license      MIT
// @homepageURL  https://github.com/Kravimir/
// ==/Web-Extension==

try {
	var storage = chrome.storage.local;
	var storageType='ext';
} catch(ex) {
	console.warn('failed to access local storage.');
}

//console.log('window.isSecureContext',window.isSecureContext)

if(storageType==='ext') {
	// https://example.org/
	storage.get('openingFromClipboard').then(function(a){
		if('openingFromClipboard' in a) {
			let dE = document.documentElement;
			dE.tabIndex=-1;

			let fn=function(e){
				navigator.clipboard.readText().then(function(txt){
					txt=txt.trim();

					storage.set({'openingFromClipboard':false});
					try {
						console.log('setting location.href','"'+txt+'"');
						location.href=txt;
					} catch(ex) {
						console.warn(ex);
						var d=document,
							par=d.querySelector('#status'),
							p=d.createElement('p');
						p.className="error";
						p.innerText = 'Not a valid URL.\n'+ex;
						par.insertBefore(p,par.firstChild);
					}
				});
				if(e.type != 'none') dE.removeEventListener('focus',fn,true);
			};
			dE.addEventListener('focus',fn,true);
			dE.focus();
			try {
				fn({type:'none'});
			} catch(ex) {
				console.warn(ex);
			}
		}
	});
}

// maybe should add a backup button to trigger the clipboard read and tab open?

