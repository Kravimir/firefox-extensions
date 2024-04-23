// ==Web-Extension==
// @author       David "Kravimir" S.
// @license      MIT
// @homepageURL  https://github.com/Kravimir/
// ==/Web-Extension==

try {
	var storage = chrome.storage.local;
	var storageType='ext';
} catch(ex) {
	console.warn('Failed to access local storage.');
}

var isMozGecko=(chrome.runtime.getURL('icons/').indexOf('moz-extension')===0);


var createAdjacentTab=function(tab,options){
	options=options||{switchSide:false};

	var act=function(tab,opts){
    if(!isMozGecko) {
      try {
        chrome.runtime.sendMessage('onkailijjpdkbaoimbhjinpbddnfinlh','{"openingTabInWindow":'+tab.windowId+'}');
      } catch(ex) {}
    }
console.log(tab.index,opts.switchSide)
		if(typeof opts.switchSide == 'boolean' && opts.index === undefined) {
			opts.index=tab.index+(opts.switchSide?-1:1);
			delete opts.switchSide;
		}
		if(!isNaN(opts.index) && opts.index<0) {
			// prevent an index of less than 0
			opts.index=Math.max(opts.index,0);
		}
		if(opts.url === 'copy') {
			opts.url=tab.url;
			if(tab.url === undefined)
				delete opts.url;
		}
console.log(typeof opts.pinned,opts.pinned,typeof tab.pinned,tab.pinned)
		if(opts.pinned === 'copy') {
			opts.pinned=tab.pinned;
		} else if(typeof opts.pinned != 'boolean') {
			delete opts.pinned;
		}
console.log(typeof opts.pinned,opts.pinned,typeof tab.pinned,tab.pinned)
    let props={
      index:tab.index+1,
      openerTabId: tab.id,
      active: true
    };
    if(!isMozGecko) props.url='chrome://newtab';
		chrome.tabs.create(Object.assign(props,opts));
	};

	if(tab != undefined && tab.active) {
		if(storageType==='ext') {
			storage.get(['openLeftSide']).then(function(a){
				if('openLeftSide' in a && a['openLeftSide']===true) {
console.log("openLeftSide",a['openLeftSide'])
					options.switchSide=!options.switchSide;
				}

				act(tab,options);
			});
		} else {
			act(tab,options);
		}
	} else {
		chrome.tabs.query({currentWindow: true, active: true}).then(function(tabs){
			for (let tab of tabs) {
				if(storageType==='ext') {
					storage.get(['openLeftSide']).then(function(a){
						if('openLeftSide' in a && a['openLeftSide']===true) {
console.log("openLeftSide",a['openLeftSide'])
							options.switchSide=!options.switchSide;
						}

						act(tab,options);
					});
				} else {
					act(tab,options);
				}
				break;
			}
		});
	}
};


chrome.action.onClicked.addListener((tab,e) => {
	// Chromium browsers don't provide the second argument at this time

	let switchSide= false;

	if(e !== undefined && (e.button===1 || e.modifiers.length)) {
		switchSide=true;
	}

	if(e) console.log('modifiers',e.modifiers);

	createAdjacentTab(tab,{"switchSide":switchSide});

});

