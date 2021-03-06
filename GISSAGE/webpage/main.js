/** 
 * Global references to key entities
 */
let globalMap = null;
let globalView = null;
let globalSharedPointerLayer = null;
let globalSelectedFeature = null;
let globalSelectedVisualVariableType = null;
let globalFilterQuery = "";
let globalLayers = {};
let activeMenu = "Layers";

/**
 * Specification of html skeleton of various menus
 */
let topMenuHTML = '<div class="topmenu"><img id="gis-logo" src="./assets/logo.png" height="70px" width="124px" style="height:65%; width:65%;"></img><div id="menu-button-container"><i id="layer-button" class="fas fa-layer-group unfocused menu-button"></i>&nbsp;<i id="filter-button" class="fas fa-filter unfocused menu-button"></i>&nbsp;<i id="variable-button" class="fas fa-map-marked-alt unfocused menu-button"></i></div></div><button id="hideSideBar"><span style="font-size: calc(1.25vw + 1.25vh);"><strong>&lt;</strong></span></button>';

let layerStyleMenuContainer0HTML = '<div class="menucontainer" id="zeroth"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layer Radius</h5><div class="inputcontainer"><input type="range" min="1" max="60" value="6" class="slider" id="pointSizeSlider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);" id="pointSizeLabel"><strong>6</strong></label></div></div>';

let layerStyleMenuContainer1HTML = '<div class="menucontainer" id="first"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Fill Color</h5><div class="inputcontainer"><input type="range" min="0" max="255" value="255" class="slider" id="rslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>R</strong></label><input type="range" min="0" max="255" value="140" class="slider" id="gslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>G</strong></label><input type="range" min="0" max="255" value="0" class="slider" id="bslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>B</strong></label></div></div>';

let layerStyleMenuContainer2HTML = '<div class="menucontainer" id="second"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layer Opacity</h5><div class="inputcontainer"><input type="range" min="0" max="100" value="100" id="oslider" class="slider">&nbsp;<label style="color: #ffffff; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);" id="olabel"><strong>100</strong></label></div></div>';

let layerStyleMenuContainer3HTML = '<div class="menucontainer" id="third"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Toggle Layer</h5><div class="inputcontainer"><div id="layertoggle" class="on">On  <i class="far fa-eye"></i></div></div></div>';

let layerFilterMenuContainer0HTML = `<div class="menucontainer" id="filter">
<h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Select Features</h5>
&nbsp; <ul id="feature-select"></ul>
</div>`;

let layerVisualMenuContainer0HTML = `<div class="menucontainer" id="visual">
<h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Select Variable</h5>
&nbsp; <ul id="visual-select"></ul>
</div>`;

let layerStyleItems = [
  layerStyleMenuContainer0HTML, 
  layerStyleMenuContainer1HTML,
  layerStyleMenuContainer2HTML,
  layerStyleMenuContainer3HTML
];

let filterMenuItems = [
  layerFilterMenuContainer0HTML,
];

let visualVariableItems = [
  layerVisualMenuContainer0HTML,
];

let layerHeaderContainerHTML = '<div class="layerheadercontainer"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layers</h5><ul id="layersList"></ul></div>';

let filterContainerHTML = '<div class="filtercontainer"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Filters</h5><ul id="layersList"></ul></div>';

let visualVariableContainerHTML = '<div class="visualvarcontainer"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Visual Variables</h5><ul id="layersList"></ul></div>';

// Lookup table for the appropriate menu HTML content
let sidebarMenuHTML = {
  "Layers": topMenuHTML + layerHeaderContainerHTML,
  "Filters": topMenuHTML + filterContainerHTML,
  "LayerStyle": layerStyleItems.join(''),
  "FeatureFilter": filterMenuItems.join(''),
  "VisualVariables": topMenuHTML + visualVariableContainerHTML,
  "VisualVariableSelect": visualVariableItems.join('')
};

// Lookup table for the appropriate menu constructors
let sidebarMenuConstructors = {
  "Layers": constructLayersMenu,
  "Filters": constructFiltersMenu,
  "LayerStyle": constructLayerStyleMenu,
  "VisualVariables": constructVisualVariableMenu
};

// Have the container process the data file once the webpage is loaded
// Then construct the sidebar menu content
window.addEventListener("DOMContentLoaded", function() {
  SAGE2_AppState.callFunctionInContainer("processDataFile");
  sidebarMenuConstructors[activeMenu]();
  constructTopMenu();
});

