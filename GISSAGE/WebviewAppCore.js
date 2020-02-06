//
// SAGE2 application: skeletonWebviewApp
// by: Dylan Kobayashi <dylank@hawaii.edu>
//
// Copyright (c) 2018
//

"use strict";

/* global  require */


// This is used to ensure zips works
// Most of this file will be reduced as it should not need to be directly edited.

var sage2_webview_appCoreV01 = SAGE2_App.extend({
	init: function(data) {
		// Prefix used to identify user added functions

		// Still needs electron
		if (this.isElectron()) {
			this.SAGE2Init("webview", data);
			this.createLayer("rgba(0,0,0,0.85)");
			this.layer.style.overflow = "hidden";
			this.pre = document.createElement('pre');
			this.pre.style.whiteSpace = "pre-wrap";
			this.layer.appendChild(this.pre);
			this.console = false;
		} else {
			this.SAGE2Init("div", data);
			this.element.innerHTML = "<h1>Webview only supported using Electron as a display client</h1>";
			return; // Can't do anything without Electron
		}
		this.element.id = "div_" + data.id;
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].setSageAppBackgroundColor) {
			this.element.style.backgroundColor = this[this.swac_userAddPrefix + "webpageAppSettings"].backgroundColor;
		}
		this.resizeEvents = "continuous";
		this.modifiers    = []; // event modifiers
		this.contentType = "web";
		this.isMuted = false;
		this.isLoading = false;
		this.element.style.display = "inline-flex";

		// Webview settings
		this.element.autosize  = "on";
		this.element.plugins   = "on";
		this.element.allowpopups = false;
		this.element.allowfullscreen = false;
		this.element.nodeintegration = 0; // disable node references in page (eg: require)
		this.element.fullscreenable = false;
		this.element.fullscreen = false;
		this.addPreloadFile();
		this.element.disablewebsecurity = false; // security or not: this seems to be an issue often on Windows
		this.element.partition = data.id; // Set a session per webview, so not zoom sharing per origin
		this.element.minwidth  = data.width; // initial size
		this.element.minheight = data.height;

		this.title = "Webview"; // Default title
		this.connectingToSageHostedFile = true; // Assume page is always self connecting
		this.zoomFactor = 1;
		this.autoRefresh = null;
		var _this = this;

		this.element.addEventListener("did-start-loading", function() {
			_this.pre.innerHTML = "";
			_this.isLoading = true;
			_this.changeWebviewTitle();
		});
		this.element.addEventListener("will-navigate", function(evt) {
			_this.state.url = evt.url;
			_this.element.setZoomFactor(_this.state.zoom);
			_this.SAGE2Sync(true);
		});
		this.element.addEventListener("did-stop-loading", function() {
			_this.codeInject(); // css helper
			_this.getFullContextMenuAndUpdate(); // mainly url copy update
			_this.isLoading = false;
			_this.changeWebviewTitle();
		});
		this.element.addEventListener("did-navigate-in-page", function(evt) {
			_this.state.url = evt.url; // To handle navigation whithin the page (ie. anchors)
			_this.element.setZoomFactor(_this.state.zoom);
			_this.SAGE2Sync(true);
		});
		this.element.addEventListener("did-navigate", function(evt) {
			_this.state.url = evt.url; // To handle navigation with history: back and forward
			_this.element.setZoomFactor(_this.state.zoom);
			_this.SAGE2Sync(true);
		});

		// Only allow new window creation with right click if user OK's it
		// Possible they are using the right click for somethign else
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableRightClickNewWindow) {
			this.element.addEventListener("context-menu", function(evt) {
				let params = evt.params; // Capturing right-click context menu inside webview
				let pos = [_this.sage2_x + _this.sage2_width + 5,
					_this.sage2_y - _this.config.ui.titleBarHeight];
				if (params.mediaType === "image" && params.hasImageContents) {
					wsio.emit('openNewWebpage', { id: _this.id, url: params.srcURL, position: pos });
				} else if (params.mediaType === "none" && params.linkURL) {
					wsio.emit('openNewWebpage', { id: _this.id, url: params.linkURL, position: pos 	});
				}
			});
		}

		this.element.addEventListener("did-fail-load", function(event) {
			console.log('Webview> Did fail load', event);
			_this.isLoading = false;
			if (event.errorCode === -501) { // Add the message to the console layer
				_this.pre.innerHTML += 'Webview> certificate error:' + event + '\n';
				_this.element.src = 'data:text/html;charset=utf-8,' +
					'<h1>This webpage has invalid certificates and cannot be loaded</h1>';
				_this.changeWebviewTitle();
			} else { // real error
				_this.element.src = 'data:text/html;charset=utf-8,<h1>Invalid URL</h1>';
				_this.changeWebviewTitle();
			}
		});
		this.element.addEventListener("page-title-updated", function(event) {
			_this.changeWebviewTitle(event.title);
		});
		this.element.addEventListener("enter-html-full-screen", function(event) {
			console.log('Webview>	Enter fullscreen');
			event.preventDefault();
		});
		this.element.addEventListener("leave-html-full-screen", function(event) {
			console.log('Webview>	Leave fullscreen');
			event.preventDefault();
		});
		this.element.addEventListener("page-favicon-updated", function(event) {
			if (event.favicons && event.favicons[0]) {
				_this.state.favicon = event.favicons[0];
				_this.SAGE2Sync(false);
			}
		});
		this.element.addEventListener("new-window", function(event) {
			if (event.url.startsWith('http:') || event.url.startsWith('https:')) {
				let pos = [_this.sage2_x + _this.sage2_width + 5,
					_this.sage2_y - _this.config.ui.titleBarHeight];
				wsio.emit('openNewWebpage', {
					id: this.id,
					url: event.url,
					position: pos
				});
			} else {
				console.log('Webview>	Not a HTTP URL, not opening [', event.url, ']', event);
			}
			_this.modifiers = [];
		});
		// Store cookie to enable connection to self hosted files
		if (this.connectingToSageHostedFile && getCookie("session")) {
			var webview = this.element;
			webview.addEventListener("dom-ready", function() {
				var webviewContents = webview.getWebContents();
				var urlWithSession = webviewContents.getURL();
				if (urlWithSession.indexOf("session.html") > 0) {
					var urlRoot = urlWithSession.substring(0, urlWithSession.indexOf("session.html") - 1);
					var url = urlRoot + urlWithSession.substring(urlWithSession.indexOf("page") + 5, urlWithSession.length);
					webviewContents.session.cookies.set( { url: urlRoot, name: "session", value: getCookie("session") }, function() {
					});
					_this.changeURL(url, false);
				}
			});
		}




		// Console message from the embedded page
		// This is the primary way which communication comes back from the page
		this.element.addEventListener('console-message', function(event) {
			try {
				let obj = JSON.parse(event.message);
				if (obj.s2) {
					if (obj.s2 === "state"){
						_this.messageUpdateStateValue(obj.nameOfValue, obj.value, obj.propagateChanges)
					} else if (obj.s2 === "functionCall") {
						if (_this[obj.nameOfFunction]) { // only if function exists
							_this[obj.nameOfFunction](obj.value)
						} else {
							console.log("ERROR> WebAppCore> Webpage attempted to call function: " + obj.nameOfFunction + ". But it doesn't exist.");
						}
					}
				} else { // Was not an s2 communication message
					if (_this[_this.swac_userAddPrefix + "webpageAppSettings"].printConsoleOutputFromPage) {
						console.log('Webview>	console:', event.message);
					}
					_this.pre.innerHTML += 'Webview> ' + event.message + '\n';
				}
			} catch(e) {
				if (_this[_this.swac_userAddPrefix + "webpageAppSettings"].printConsoleOutputFromPage) {
					console.log('Webview>	console:', event.message);
				}
				_this.pre.innerHTML += 'Webview> ' + event.message + '\n';
			 } // Ignore
		});


		this[this.swac_userAddPrefix + "init"](data); // call user provided init() if available
	},

	isElectron: function() {
		return (typeof window !== 'undefined' && window.process && window.process.type === "renderer");
	},
	addPreloadFile: function() {
		if (!this.isElectron()) {
			return; // return if not electron.
		}
		var path = require("path");
		var app = require("electron").remote.app;
		var appPath = app.getAppPath();
		var rootPath = appPath;
		var preloadPath = path.join(rootPath, 'public/uploads/apps/Webview', 'SAGE2_script_supplement.js');
		this.element.preload = "file://" + preloadPath;
	},
	changeWebviewTitle: function(newtitle) {
		if (newtitle) {
			this.title = 'Webview: ' + newtitle;
		}
		var newtext = this.title;
		if (this.autoRefresh) {
			newtext += ' <i class="fa">\u{f017}</i>';
		}
		if (this.isLoading && this.contentType === "web") {
			newtext += ' <i class="fa fa-spinner fa-spin"></i>';
		}
		this.updateTitle(newtext);
	},

	codeInject: function() {
		// Disabling text selection in page because it blocks the view sometimes done by injecting some CSS code Also disabling grab and drag events
		this.element.insertCSS(":not(input):not(textarea), " +
			":not(input):not(textarea)::after, " +
			":not(input):not(textarea)::before { " +
				"-webkit-user-select: none; " +
				"user-select: none; " +
				"cursor: default; " +
				"-webkit-user-drag: none;" +
				"-moz-user-drag: none;" +
				"user-drag: none;" +
			"} " +
			"input, button, textarea, :focus { " +
				"outline: none; " +
			"}");
	},
	draw: function(date) {
		if (this[this.swac_userAddPrefix + "draw"]) {
			this[this.swac_userAddPrefix + "draw"]();
		}
	},
	changeURL: function(newlocation, remoteSync) {
		this.element.src = newlocation;
		this.state.url   = newlocation;
		this.SAGE2Sync(remoteSync); // remote sync
	},
	resize: function(date) {
		this.element.style.width  = this.sage2_width  + "px";
		this.element.style.height = this.sage2_height + "px";
		if (this.layer) {
			this.layer.style.width  = this.element.style.width;
			this.layer.style.height = this.element.style.height;
		}
		if (this[this.swac_userAddPrefix + "resize"]) {
			this[this.swac_userAddPrefix + "resize"]();
		}
		this.refresh(date);
	},
	quit: function() {
		if (this.autoRefresh) {
			clearInterval(this.autoRefresh);
		}
		if (this[this.swac_userAddPrefix + "quit"]) {
			this[this.swac_userAddPrefix + "quit"]();
		}
	},

	event: function(eventType, position, user_id, data, date) {
		if (this.isElectron()) {
			var x = Math.round(position.x);
			var y = Math.round(position.y);
			var _this = this;
			if (eventType === "pointerPress") {
				this.element.sendInputEvent({ // click
					type: "mouseDown",
					x: x, y: y,
					button: data.button,
					modifiers: this.modifiers,
					clickCount: 1
				});
			} else if (eventType === "pointerMove") {
				this.element.sendInputEvent({ // move
					type: "mouseMove",
					modifiers: this.modifiers,
					x: x, y: y
				});
			} else if (eventType === "pointerRelease") {
				this.element.sendInputEvent({ // click release
					type: "mouseUp",
					x: x, y: y,
					button: data.button,
					modifiers: this.modifiers,
					clickCount: 1
				});
			} else if (eventType === "pointerScroll") {
				this.element.sendInputEvent({ // Scroll events: reverse the amount to get correct direction
					type: "mouseWheel",
					deltaX: 0, deltaY: -1 * data.wheelDelta,
					x: x, y: y,
					modifiers: this.modifiers,
					canScroll: true
				});
			} else if (eventType === "widgetEvent") { // widget events
			} else if (eventType === "keyboard") {
				this.element.sendInputEvent({ // type: "keyDown"
					type: "char",
					keyCode: data.character
				});
				setTimeout(function() {
					_this.element.sendInputEvent({
						type: "keyUp",
						keyCode: data.character
					});
				}, 0);
			} else if (eventType === "specialKey") {
				this.modifiers = []; // store the modifiers values
				if (data.status && data.status.SHIFT) {
					this.modifiers.push("shift");
				}
				if (data.status && data.status.CTRL) {
					this.modifiers.push("control");
				}
				if (data.status && data.status.ALT) {
					this.modifiers.push("alt");
				}
				if (data.status && data.status.CMD) {
					this.modifiers.push("meta");
				}
				if (data.status && data.status.CAPS) {
					this.modifiers.push("capsLock");
				}
				if (data.code === 16) { // SHIFT key
					if (data.state === "down") {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Shift"
						});
					} else {
						this.element.sendInputEvent({
							type: "keyUp",
							keyCode: "Shift"
						});
					}
				}
				if (data.code === 8 || data.code === 46) { // backspace key
					if (data.state === "down") { // Currently only allow on keyup have finer control
					} else {
						this.element.sendInputEvent({
							type: "keyUp",
							keyCode: "Backspace"
						});
					}
				}
				if (data.code === 37 && data.state === "down") { // arrow left
					if (data.status.ALT) {
						this.element.goBack();
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Left",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 38 && data.state === "down") { // arrow up
					if (data.status.ALT) {
						this.zoomPage({dir: "zoomin"});
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Up",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 39 && data.state === "down") { // arrow right
					if (data.status.ALT) {
						this.element.goForward();
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Right",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 40 && data.state === "down") { // arrow down
					if (data.status.ALT) {
						this.zoomPage({dir: "zoomout"});
					} else {
						this.element.sendInputEvent({
							type: "keyDown",
							keyCode: "Down",
							modifiers: null
						});
					}
					this.refresh(date);
				} else if (data.code === 82 && data.state === "down") {	// r key
					if (data.status.ALT) {
						this.isLoading = true; // ALT-r reloads
						this.reloadPage({});
					}
					this.refresh(date);
				}
			}
		}
	},

	












	// Sync event when shared
	load: function(date) {
		if (this[this.swac_userAddPrefix + "load"]) {
			this[this.swac_userAddPrefix + "load"]();
		}
		this.sendStateToWebpage();
	},

	sendStateToWebpage: function() {
		// Will send full state object to the webpage
		this.element.executeJavaScript(
			"SAGE2_AppState.fullStateHandler("
			+ JSON.stringify(this.state)
			+ ");"
		);
	},

	getContextEntries: function() {
		let entries = [];
		let entry;

		let addSeparator = false;

		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.navigateBack) {
			entry = {};
			entry.description = "Back";
			entry.accelerator = "Alt \u2190";     // ALT <-
			entry.callback = "navigation";
			entry.parameters = {};
			entry.parameters.action = "back";
			entries.push(entry);
			addSeparator = true;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.navigateForward) {
			entry = {};
			entry.description = "Forward";
			entry.accelerator = "Alt \u2192";     // ALT ->
			entry.callback = "navigation";
			entry.parameters = {};
			entry.parameters.action = "forward";
			entries.push(entry);
			addSeparator = true;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.reload) {
			entry = {};
			entry.description = "Reload";
			entry.accelerator = "Alt R";         // ALT r
			entry.callback = "reloadPage";
			entry.parameters = {};
			entries.push(entry);
			addSeparator = true;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.autoRefresh) {
			entry = {};
			entry.description = "Auto Refresh (5min)";
			entry.callback = "reloadPage";
			entry.parameters = {time: 5 * 60};
			entries.push(entry);
			addSeparator = true;
		}
		if (addSeparator) {
			entries.push({description: "separator"});
			addSeparator = false;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.consoleViewToggle) {
			entry = {};
			entry.description = "Show/Hide Console";
			entry.callback = "showConsole";
			entry.parameters = {};
			entries.push(entry);
			entries.push({description: "separator"});
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.zoomIn) {
			entry = {};
			entry.description = "Zoom In";
			entry.accelerator = "Alt \u2191";     // ALT up-arrow
			entry.callback = "zoomPage";
			entry.parameters = {};
			entry.parameters.dir = "zoomin";
			entries.push(entry);
			addSeparator = true;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.zoomOut) {
			entry = {};
			entry.description = "Zoom Out";
			entry.accelerator = "Alt \u2193";     // ALT down-arrow
			entry.callback = "zoomPage";
			entry.parameters = {};
			entry.parameters.dir = "zoomout";
			entries.push(entry);
			addSeparator = true;
		}
		if (addSeparator) {
			entries.push({description: "separator"});
			addSeparator = false;
		}
		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.urlTyping) {
			entry   = {};
			entry.description = "Type URL:";
			entry.callback = "navigation";
			entry.inputField = true;
			entry.value = this.element.src;
			entry.inputFieldSize = 20;
			entry.inputDefault   = this.state.url;
			entry.parameters = {};
			entry.parameters.action = "address";
			entries.push(entry);
		}

		if (this[this.swac_userAddPrefix + "webpageAppSettings"].enableUiContextMenuEntries.copyUrlToClipboard) {
			entries.push({
				description: "Copy URL to Clipboard",
				callback: "SAGE2_copyURL",
				parameters: {
					url: this.state.url
				}
			});
		}

		if (this[this.swac_userAddPrefix + "getContextEntries"]) {
			if (this[this.swac_userAddPrefix + "webpageAppSettings"].putAdditionalContextMenuEntriesBeforeDefaultEntries) {
				entries = this[this.swac_userAddPrefix + "getContextEntries"]().concat(entries);
			} else {
				entries = entries.concat(this[this.swac_userAddPrefix + "getContextEntries"]());
			}
		}

		return entries;
	},
	zoomPage: function(responseObject) {
		if (this.isElectron()) {
			var dir = responseObject.dir;
			if (dir === "zoomin") {
				this.state.zoom *= 1.50;
				this.element.setZoomFactor(this.state.zoom);
			}
			if (dir === "zoomout") {
				this.state.zoom /= 1.50;
				this.element.setZoomFactor(this.state.zoom);
			}
			this.refresh();
		}
	},
	reloadPage: function(responseObject) {
		if (this.isElectron()) {
			if (responseObject.time) {
				if (isMaster) {
					var interval = parseInt(responseObject.time, 10) * 1000;
					var _this = this;
					this.autoRefresh = setInterval(function() {
						_this.broadcast("reloadPage", {});
					}, interval);
					this.changeWebviewTitle();
				}
			} else {
				this.isLoading = true;
				this.element.reload();
				this.element.setZoomFactor(this.state.zoom);
			}
		}
	},
	showConsole: function(responseObject) {
		if (this.isElectron()) {
			if (this.console) {
				this.hideLayer();
				this.console = false;
			} else {
				this.showLayer();
				this.console = true;
			}
		}
	},
	navigation: function(responseObject) {
		if (this.isElectron) {
			var action = responseObject.action;
			if (action === "back") {
				this.element.goBack();
			} else if (action === "forward") {
				this.element.goForward();
			} else if (action === "address") {
				if ((responseObject.clientInput.indexOf("://") === -1) &&
					!responseObject.clientInput.startsWith("/")) {
					responseObject.clientInput = "http://" + responseObject.clientInput;
				}
				this.changeURL(responseObject.clientInput, true);
			}
		}
	},
	

	
	// ----------------------------------------------------------------------------------------------------
	// ----------------------------------------------------------------------------------------------------
	// ----------------------------------------------------------------------------------------------------


	messageUpdateStateValue: function(nameOfValue, value, propagateChanges) {
		if (!this.state[nameOfValue]) {
			console.log("Warning: app trying to set a value that doens't exist in state: " + nameOfValue, this.state);
		}
		this.state[nameOfValue] = value;
		if (propagateChanges) {
			this.SAGE2Sync(true); // True means remote sync. false is send updates to only this server's clients
		}
	},

	callFunctionInWebpage: function(nameOfFunction, value) {
		this.element.executeJavaScript( nameOfFunction + "(" + JSON.stringify(value)	+ ");");
	},



});

function sage2_webview_appCoreV01_extendWebview (newPieces) {
	let swac_userAddPrefix = "prefix_swacv01";
	let nameCorrected = {};
	let names = Object.keys(newPieces);
	let tempCore = new sage2_webview_appCoreV01();
	// for each added piece
	for (let i = 0; i < names.length; i++) {
		if (tempCore[names[i]] || (names[i] === "webpageAppSettings")) {
			// If the name already exists, add it with the modified prefix
			nameCorrected[swac_userAddPrefix + names[i]] = newPieces[names[i]];
		} else { // else add without modification
			nameCorrected[names[i]] = newPieces[names[i]];
		}
	}
	nameCorrected.swac_userAddPrefix = swac_userAddPrefix;
	return sage2_webview_appCoreV01.extend(nameCorrected);
};