/*
https://stackoverflow.com/questions/58880234/toggle-chrome-extension-icon-based-on-light-or-dark-mode-browser
https://discourse.mozilla.org/t/how-to-detect-the-dark-theme-in-a-webextension/38604
https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon
*/
var iconSwitcher=function(e){


	console.info('iconSwitcher()');

	var themeLuminosity='';

	if(storageType==='ext') {
		storage.get(['themeLuminosity','customColor','customIcon']).then(function(a){
			if('themeLuminosity' in a) {
				themeLuminosity=a['themeLuminosity'];
			} else {
				// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/openOptionsPage
				// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/action
				chrome.action.setPopup({ popup: "options.html" });
				try {
					chrome.action.openPopup();
				} catch(ex){
					console.warn(ex);
					chrome.runtime.openOptionsPage();
				}
			}

			var pickedColor=(themeLuminosity==='dark')?'#f7f7f7':'#111';
			if(themeLuminosity==='custom' && ('customColor' in a)) pickedColor=a['customColor'];
			const dataURI="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m3.572 1c-0.907538 2.548e-4 -2.54542 1.66446-2.572 2.572v27.428h1.5v-25.951c0.0108763-1.1874 1.19032-2.56453 2.365-2.54906h22.27c1.27506 0.037162 2.35991 1.30414 2.36496 2.54906v25.951h1.5v-27.428c0.026061-0.933844-1.66443-2.57174-2.57196-2.572z' fill='%234537FF'/%3E%3Cpath d='m17.6029 4.011 0.0061 10.5207 10.3888 6e-3v3.06668l-10.3888 6e-3 -6e-3 10.3888h-3.06668l-6e-3 -10.3888-10.5282-0.0061-3e-7 -3.06652 10.5282-0.0061 0.08319-10.5206z' fill='%234537ff'/%3E%3C/svg%3E";
			var darkIcons,dataURI2=a['customIcon'];

console.log(themeLuminosity,pickedColor,e?.type);

			if(isMozGecko) {
				//pickedColor=pickedColor!=''?pickedColor:'#F5A028';
				if(pickedColor=='' && themeLuminosity==='light') {
					pickedColor='#000';
				}
				if(pickedColor!='') {
					dataURI2=dataURI.replace(/%23(?:[0-9a-fA-F]{3}){1,2}/g,encodeURIComponent(pickedColor.toLowerCase()));
				}
			}

			if(isMozGecko || (typeof(dataURI2)=='string' && dataURI2.indexOf("data:image/svg+xml,")==-1)) {
				darkIcons={
					"128": dataURI2,
					"16": dataURI2,
					"32": dataURI2,
					"48": dataURI2
				};

				console.info('Switching icons.',darkIcons);

				chrome.action.setIcon({path:darkIcons});
			}


			if(themeLuminosity==='dark' && !isMozGecko) {
				// Chrome/Chromium don't support SVGs for the action icon.
				// https://bugs.chromium.org/p/chromium/issues/detail?id=29683&q=svg%20extension%20icon&can=1
				darkIcons={
					"128": "icons/new-tab-icon128_dark.png",
					"16": "icons/new-tab-icon16_dark.png",
					"32": "icons/new-tab-icon32_dark.png",
					"48": "icons/new-tab-icon48_dark.png"
				};
				console.info('Switching to dark theme icon.',darkIcons);

				chrome.action.setIcon({path:darkIcons});
			}
		});
	} else {
		console.warn('storage access unavailable...');
	}
}

chrome.runtime.onInstalled.addListener(function(){

	try {
		if(chrome.contextMenus && typeof(chrome.contextMenus.create)=='function') {
		// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ACTION_MENU_TOP_LEVEL_LIMIT
			chrome.contextMenus.create({
				contexts: ['action'],
				id: 'newTabAltSide',
				title: 'Open new tab on opposite side',
				visible: true
			});

			chrome.contextMenus.create({
				contexts: ['action'],
				id: 'openURLFromClipboard',
				title: 'Open New Tab From URL in Clipboard',
				enabled: false,
				visible: false
			});

			// would need to request permissions from options page
			/*chrome.permissions.request({'permissions':['activeTab']}).finally(function(){});*/
			chrome.permissions.getAll(function(ar){
				console.info(ar.permissions.join());
				if(ar.permissions.indexOf('activeTab')!=-1) {
					chrome.contextMenus.create({
						contexts: ['action'],
						id: 'duplicateTabURLOnly',
						title: 'Duplicate Tab (Location Only)',
						visible: true
					});
					console.log('Duplicate Tab (Location Only) item added')
				}
				if(ar.permissions.indexOf('clipboardRead')!=-1) {
					chrome.contextMenus.update('openURLFromClipboard',{
						contexts: ['action'],
						title: 'Open New Tab From URL in Clipboard',
						enabled: true,
						visible: true
					});
				}
			});

			chrome.contextMenus.create({
				contexts: ['action'],
				id: 'closeActiveTab',
				title: 'Close Current Tab',
				visible: true
			});

		}
	}catch(ex) {
		console.warn(ex);
	}

	iconSwitcher();
});
chrome.runtime.onStartup.addListener(iconSwitcher);
chrome.runtime.onSuspend.addListener(iconSwitcher);
chrome.runtime.onSuspendCanceled.addListener(iconSwitcher);
chrome.runtime.onMessage.addListener(function(o){
	if(!o || typeof o.action=='undefined') {
		return;
	}
console.log(o)
	switch(o.action) {
	/*
		case 'openFromClipboard':
			createAdjacentTab(null,{url:o.url});
			break;
		*/
		case 'updateIcon':
			iconSwitcher();
			break;
		case 'enableOpenFromClipboard':
			chrome.contextMenus.update('openURLFromClipboard',{
				contexts: ['action'],
				title: 'Open New Tab From URL in Clipboard',
				enabled: true,
				visible: true
			});
			break;
		case 'disableOpenFromClipboard':
			chrome.contextMenus.update('openURLFromClipboard',{
				contexts: ['action'],
				title: 'Open New Tab From URL in Clipboard',
				enabled: false,
				visible: false
			});
			break;
	}

});