// Change the application title
SAGE2_AppState.titleUpdate("GIS-SAGE");


/**
 * This function constructs the topmenu section of the sidebar
 * including the button used to show/hide the sidebar
 * Also responsible for binding callbacks to its UI elements
 * @function constructTopMenu
 */
function constructTopMenu() {
  let sideBar = document.getElementById("sideBar");
  let sideBarButton = document.getElementById("hideSideBar");

  // Bind the onclick functionality to the hideSideBar button
  sideBarButton.onclick = function() {
    let topMenu = document.getElementsByClassName("topmenu")[0];
    if (sideBar.className !== "hidden") {
      sideBar.className = "hidden";
      sideBarButton.innerHTML = '<span style="font-size: calc(1.25vw + 1.25vh);"><strong>&gt;</strong></span>';
      let children = sideBar.children;
      for (let i = 1; i < children.length; i++) {
        children[i].style.visibility = "hidden";
      }
      topMenu.style.visibility = "hidden";
      sideBarButton.style.visibility = "visible";
    } else {
      sideBar.className = "";
      sideBarButton.innerHTML = '<span style="font-size: calc(1.25vw + 1.25vh);"><strong>&lt;</strong></span>';
      let children = sideBar.children;
      for (let i = 1; i < children.length; i++) {
        children[i].style.visibility = "visible";
      }
      topMenu.style.visibility = "visible";
    }
  }

  // bind the onclick function to the layer menu
  let layerButton = document.getElementById('layer-button');
  let filterButton = document.getElementById('filter-button');
  let variableButton = document.getElementById('variable-button');
  layerButton.onclick = function() {
    let lbclassNames = layerButton.className.split(' ');
    if (lbclassNames[2] === 'unfocused') {
      constructLayersMenu();
      constructTopMenu();
      for (const layerName in globalLayers) {
        addLayerToLayersList(globalLayers[layerName]);
        SAGE2_AppState.callFunctionInContainer("consolePrint", `Adding layer ${layerName} to the Layer List`);
      }
      focusTopMenuButton('layer-button', 'focused');
      focusTopMenuButton('filter-button', 'unfocused');
      focusTopMenuButton('variable-button', 'unfocused');
      activeMenu = "Layers";
    } else {
      return;
    }
  }

  // bind the onclick function to the filter menu
  filterButton.onclick = function() {
    let lbclassNames = layerButton.className.split(' ');
    let fbclassNames = filterButton.className.split(' ');
    if (fbclassNames[2] === 'unfocused') {
      constructFiltersMenu();
      constructTopMenu();
      for (const layerName in globalLayers) {
        addLayerToLayersList(globalLayers[layerName]);
        SAGE2_AppState.callFunctionInContainer("consolePrint", `Adding layer ${layerName} to the Filter List`);
      }
      focusTopMenuButton('layer-button', 'unfocused');
      focusTopMenuButton('filter-button', 'focused');
      focusTopMenuButton('variable-button', 'unfocused');
      activeMenu = "Filters";
    } else {
      return;
    }
    layerButton.className = lbclassNames.join(' ');
    filterButton.className = fbclassNames.join(' ');
  }

  // bind the onclick function to the visual variable menu
  variableButton.onclick = function() {
    if (variableButton.classList.contains('unfocused')) {
      constructVisualVariableMenu();
      constructTopMenu();
      for (const layerName in globalLayers) {
        addLayerToLayersList(globalLayers[layerName]);
        SAGE2_AppState.callFunctionInContainer("consolePrint", `Adding layer ${layerName} to the Visual Variable List`);
      }
      focusTopMenuButton('layer-button', 'unfocused');
      focusTopMenuButton('filter-button', 'unfocused');
      focusTopMenuButton('variable-button', 'focused');
      activeMenu = "VisualVariables";
    } else {
      return;
    }
  }

  // set the focused status of the buttons based on the currently active menu
  if(activeMenu === "Layers" || activeMenu === "LayerStyle") {
    focusTopMenuButton('layer-button', 'focused');
  }
  if(activeMenu === "Filters" || activeMenu == "FeatureFilter") {
    focusTopMenuButton('filter-button', 'focused');
  }
  if(activeMenu === "VisualVariables" || activeMenu == "VisualVariableSelect") {
    focusTopMenuButton('variable-button', 'focused');
  }
}

