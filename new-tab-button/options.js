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

var isMozGecko=(chrome.runtime.getURL('icons/').indexOf('moz-extension')===0);


var successFn=function(par){
	var d=document, p;
	if(par===undefined) par = d.querySelector('#status');
	p=par.querySelector('.changeSaved');
	if(p) par.removeChild(p);
	p=d.createElement('p');
	p.className="changeSaved hideMsg";
	p.innerHTML = '<i class="checkmark"></i> Options Saved';
	par.insertBefore(p,par.firstChild);
	var fn=()=>{
		var el=par.querySelector('.changeSaved');
		if(el) el.classList.toggle('hideMsg');
	};
	setTimeout(fn,1);
	setTimeout(fn,2001);
};

var themeChange=function(e){
console.log(e.type)
	if(e.type=='submit') e.preventDefault();

	var d=document;

	var val=d.querySelector('#themeLuminosity').value,
		val2=d.querySelector('#customColor').value;

	if(storageType==='ext') {
		if(val!="") storage.set({'themeLuminosity':val});
		if(val2==="" || /^#?[0-9a-fA-F]{0,6}$/.test(val2)) {
			if(val2.charAt(0)!=='#') val2='#'+val2;
			storage.set({'customColor':val2});
		}
	}

	if(e.currentTarget.id=='customColor') {
		d.querySelector('#themeLuminosity').value='custom';
	}

	var pickedColor=(themeLuminosity==='dark')?'#f7f7f7':'#111';
	if(val==='custom') pickedColor=val2;
	var darkIcons,dataURI2;
	const dataURI="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m3.572 1c-0.907538 2.548e-4 -2.54542 1.66446-2.572 2.572v27.428h1.5v-25.951c0.0108763-1.1874 1.19032-2.56453 2.365-2.54906h22.27c1.27506 0.037162 2.35991 1.30414 2.36496 2.54906v25.951h1.5v-27.428c0.026061-0.933844-1.66443-2.57174-2.57196-2.572z' fill='%234537FF'/%3E%3Cpath d='m17.4696 5.011 0.0056 9.64571 9.52478 0.0055v2.81163l-9.52478 0.0055-0.0055 9.52478h-2.81163l-0.0055-9.52478-9.65259-0.0056-3e-7 -2.81148 9.65259-0.0056 0.07627-9.64562z' fill='%234537ff'/%3E%3C/svg%3E";

	if(pickedColor=='' && themeLuminosity==='light') {
		pickedColor='#000';
	}
	if(pickedColor!='') {
		dataURI2=dataURI.replace(/%23(?:[0-9a-fA-F]{3}){1,2}/g,encodeURIComponent(pickedColor.toLowerCase()));
	}
console.log(!isMozGecko?'not moz':'',val);
	if(!isMozGecko && val==='custom') {
		loadImageAsPNG(dataURI2,16,16).then(function(dataURI3){
	console.info(dataURI2,dataURI3);
			dataURI2=dataURI3;
			storage.set({'customIcon':dataURI3});
		});
	}

	// Opera icon color #fa192c

	chrome.runtime.sendMessage({action: 'updateIcon'}).then(function(message){

	},function(error) {
		console.warn(`Error: ${error}`);
	});

	let rightRad=d.querySelector('[name="whichSide"][value="right"]');
	let leftRad=d.querySelector('[name="whichSide"][value="left"]');
	if((rightRad.defaultChecked != rightRad.checked) || (leftRad.defaultChecked != leftRad.checked)) {
		chrome.permissions.request({'permissions':['management']}).then(function(){

			chrome.management.getSelf().then(function(info){
				info.name='New Tab ('+
					(rightRad.checked?'after':'before')+
					' active one) Button';

				chrome.management.getSelf().then(function(info2){
		console.log(info.name,'||',info2.name);
				});
			});
		});
	}

	if(storageType==='ext') {
		storage.set({'openLeftSide':leftRad.checked});
	}


	chrome.action.setPopup({ popup: '' });

	successFn();

	if(e.type==='submit') {
		setTimeout(()=>{window.close();},500);
	}
};

document.querySelector('form').addEventListener('submit',themeChange);
document.querySelector('#themeLuminosity').addEventListener('change',themeChange);
document.querySelector('#customColor').addEventListener('change',themeChange);
document.querySelector('#customColor').addEventListener('input',themeChange);