/*
chrome?.permissions?.onAdded?.addListener(function(ar){


	console.log('permission added',ar.permissions)
	if(ar.permissions.indexOf('activeTab')!=-1) {
		chrome.contextMenus.create({
			contexts: ['action'],//,'page_action'
			id: 'duplicateTabURLOnly',
			title: 'Duplicate Tab (Location Only)',
			visible: true
		});
	}
});*/


var incognitoTab=async function(tab){
	if(tab.tabId) {
		tab=await chrome.tabs.get(tab.tabId);
	}

	try {
		var storage = chrome.storage.local;
		var storageType='ext';
	} catch(ex) {
		console.warn('Failed to access local storage.');
	}
	var themeLuminosity='';

	if(tab.incognito && storageType==='ext') {
		storage.get('themeLuminosity').then(function(a){
			if('themeLuminosity' in a) themeLuminosity=a['themeLuminosity'];

			if(themeLuminosity==='dark' || themeLuminosity==='auto' || themeLuminosity==='custom') {
				if(tab.tabs){
					tab=tab.tabs[0];
				}
				var icons={
				 "16": "icons/new-tab-icon16_opera.png",
				 "32": "icons/new-tab-icon32_opera.png",
				 "48": "icons/new-tab-icon48_opera.png",
				 "128": "icons/new-tab-icon128_opera.png"
				};
				console.info('Switching to alternate icon for incognito window.',icons);

				try {
					chrome.action.setIcon({path:icons,tabId:tab.id});
				} catch(ex) {}
			}
		});
	}
};

try {
	var ua=navigator.userAgent.toLowerCase();
	console.log(ua);
	if(ua.indexOf('chrome/')!=-1 && ua.indexOf('opr/')!=-1) {

		chrome.tabs.onActivated.addListener(incognitoTab);
		chrome.tabs.onUpdated.addListener(incognitoTab);
		chrome.tabs.onCreated.addListener(incognitoTab);
	}
} catch(ex) {}


chrome.tabs.onCreated.addListener(function(tabInfo){

	if(tabInfo.index > 0 ) return;

	chrome.windows.get(tabInfo.windowId,function(window2){

		if(typeof window2 != 'undefined' && window2.type!= "normal"){
			console.warn(window2.type, window2?.tabs?.length, window2?.tabs?.length>0?window2?.tabs[0]:null);

			chrome.action.disable(tabInfo.id);
		}
	});

});


try {

	var execCommand=function(cmd,tab){
		console.log(`Command "${cmd}" triggered`);
		switch(cmd) {
			case 'newTabAltSide':
				createAdjacentTab(tab,{switchSide:true});
			break;
			case 'duplicateTabURLOnly':
				createAdjacentTab(tab,{url:'copy',pinned:'copy'});
			break;
			case 'openURLFromClipboard':
				storage.set({'openingFromClipboard':true});
				createAdjacentTab(tab,{url:chrome.runtime.getURL("clipboard-redirect.html")});
				break;
			case 'closeActiveTab':
				var re=/^(?:chrome|edge|opera|about|moz)(?:-extension)?\:\/*|\:\/*(?:newtab|startpage)/;
				var closeIt=function(tab){
					console.log(tab.url);

          if(!isMozGecko) {
            try {
              chrome.runtime.sendMessage('onkailijjpdkbaoimbhjinpbddnfinlh','{"closingTabFromWindow":'+tab.windowId+'}');
            } catch(ex) {}
          }

					if(re.test(tab.url)) {
						chrome.tabs.remove(tab.id).catch((ex)=> {
							chrome.tabs.update(
								tab.id,
								{url:'about:blank'}
							).then(()=>{
								console.warn(tab.url.indexOf('newtab')!==-1?'new tab page found.':'privileged tab found');
								setTimeout(()=>chrome.tabs.remove(tab.id),50);
							});
						});
					} else {
						chrome.tabs.remove(tab.id);
					}
				};
				if(tab != undefined && tab.active) {
					closeIt(tab);
				} else {
					chrome.tabs.query({currentWindow: true, active: true}).then(function(tabs){
						for (let tab of tabs) {
							closeIt(tab);
							break;
						}
					});
				}
			break;
		}
	};


	if(chrome.contextMenus && typeof(chrome.contextMenus.create)=='function') {

		chrome.contextMenus.onClicked.addListener(function(info,tab){
			if(info === undefined) return;
			execCommand(info.menuItemId,tab);
		});
	}
	if(chrome.commands && chrome.commands.onCommand) {
		chrome.commands.onCommand.addListener(execCommand);
	}
}catch(ex) {
	console.warn(ex);
}