/**
 * This function constructs the layerStyle menu for
 * the currently active layer selected by the user
 * @function constructLayerStyleMenu
 * @param {String} layerName the name of the currently active layer
 */
function constructLayerStyleMenu(layerName) {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = topMenuHTML;
  sideBar.innerHTML += `<h5 id="layerNameHeader" style="color: white; font-family: Michroma, sans-serif; font-size: calc(0.9vw + 0.9vh);">Styling <span style="color: #A5EAAA;">${layerName}</span></h5>`;
  sideBar.innerHTML += sidebarMenuHTML[activeMenu];
  attachEventHandlersToLayerStyleControls(layerName);
  constructTopMenu();
}

function constructVariableSelectMenu(layerName) {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = topMenuHTML;
  sideBar.innerHTML += `<h5 id="layerNameHeader" style="color: white; font-family: Michroma, sans-serif; font-size: calc(0.9vw + 0.9vh);">Visual: <span style="color: #A5EAAA;">${layerName}</span></h5>`;
  sideBar.innerHTML += sidebarMenuHTML[activeMenu];
  let visualSelect = document.getElementById("visual-select");

  // Add fields to the list only if they are of a numeric type
  for (let field of globalLayers[layerName].fields) {
    if (field.type === "double" || field.type === "integer") {
      let li = document.createElement('li');
      li.className = 'visual-option';
      let liText = document.createElement('p');
      liText.innerHTML = field.name;
      liText.className = 'visual-label';
      li.appendChild(liText);
      visualSelect.appendChild(li);

      li.onmouseenter = function() {
        li.classList.add('hover');
      }

      li.onmouseleave = function() {
        li.classList.remove('hover');
      }

      li.onmousedown = function() {
        li.classList.toggle('highlight');
        let listItems = visualSelect.children;
        for (let listItem of listItems) {
          listItem !== li && listItem.classList.remove('highlight');
        }
        let modal = document.getElementById("visualVariableModal");
        modal.style.display = "block";
        let close = document.getElementsByClassName("close-modal")[0];
        close.onclick = function() {
          modal.style.display = "none";
        }
        close.onmouseenter = function() {
          close.classList.add('hover');
        }
        close.onmouseleave = function() {
          close.classList.remove('hover');
        }
        let header = document.getElementById("modal-header-text");
        header.innerHTML = `Style By <span style="color: #A5EAAA;">${li.innerText}</span>`;

        let replaceColorRadio = document.getElementById("replace-color");
        let replaceSizeRadio = document.getElementById("replace-size");
        let replaceOpacityRadio = document.getElementById("replace-opacity");

        let startFeatureInput = document.getElementById("start-feature-range");
        let endFeatureInput = document.getElementById("end-feature-range");
        let startVarInput = document.getElementById("start-variable-range");
        let endVarInput = document.getElementById("end-variable-range");

        let query = globalLayers[layerName].createQuery();
        let minFeature = {
          onStatisticField: li.innerText,
          outStatisticFieldName: `min_${li.innerText}`,
          statisticType: 'min'
        };
        let maxFeature = {
          onStatisticField: li.innerText,
          outStatisticFieldName: `max_${li.innerText}`,
          statisticType: 'max'
        };
        query.outStatistics = [minFeature, maxFeature];
        globalLayers[layerName].queryFeatures(query)
          .then(function(response) {
            var stats = response.features[0].attributes;
            let minField = `min_${li.innerText}`;
            let maxField = `max_${li.innerText}`;
            startFeatureInput.value = stats[minField];
            endFeatureInput.value = stats[maxField];
          });
        
        if (replaceColorRadio.classList.contains('focus')) {
          startVarInput.value = "#000000";
          endVarInput.value = "#ffffff";
        } else if (replaceOpacityRadio.classList.contains('focus')) {
          startVarInput.value = 0.1;
          endVarInput.value = 1;
        } else if (replaceSizeRadio.classList.contains('focus')) {
          startVarInput.value = 1;
          endVarInput.value = 40;
        }

        replaceColorRadio.onclick = function() {
          SAGE2_AppState.callFunctionInContainer("consolePrint", "Clicked color radio buttom");
          globalSelectedVisualVariableType = "color";
          replaceColorRadio.classList.add("focus");
          replaceSizeRadio.classList.remove("focus");
          replaceOpacityRadio.classList.remove("focus");
          startVarInput.value = "#000000";
          endVarInput.value = "#ffffff";
        }

        replaceSizeRadio.onclick = function() {
          globalSelectedVisualVariableType = "size";
          replaceSizeRadio.classList.add("focus");
          replaceColorRadio.classList.remove("focus");
          replaceOpacityRadio.classList.remove("focus");
          startVarInput.value = 1;
          endVarInput.value = 40;
        }

        replaceOpacityRadio.onclick = function() {
          globalSelectedVisualVariableType = "opacity";
          replaceOpacityRadio.classList.add("focus");
          replaceColorRadio.classList.remove("focus");
          replaceSizeRadio.classList.remove("focus");
          startVarInput.value = 0.1;
          endVarInput.value = 1;
        }
        let modalSubmitButton = document.getElementById("modal-submit-button");
        modalSubmitButton.onclick = function() {
          let stop1 = {};
          stop1.value = startFeatureInput.value;
          stop1[globalSelectedVisualVariableType] = startVarInput.value;

          let stop2 = {};
          stop2.value = endFeatureInput.value;
          stop2[globalSelectedVisualVariableType] = endVarInput.value;
          let visualVariable = {
            type: globalSelectedVisualVariableType,
            field: li.innerText,
            stops: [
              stop1,
              stop2
            ]
          };

          let renderer = globalLayers[layerName].renderer.clone();
          if (renderer.visualVariables === null) {
            renderer.visualVariables = [];
          }
          renderer.visualVariables = renderer.visualVariables.concat([visualVariable]);
          globalLayers[layerName].renderer = renderer;
          modal.style.display = "none";
        }
      }
    }
  }
  // construct the top menu
  constructTopMenu();
}

