// ==Web-Extension==
// @author       David "Kravimir" S.
// @license      MIT
// @homepageURL  https://github.com/Kravimir/
// ==/Web-Extension==

var isMozGecko=(chrome.runtime.getURL('icons/').indexOf('moz-extension')===0);

chrome.action.onClicked.addListener(() => {
	var re=/^(?:chrome|edge|opera|about|moz)(?:-extension)?\:\/*|\:\/*(?:newtab|startpage)/;
	chrome.tabs.query({currentWindow: true, active: true}).then(function(tabs){
		for (let tab of tabs) {
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
		}
	});

	console.log(JSON.stringify(chrome.runtime.getManifest()["web_accessible_resources"]));

	chrome.action.getBadgeBackgroundColor({}).then((color)=>{
	  console.log('BadgeBackgroundColor',Array.from(color).join(','));
	}, (error)=>{
	  console.warn(error);
	});
});

/*
https://stackoverflow.com/questions/58880234/toggle-chrome-extension-icon-based-on-light-or-dark-mode-browser
https://discourse.mozilla.org/t/how-to-detect-the-dark-theme-in-a-webextension/38604
https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction/setIcon
*/
var iconSwitcher=function(e){
	try {
		var storage = chrome.storage.local;
		var storageType='ext';
	} catch(ex) {
		console.warn('Failed to access local storage.');
	}

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
					chrome.runtime.openOptionsPage();
				}
			}

			var pickedColor=(themeLuminosity==='dark')?'#f7f7f7':'#111';
			if(themeLuminosity==='custom' && ('customColor' in a)) pickedColor=a['customColor'];
			const dataURI="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6.61595 25.6574-1.11595-1.13299 8.1196-8.12901-8.0179-8.0272 2.36818-2.36818 8.0272 8.0179 8.0272-8.0179 2.36818 2.36818-8.0179 8.0272 8.12545 8.13486-2.36806 2.36806-8.13487-8.12545-4.0134 4.00875c-2.20737 2.20482-4.06703 4.00875-4.13259 4.00875-0.065556 0-0.621369-0.509841-1.23514-1.13299z' fill='%23fff'/%3E%3Cpath d='m3.572 1c-0.907538 2.548e-4 -2.54542 1.66446-2.572 2.572v27.428h1.5v-25.951c0.0108763-1.1874 1.19032-2.56453 2.365-2.54906h22.27c1.27506 0.037162 2.35991 1.30414 2.36496 2.54906v25.951h1.5v-27.428c0.026061-0.933844-1.66443-2.57174-2.57196-2.572z' fill='%23fff'/%3E%3C/svg%3E";
			var darkIcons,dataURI2=a['customIcon'];// width='32' height='32'

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

			// Only Mozilla-based browsers support SVG for extension icons.
			if(isMozGecko || (typeof(dataURI2)=='string' && dataURI2.indexOf("data:image/svg+xml,")==-1)) {
				darkIcons={
					"128": dataURI2,
					"16": dataURI2,
					"32": dataURI2,
					"48": dataURI2
				};

				console.info('Switching to SVG icon.',darkIcons);

				chrome.action.setIcon({path:darkIcons});
			}


			if(themeLuminosity==='dark' && !isMozGecko) {
				// Chrome/Chromium don't support SVGs for the action icon.
				// https://bugs.chromium.org/p/chromium/issues/detail?id=29683&q=svg%20extension%20icon&can=1
				darkIcons={
					"128": "icons/icon128_dark.png",
					"16": "icons/icon16_dark.png",
					"32": "icons/icon32_dark.png",
					"48": "icons/icon48_dark.png"
				};
				console.info('Switching to dark theme icon.',darkIcons);

				chrome.action.setIcon({path:darkIcons});
			}
		});
	} else {
		console.warn('storage access unavailable...');
	}
};

chrome.runtime.onInstalled.addListener(function(){

	try {
		if(chrome.contextMenus && typeof(chrome.contextMenus.create)=='function') {
		// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/menus/ACTION_MENU_TOP_LEVEL_LIMIT
			chrome.contextMenus.create({
				contexts: ['action'],
				id: 'newTab',
				title: 'Open new tab',
				visible: true
			});
			chrome.contextMenus.create({
				contexts: ['action'],
				id: 'newTabAltSide',
				title: 'Open new tab on opposite side',
				visible: true
			});

			// would need to request permissions from options page
			/*chrome.permissions.request({'permissions':['activeTab']}).finally(function(){*/
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
chrome.runtime.onMessage.addListener(iconSwitcher);


try {
	var ua=navigator.userAgent.toLowerCase();
	console.log(ua);
	if(ua.indexOf('chrome/')!=-1 && ua.indexOf('opr/')!=-1) {
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
						 "128": "icons/icon128_opera.png",
						 "16": "icons/icon16_opera.png",
						 "32": "icons/icon32_opera.png",
						 "48": "icons/icon48_opera.png"
						};
						console.info('Switching to alternate icon for incognito window.',icons);

						try {
							chrome.action.setIcon({path:icons,tabId:tab.id});
						} catch(ex) {}
					}
				});
			}
		};


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

	var execCommand=function(cmd){
		console.log(`Command "${cmd}" triggered`);
		switch(cmd) {
			case 'newTab':
				createAdjacentTab({indexOffset:1});
			break;
			case 'newTabAltSide':
				createAdjacentTab({indexOffset:0});
			break;
			case 'duplicateTabURLOnly':
				createAdjacentTab({url:'copy',pinned:'copy'});
			break;
		}
	};

	var createAdjacentTab=function(options){
		options=options||{indexOffset:1};
		chrome.tabs.query({currentWindow: true, active: true}).then(function(tabs){
			for (let tab of tabs) {
				if(!isMozGecko) {
					try {
						chrome.runtime.sendMessage('onkailijjpdkbaoimbhjinpbddnfinlh','{"openingTabInWindow":'+tab.windowId+'}');
					} catch(ex) {}
				}

				if(typeof options.indexOffset == 'number' && options.index === undefined) {
					options.index=tab.index+options.indexOffset;
					delete options.indexOffset;
				}
				if(options.url === 'copy') {
					options.url=tab.url;
					if(tab.url === undefined)
						delete options.url;
				}
console.log(typeof options.pinned,options.pinned,typeof tab.pinned,tab.pinned)
				if(typeof options.pinned === 'copy') {
					options.pinned=tab.pinned;
				} else if(typeof options.pinned != 'boolean') {
					delete options.pinned;
				}
console.log(typeof options.pinned,options.pinned,typeof tab.pinned,tab.pinned)
				let props={
					index:tab.index+1,
					openerTabId: tab.id,
					active: true
				};
				// Mozilla-based browsers default to the new tab page if the "url" property is not inlcuded,
				// but Chromium-based browsers need the URL set. 
				if(!isMozGecko) props.url='chrome://newtab';
				chrome.tabs.create(Object.assign(props,options));
				break;
			}
		});
	};


	if(chrome.contextMenus && typeof(chrome.contextMenus.create)=='function') {
		chrome.contextMenus.onClicked.addListener(function(info){
			if(info === undefined) return;
			execCommand(info.menuItemId);
		});

	}
	if(chrome.commands && chrome.commands.onCommand) {
		chrome.commands.onCommand.addListener(execCommand);
	}
}catch(ex) {
	console.warn(ex);
}

