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

	var pickedColor=(themeLuminosity==='dark')?'#f7f7f7':'#111';
	if(val==='custom') pickedColor=val2;
	var darkIcons,dataURI2;
	//const dataURI="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m5.72223 26.0852-1.22223-1.24089 4.44645-4.4516 4.44645-4.4516-8.78151-8.79169 1.29686-1.29686 1.29686-1.29686 8.79169 8.78151 8.79169-8.78151 1.29686 1.29686 1.29686 1.29686-8.78151 8.79169 8.8993 8.90961-1.2968 1.2968-1.29679 1.29679-8.90962-8.8993-4.39563 4.39054c-2.41759 2.4148-4.45437 4.39054-4.52617 4.39054-0.0718 0-0.680547-0.558398-1.35277-1.24089z' fill='%23fff'/%3E%3C/svg%3E";
	const dataURI="data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m6.61595 25.6574-1.11595-1.13299 8.1196-8.12901-8.0179-8.0272 2.36818-2.36818 8.0272 8.0179 8.0272-8.0179 2.36818 2.36818-8.0179 8.0272 8.12545 8.13486-2.36806 2.36806-8.13487-8.12545-4.0134 4.00875c-2.20737 2.20482-4.06703 4.00875-4.13259 4.00875-0.065556 0-0.621369-0.509841-1.23514-1.13299z' fill='%23fff'/%3E%3Cpath d='m3.572 1c-0.907538 2.548e-4 -2.54542 1.66446-2.572 2.572v27.428h1.5v-25.951c0.0108763-1.1874 1.19032-2.56453 2.365-2.54906h22.27c1.27506 0.037162 2.35991 1.30414 2.36496 2.54906v25.951h1.5v-27.428c0.026061-0.933844-1.66443-2.57174-2.57196-2.572z' fill='%23fff'/%3E%3C/svg%3E";

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

	chrome.action.setPopup({ popup: '' });

	successFn();

	if(e.type==='submit') {
		setTimeout(()=>{window.close();},500);
	}
};

document.querySelector('form').addEventListener('submit',themeChange,false);
document.querySelector('#themeLuminosity').addEventListener('change',themeChange,false);
document.querySelector('#customColor').addEventListener('change',themeChange,false);


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
				p.appendChild(img);
			}
		});
	}
	document.querySelector('.contentWrap').appendChild(p);
}