/**
 * This function is responsible for constructing the filterMenu
 * for the currently active layer selected by the user
 * @function constructFeatureFilterMenu
 * @param {String} layerName the name of the currently active layer
 */
function constructFeatureFilterMenu(layerName) {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = topMenuHTML;
  sideBar.innerHTML += `<h5 id="layerNameHeader" style="color: white; font-family: Michroma, sans-serif; font-size: calc(0.9vw + 0.9vh);">Filter:  <span style="color: #A5EAAA;">${layerName}</span></h5>`;
  sideBar.innerHTML += sidebarMenuHTML[activeMenu];
  let featureSelect = document.getElementById("feature-select");

  // Add fields to the list only if they are of a filterable type
  for (let field of globalLayers[layerName].fields) {
    if (field.type === "double" || field.type === "integer") {
      let li = document.createElement('li');
      li.className = 'select-option';
      let liText = document.createElement('p');
      liText.innerHTML = field.name;
      liText.className = 'select-label';
      let liInput = document.createElement('input');
      liInput.type = 'text';
      liInput.className = 'select-input';
      liInput.placeholder = 'Expression';
      liInput.style.visibility = 'hidden';
      li.appendChild(liText);
      li.appendChild(liInput);
      featureSelect.appendChild(li);

      li.onmouseenter = function() {
        li.classList.add('hover');
      }

      li.onmouseleave = function() {
        li.classList.remove('hover');
      }

      liText.onmousedown = function() {
        li.classList.toggle('highlight');
        if (liInput.style.visibility === 'hidden') {
          liInput.style.visibility = 'visible';
        } else {
          liInput.style.visibility = 'hidden';
          liInput.value = '';
        }
      }
    }
  }

  // Create and add a filter submit button to the list
  let filterSubmitLi = document.createElement('li');
  filterSubmitLi.className = "filter-button-li";
  let filterSubmitButton = document.createElement('button');
  filterSubmitButton.innerText = "Submit Filter";
  filterSubmitButton.id = "filter-submit";
  filterSubmitButton.onclick = function() {
    let selectOptions = Array.from(document.getElementsByClassName('select-option'));
    let filteredOptions = selectOptions.filter((option) => option.classList.contains('highlight'));
    let filterString = '';
    for (let i = 0; i < filteredOptions.length; i++) {
      let selectOption = filteredOptions[i];
      let liText = selectOption.children[0];
      let liInput = selectOption.children[1];
      filterString += `${liText.innerHTML} ${liInput.value}`;
      if (i < (filteredOptions.length - 1)) {
        filterString += ' and ';
      }
    }
    applyFilterToLayer(layerName, filterString);
  }
  filterSubmitLi.appendChild(filterSubmitButton);
  featureSelect.appendChild(filterSubmitLi);

  // Create and add a filter clear button to the list
  let filterClearLi = document.createElement('li');
  filterClearLi.className = "filter-button-li";
  let filterClearButton = document.createElement('button');
  filterClearButton.innerText = "Clear Filters";
  filterClearButton.id = "filter-clear";
  filterClearButton.onclick = function() {
    clearFilterFromLayer(layerName);
  }
  filterClearLi.appendChild(filterClearButton);
  featureSelect.appendChild(filterClearLi);

  // construct the top menu
  constructTopMenu();
}