var loadImageAsPNG=function(url, height, width) {
	// https://www.horuskol.net/blog/2020-08-31/convert-svg-images-in-the-browser-using-javascript-and-the-canvas-api/
	// https://stackoverflow.com/questions/60614740/how-to-convert-svg-in-html-to-png
	// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
	return new Promise((resolve, reject) => {
		let srcImg = new Image();

		srcImg.onload = () => {
			let cnv = document.createElement('canvas'); // doesn't actually create an element until it's appended to a parent,
										                              // so will be discarded once this function has done it's job

			// Set actual size in memory (scaled to account for extra pixel density).
			let scale = Math.round(Math.max(1,Math.min(4,window.devicePixelRatio))*100)/100;
			cnv.width = width * scale;
			cnv.height = height * scale;

			let ctx = cnv.getContext('2d');

			ctx.drawImage(srcImg, 0, 0, cnv.width, cnv.height);
			resolve(cnv.toDataURL()); // defaults to image/png
		}
		srcImg.onerror = reject;

		srcImg.src = url;
	});
}

var ua=navigator.userAgent.toLowerCase();
var sel=document.querySelector('#themeLuminosity');
if(ua.indexOf('chrome/')!=-1 && ua.indexOf('opr/')!=-1) {

	sel.insertBefore(new Option('Auto pick','auto'),sel.firstChild);
}


var cc=document.querySelector('#customColor');
cc.parentNode.style.display='block';
sel.insertBefore(new Option('Custom color','custom'),sel.firstChild);
if(storageType==='ext') {
	storage.get('customColor').then(function(a){
		if('customColor' in a) cc.value=a['customColor'];
	});
}

if(storageType==='ext') {
	storage.get(['openLeftSide','enableOpenFromClipboard']).then(function(a){
		let d=document,
			which='left';
		if(!'openLeftSide' in a || a['openLeftSide']!==true) {
			which='right';
		}

		if('enableOpenFromClipboard' in a && a['enableOpenFromClipboard']===true) {
			d.querySelector('#allowOpenURLFromClipboard').checked=true;
		}

		let rad=d.querySelector('[name="whichSide"][value="'+which+'"]');
		rad.setAttribute('checked','checked')
		rad.checked=true;
		rad.defaultChecked=true;
	});
}


if(navigator && navigator.clipboard && typeof(navigator.clipboard.readText)=="function") {
	document.querySelector('#allowOpenURLFromClipboard').closest('.field').classList.remove('hidden');

	document.querySelector('#allowOpenURLFromClipboard').addEventListener('click',function(e){

		if(e.currentTarget.checked) {
			chrome.permissions.request({'permissions':['clipboardRead']}).then(function(){

				chrome.runtime.sendMessage({action: 'enableOpenFromClipboard'}).then(function(message){
					storage.set({'enableOpenFromClipboard':true});
					successFn();
				},function(error) {
					console.warn(`Error: ${error}`);
				});

			});
		} else {
			chrome.runtime.sendMessage({action: 'disableOpenFromClipboard'}).then(function(message){
				storage.set({'enableOpenFromClipboard':false});
				successFn();
			},function(error) {
				console.warn(`Error: ${error}`);
			});
		}
	});
}

console.log(sel.value)
if(storageType==='ext') {
	storage.get('themeLuminosity').then(function(a){
		if('themeLuminosity' in a) sel.value=a['themeLuminosity'];
		setTimeout(()=>{console.log(sel.value)},500);
	});
}

if(window && window.matchMedia && !!window.matchMedia('(prefers-color-scheme: dark)').matches) {
	console.info('Dark Theme preference detected');
	let p=document.createElement('p');
	p.innerHTML='Dark Theme preference detected ';

	if(storageType==='ext') {
		storage.get('customIcon').then(function(a){
			if('customIcon' in a) {
				let img=new Image();
				img.src=a['customIcon'];
				img.style.marginLeft='.25em';
				p.appendChild(img);
			}
		});
	}
	document.querySelector('.contentWrap').appendChild(p);
}



/*
if(chrome.permissions) {
	chrome.permissions.getAll(function(ar){
		if(ar.permissions.indexOf('activeTab')==-1) {

			var d=document;
			var btnPar=d.createElement('div');
			btnPar.className='buttons';
			btnPar.id='grantActiveTab';
			var btn=d.createElement('button');
			btn.type="button";
			btn.innerHTML="Grant activeTab permission to enable additional feature(s).";
			btn.addEventListener('click',function(){
				chrome.permissions.request({'permissions':['activeTab']}).then(function(){
					chrome.contextMenus.create({
						contexts: ['action'],//,'page_action'
						id: 'duplicateTabURLOnly',
						title: 'Duplicate Tab (Location Only)',
						visible: true
					});
					chrome.permissions.getAll(function(ar){
						console.info(ar);
					});
					d.querySelector('#grantActiveTab').remove();
				});
			});
			btnPar.appendChild(btn);

			var elRef=d.querySelector('#status').parentNode;

			elRef.parentNode.insertBefore(btnPar,elRef);
		}
	});

}*/