/**
 * This function is responsible for binding the appropriate mutation observer
 * which listens for additions to the layer list and binds the appropriate
 * mouse handlers to newly added layer names
 * @function bindObserverToLayerList
 * @param {String} activeMenuContext The menu context of the layer list
 * @param {Function} constructor The callback for constructing the menu
 */
function bindObserverToLayerList(activeMenuContext, constructor) {
  // Listen for the addition of new layers to the layersList and bind
  // the appropriate event handlers to these elements dynamically
  let layerList = document.getElementById("layersList");
  let layerListObserver = new MutationObserver(function() {
    SAGE2_AppState.callFunctionInContainer("consolePrint", "New list item added to layerList");
    let getMouseHandler = function(listItem, type) {
      if (type === "mouseover") {
        return function() {
          listItem.className = 'hover';
          SAGE2_AppState.callFunctionInContainer("consolePrint", "mouseover detected");
        };
      } else if (type === "mouseout") {
        return function() {
          listItem.classList.remove('hover');
          SAGE2_AppState.callFunctionInContainer("consolePrint", "mouseout detected");
        }
      } else {
        return function() {
          SAGE2_AppState.callFunctionInContainer("consolePrint", "mouseclick detected");
          SAGE2_AppState.callFunctionInContainer("consolePrint", "activating layer " + listItem.innerHTML);
          activeMenu = activeMenuContext;
          constructor(listItem.innerHTML);
        }
      }
    }
    for (let childNode of layerList.childNodes) {
      childNode.onmouseover = getMouseHandler(childNode, 'mouseover');
      childNode.onmouseout = getMouseHandler(childNode, 'mouseout');
      childNode.onclick = getMouseHandler(childNode, "mouseclick");
    }
  });
  layerListObserver.observe(layerList, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

/**
 * This function constructs the Visual Variable Menu for
 * the SideBar
 * @function constructVisualVariableMenu
 */
function constructVisualVariableMenu() {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = sidebarMenuHTML["VisualVariables"];
  bindObserverToLayerList(
    "VisualVariableSelect", 
    constructVariableSelectMenu
  );
}

/**
 * This function constructs the Layers menu for the SideBar
 * This function is called at application start, as the default
 * state of the SideBar is to display the Layers menu
 * @function constructLayersMenu
 */
function constructLayersMenu() {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = sidebarMenuHTML["Layers"];
  bindObserverToLayerList(
    "LayerStyle",
    constructLayerStyleMenu
  );
}

/**
 * This function constructs the Filters menu for the SideBar
 * @function constructFiltersMenu
 */
function constructFiltersMenu() {
  let sideBar = document.getElementById('sideBar');
  sideBar.innerHTML = sidebarMenuHTML["Filters"];
  bindObserverToLayerList(
    "FeatureFilter",
    constructFeatureFilterMenu
  );
}

/**
 * Initializes the map from the appropriate source data url
 * and using the appropriate Layer type based on the sourceType
 * @function initializeMapFromDataSource
 * @param {Object} param0 the url and sourceType of the data source 
 */
function initializeMapFromDataSource({url, sourceType}) {
  require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/layers/CSVLayer",
    "esri/layers/GraphicsLayer",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Expand",
    "esri/widgets/Zoom",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Graphic"
  ], function(Map, MapView, GeoJSONLayer, 
      CSVLayer, GraphicsLayer, BasemapGallery, Expand, Zoom,
      SimpleMarkerSymbol, Graphic) {

        // construct the map instance
        let map = new Map({
          basemap: "topo-vector"
        });

        // construct a view to control how the map is rendered
        let view = new MapView({
          container: "viewDiv",
          map: map,
          center: [-0.09, 51.505],
          zoom: 11
        });

        // construct a BasemapGallery for swapping basemaps
        let basemapGallery = new BasemapGallery({
          view: view,
        });

        let basemapExpand = new Expand({
          view: view,
          content: basemapGallery,
        });

        // construct a new Zoom widget
        let zoom = new Zoom({
          view: view,
          container: "zoomDiv"
        });

        // Replace the default Zoom widget
        view.ui.remove("zoom");
        view.ui.add(zoom, "top-right");
        // Add the BasemapToggle
        view.ui.add(basemapExpand, "top-right");
        SAGE2_AppState.callFunctionInContainer("consolePrint", "Added expand to UI");

        // construct a graphics layer for holding our shared pointer
        let sharedPointerLayer = new GraphicsLayer();

        view.on("pointer-enter", function(event) {
          let point = view.toMap({x: event.x, y: event.y});
          let symbol = new SimpleMarkerSymbol({
            style: "cross",
            color: "black",
            size: "10px",
            outline: {
              color: "black",
              width: 2
            }
          });
          let pointerGraphic = new Graphic({
            geometry: point,
            symbol: symbol,
          });
          sharedPointerLayer.add(pointerGraphic);
          SAGE2_AppState.callFunctionInContainer("addSharedPointersToOtherInstances", {lat: point.latitude, long: point.longitude});
        })

        view.on("pointer-move", function(event) {
          SAGE2_AppState.callFunctionInContainer("consolePrint", `Pointer moved to (${event.x}, ${event.y}`);
          let point = view.toMap({x: event.x, y: event.y});
          SAGE2_AppState.callFunctionInContainer("consolePrint", `Pointer moved to map location (${point.latitude}, ${point.longitude})`);
          sharedPointerLayer.removeAll();
          let symbol = new SimpleMarkerSymbol({
            style: "cross",
            color: "black",
            size: "10px",
            outline: {
              color: "black",
              width: 2
            }
          });
          let pointerGraphic = new Graphic({
            geometry: point,
            symbol: symbol,
          });
          sharedPointerLayer.add(pointerGraphic);
          SAGE2_AppState.callFunctionInContainer("updateSharedPointersInOtherInstances", {lat: point.latitude, long: point.longitude});
        });

        view.on("pointer-leave", function(event) {
          sharedPointerLayer.removeAll();
          SAGE2_AppState.callFunctionInContainer("removeSharedPointersFromOtherInstances");
        });

        // Save references to our Map, View, and SharedLayer
        globalMap = map;
        globalView = view;
        globalSharedPointerLayer = sharedPointerLayer;

        // extract the layer title from its source url
        let layerTitle = getTitleFromURL(url);

        // Build the layer from source data and add to map
        let layer = null;
        switch(sourceType) {
          case "csv":
            layer = new CSVLayer({
              url: url,
              title: layerTitle,
            });
            break;
          case "geojson":
            layer = new GeoJSONLayer({
              url: url,
              title: layerTitle
            });
            break;
        }
        layer.when(function() {
          view.extent = layer.fullExtent;
          let fieldInfos = [];
          for (let field of layer.fields) {
            if (!field.name.includes('OBJECTID')) {
              fieldInfos.push({
                fieldName: field.name,
                label: field.name
              });
            }
          }
          let template = {
            content: [
              {
                type: "fields",
                fieldInfos: fieldInfos
              }
            ]
          };
          layer.popupTemplate = template;
        }, function() {
          SAGE2_AppState.callFunctionInContainer("consolePrint", "Webpage failed to set MapView to extent of loaded CSV data");
        });
        map.add(layer);

        // Add the Layer to the LayerList if needed
        if (!(layerTitle in globalLayers)) {
          addLayerToLayersList(layer);
        }

        // Add our layer to the lookup table
        globalLayers[layerTitle] = layer;

        // Add the shared pointer layer to the map
        map.add(sharedPointerLayer);

        // Check for additional layers from other App instances
        SAGE2_AppState.callFunctionInContainer("checkForLayersFromOtherApps");
  })
}

/**
 * This function adds CSV Data from another app instance
 * to the map contained in this app instance
 * @function addCSVDataToMap
 * @param {String} url The source url of the data being received
 */
function addCSVDataToMap(url) {
  require([
    "esri/layers/CSVLayer"
  ], function(CSVLayer) {
    let title = getTitleFromURL(url);
    var layer = new CSVLayer({
      url: url,
      title: title,
    });
    layer.when(function() {
      globalView.extent = layer.fullExtent;
      let fieldInfos = [];
      for (let field of layer.fields) {
        if (!field.name.includes('OBJECTID')) {
          fieldInfos.push({
            fieldName: field.name,
            label: field.name
          });
        }
      }
      let template = {
        content: [
          {
            type: "fields",
            fieldInfos: fieldInfos
          }
        ]
      };
      layer.popupTemplate = template;
    }, function() {
      SAGE2_AppState.callFunctionInContainer("consolePrint", "Webpage failed to set MapView to extent of loaded CSV data");
    });
    globalMap.add(layer);
    globalMap.remove(globalSharedPointerLayer);
    globalMap.add(globalSharedPointerLayer);
    if (!(title in globalLayers) && activeMenu == "Layers") {
      addLayerToLayersList(layer);
      globalLayers[title] = layer;
    } else if (!(title in globalLayers) && activeMenu != "Layers") {
      globalLayers[title] = layer;
    }
  });
}

/**
 * @function addClientDataToMap
 * Receives shared geojson (or json) data from another app instance
 * and adds it to the map in the appropriate layer type
 * @param {String} url The source url of the data being received
 */
function addClientDataToMap(url) {
  require([
    "esri/layers/GeoJSONLayer"
  ], function(GeoJSONLayer) {
    let title = getTitleFromURL(url);
    let layer = new GeoJSONLayer({
      url: url,
      title: title,
    });
    layer.when(function() {
      globalView.extent = layer.fullExtent;
      let fieldInfos = [];
      for (let field of layer.fields) {
        if (!field.name.includes('OBJECTID')) {
          fieldInfos.push({
            fieldName: field.name,
            label: field.name
          });
        }
      }
      let template = {
        content: [
          {
            type: "fields",
            fieldInfos: fieldInfos
          }
        ]
      };
      layer.popupTemplate = template;
    }, function() {
      SAGE2_AppState.callFunctionInContainer("consolePrint", "Webpage failed to set MapView to extent of loaded CSV data");
    });
    globalMap.add(layer);
    globalMap.remove(globalSharedPointerLayer);
    globalMap.add(globalSharedPointerLayer);
    if (!(title in globalLayers) && activeMenu == "Layers") {
      addLayerToLayersList(layer);
      globalLayers[title] = layer;
    } else if (!(title in globalLayers) && activeMenu != "Layers") {
      globalLayers[title] = layer;
    }
  })
}

/**
 * This function attaches the event handlers to the style controls
 * to ensure that they are bound to the currently active map layer
 * @function attachEventHandlersToLayerStyleControls
 * @param {String} layerName The name of the currently active layer
 */
function attachEventHandlersToLayerStyleControls(layerName) {
  let pointSlider = document.getElementById("pointSizeSlider");

  pointSlider.oninput = function() {
    let layer = globalLayers[layerName];
    let renderer = layer.renderer.clone();
    renderer.symbol.size = this.value;
    layer.renderer = renderer;
    let pointSizeLabel = document.getElementById("pointSizeLabel");
    pointSizeLabel.innerHTML = `<strong>${this.value}</strong>`;
  }

  let rSlider = document.getElementById("rslider");

  rSlider.oninput = function() {
    let layer = globalLayers[layerName];
    let renderer = layer.renderer.clone();
    renderer.symbol.color.r = this.value;
    layer.renderer = renderer;
  }

  let gSlider = document.getElementById("gslider");

  gSlider.oninput = function() {
    let layer = globalLayers[layerName];
    let renderer = layer.renderer.clone();
    renderer.symbol.color.g = this.value;
    layer.renderer = renderer;
  }

  let bSlider = document.getElementById("bslider");

  bSlider.oninput = function() {
    let layer = globalLayers[layerName];
    let renderer = layer.renderer.clone();
    renderer.symbol.color.b = this.value;
    layer.renderer = renderer;
  }

  let oSlider = document.getElementById("oslider");

  oSlider.oninput = function() {
    let layer = globalLayers[layerName];
    layer.opacity = this.value / 100;
    let label = document.getElementById("olabel");
    label.innerHTML = `<strong>${this.value}</strong>`;
  }

  let layerToggle = document.getElementById("layertoggle");
  let layer = globalLayers[layerName];
  layerToggle.onclick = function() {
    if (layerToggle.className === "on") {
      layer.visible = false;
      layerToggle.className = "off";
      layerToggle.innerHTML = 'Off  <i class="far fa-eye-slash"></i>';
    } else {
      layer.visible = true;
      layerToggle.className = "on";
      layerToggle.innerHTML = 'On  <i class="far fa-eye"></i>';
    }
  }
  if (layer.visible) {
    layerToggle.className = "on";
    layerToggle.innerHTML = 'On  <i class="far fa-eye"></i>';
  } else {
    layerToggle.className = "off";
    layerToggle.innerHTML = 'Off  <i class="far fa-eye-slash"></i>';
  }
}

/**
 * This function adds the name of the layer to the layer list
 * so that it may be selected from the UI
 * @function addLayerToLayersList
 * @param {Layer} layer The Layer to be added to the layerList
 */
function addLayerToLayersList(layer) {
  let layerList = document.getElementById("layersList");
  layerList.innerHTML += `<li>${layer.title}</li>`;
}

/**
 * Helper function for parsing out the layer title from
 * the source URL of its data (in most cases the file name)
 * @function getTitleFromURL
 * @param {String} url The source url of a data source
 */
function getTitleFromURL(url) {
  let layerTitleTokens = url.split('/');
  let fileNameToken = layerTitleTokens[layerTitleTokens.length - 1];
  let fileNameTokens = fileNameToken.split('.');
  if (fileNameTokens[0].length <= 10) {
    return fileNameTokens[0];
  } else {
    return fileNameTokens[0].slice(0, 10);
  }
}

/**
 * This function sets the focus of the top menu buttons
 * to the appropriate setting based on onclick events
 * @function focusTopMenuButton
 * @param {String} id The id of the menu button to be set
 * @param {String} focus The focus setting of the button
 */
function focusTopMenuButton(id, focus) {
  let button = document.getElementById(id);
  let buttonClassNames = button.className.split(' ');
  buttonClassNames[2] = focus;
  button.className = buttonClassNames.join(' ');
}

/**
 * This function is used to add a shared pointer from another
 * app instance at the specified coordinates on the map
 * @function addSharedPointer
 * @param {Object} coords Object containing the lat/long coords of the pointer
 */
function addSharedPointer(coords) {
  SAGE2_AppState.callFunctionInContainer("consolePrint", "Adding shared pointer");
  require([
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Graphic",
    "esri/geometry/Point"
  ], function(SimpleMarkerSymbol, Graphic, Point) {
    let point = new Point({
      latitude: coords.lat,
      longitude: coords.long
    });

   let symbol = new SimpleMarkerSymbol({
    style: "cross",
    color: "black",
    size: "32px",
    outline: {
      color: "black",
      width: 2
    }
  });

    let graphic = new Graphic({
      geometry: point,
      symbol: symbol
    });

    globalSharedPointerLayer.add(graphic);

  })
}

/**
 * This function is used to update the lat/long position of the shared
 * pointer shared to this application from another instance
 * @function updateSharedPointer
 * @param {Object} coords Object containing the updated lat/long
 */
function updateSharedPointer(coords) {
  SAGE2_AppState.callFunctionInContainer("consolePrint", "Updating shared pointer");
  globalSharedPointerLayer.removeAll();
  addSharedPointer(coords);
}

/**
 * Removes the shared pointer from this app instance
 * @function removeSharedPointer
 */
function removeSharedPointer() {
  SAGE2_AppState.callFunctionInContainer("consolePrint", "Removing shared pointer");
  globalSharedPointerLayer.removeAll();
}

/**
 * Helper function to print the types of the data fields
 * in the currently active layer
 * @function printFieldTypes
 * @param {String} layerName The name of the currently active Layer
 */
function printFieldTypes(layerName) {
  for (let field of globalLayers[layerName].fields) {
    SAGE2_AppState.callFunctionInContainer("consolePrint", `Field ${field.name} has type ${field.type}`);
  }
}

function applyFilterToLayer(layerName, filterString) {
  SAGE2_AppState.callFunctionInContainer("consolePrint", "Adding filter " + filterString);
  let layer = globalLayers[layerName];
  layer.definitionExpression = filterString;
}

function clearFilterFromLayer(layerName) {
  let layer = globalLayers[layerName];
  layer.definitionExpression = '';
}