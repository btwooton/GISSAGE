
let globalMap = null;
let globalView = null;
let globalSharedPointerLayer = null;
let globalSelectedFeature = null;
let globalFilterQuery = "";
let globalLayers = {};
let activeMenu = "Layers";

let topMenuHTML = '<div class="topmenu"><img id="gis-logo" src="./assets/logo.png" height="70px" width="124px" style="height:65%; width:65%;"></img><i id="layer-button" class="fas fa-layer-group unfocused menu-button"></i>&nbsp;<i id="filter-button" class="fas fa-filter unfocused menu-button"></i></div><button id="hideSideBar"><span style="font-size: calc(1.25vw + 1.25vh);"><strong>&lt;</strong></span></button>';

let layerStyleMenuContainer0HTML = '<div class="menucontainer" id="zeroth"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layer Radius</h5><div class="inputcontainer"><input type="range" min="1" max="60" value="6" class="slider" id="pointSizeSlider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);" id="pointSizeLabel"><strong>6</strong></label></div></div>';

let layerStyleMenuContainer1HTML = '<div class="menucontainer" id="first"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Fill Color</h5><div class="inputcontainer"><input type="range" min="0" max="255" value="255" class="slider" id="rslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>R</strong></label><input type="range" min="0" max="255" value="140" class="slider" id="gslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>G</strong></label><input type="range" min="0" max="255" value="0" class="slider" id="bslider">&nbsp;<label style="color: white; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);"><strong>B</strong></label></div></div>';

let layerStyleMenuContainer2HTML = '<div class="menucontainer" id="second"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layer Opacity</h5><div class="inputcontainer"><input type="range" min="0" max="100" value="100" id="oslider" class="slider">&nbsp;<label style="color: #ffffff; font-family: Michroma, sans-serif; font-size: calc(.8vw + .8vh);" id="olabel"><strong>100</strong></label></div></div>';

let layerStyleMenuContainer3HTML = '<div class="menucontainer" id="third"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Toggle Layer</h5><div class="inputcontainer"><div id="layertoggle" class="on">On  <i class="far fa-eye"></i></div></div></div>';

let layerFilterMenuContainer0HTML = `<div class="menucontainer" id="zeroth">
<h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Select Feature</h5>
&nbsp; <select id="feature-select"></select>
</div>`;

let layerFilterMenuContainer1HTML = `<div class="menucontainer" id="first" style="display: none;"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Filter Query</h5><input type="text" id="filter-input" placeholder="Expression..."></input></div>`

let layerStyleItems = [
  layerStyleMenuContainer0HTML, 
  layerStyleMenuContainer1HTML,
  layerStyleMenuContainer2HTML,
  layerStyleMenuContainer3HTML
];

let filterMenuItems = [
  layerFilterMenuContainer0HTML,
  layerFilterMenuContainer1HTML
];

let layerHeaderContainerHTML = '<div class="layerheadercontainer"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Layers</h5><ul id="layersList"></ul></div>';

let filterContainerHTML = '<div class="filtercontainer"><h5 style="color: white; font-family: Michroma, sans-serif; font-size: calc(1vw + 1vh);">Filters</h5><ul id="layersList"></ul></div>';

let sidebarMenuHTML = {
  "Layers": topMenuHTML + layerHeaderContainerHTML,
  "Filters": topMenuHTML + filterContainerHTML,
  "LayerStyle": layerStyleItems.join(''),
  "FeatureFilter": filterMenuItems.join(''),
};

function constructTopMenu() {
  let sideBar = document.getElementById("sideBar");
  let sideBarButton = document.getElementById("hideSideBar");
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

  let layerButton = document.getElementById('layer-button');
  let filterButton = document.getElementById('filter-button');
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
    } else {
      return;
    }
  }

  
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
    } else {
      return;
    }
    layerButton.className = lbclassNames.join(' ');
    filterButton.className = fbclassNames.join(' ');
  }

  activeMenu === "Layers" && focusTopMenuButton('layer-button', 'focused');
  activeMenu === "Filters" && focusTopMenuButton('filter-button', 'focused');
  
}

function constructLayerStyleMenu(layerName) {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = topMenuHTML;
  sideBar.innerHTML += `<h5 id="layerNameHeader" style="color: white; font-family: Michroma, sans-serif; font-size: calc(0.9vw + 0.9vh);">Styling <span style="color: #A5EAAA;">${layerName}</span></h5>`;
  sideBar.innerHTML += sidebarMenuHTML[activeMenu];
  attachEventHandlersToLayerStyleControls(layerName);
  constructTopMenu();
}

function constructFeatureFilterMenu(layerName) {
  let sideBar = document.getElementById("sideBar");
  sideBar.innerHTML = topMenuHTML;
  sideBar.innerHTML += `<h5 id="layerNameHeader" style="color: white; font-family: Michroma, sans-serif; font-size: calc(0.9vw + 0.9vh);">Filter:  <span style="color: #A5EAAA;">${layerName}</span></h5>`;
  sideBar.innerHTML += sidebarMenuHTML[activeMenu];
  let featureSelect = document.getElementById("feature-select");
  for (let field of globalLayers[layerName].fields) {
    if (field.type === "double") {
      let option = document.createElement('option');
      option.innerHTML = field.name;
      option.value = field.name;
      option.className = 'select-option';
      featureSelect.appendChild(option);
    }
  }
  featureSelect.onchange = function(event) {
    let optionIndex = event.target.selectedIndex;
    let option = event.target.children[optionIndex]
    SAGE2_AppState.callFunctionInContainer("consolePrint", "On change detected with option " + option.innerHTML);
    let filterQueryContainer = document.getElementById("first");
    filterQueryContainer.style.display = "block";
    globalSelectedFeature = option.innerHTML;
    let filterQueryInput = document.getElementById("filter-input");
    filterQueryInput.onchange = function(event) {
      SAGE2_AppState.callFunctionInContainer("consolePrint", "On change detected with text " + filterQueryInput.value);
      globalFilterQuery = filterQueryInput.value;
      applyFilterToField(layerName, globalSelectedFeature, globalFilterQuery);
    }

  }
  constructTopMenu();
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
  let layerList = document.getElementById("layersList");
  let layerListObserver = new MutationObserver(function() {
    SAGE2_AppState.callFunctionInContainer("consolePrint", "New list item added to layersList");
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
          activeMenu = "LayerStyle";
          constructLayerStyleMenu(listItem.innerHTML);
          printFieldTypes(listItem.innerHTML);
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
 * This function constructs the Filters menu for the SideBar
 * @function constructFiltersMenu
 */
function constructFiltersMenu() {
  let sideBar = document.getElementById('sideBar');
  sideBar.innerHTML = sidebarMenuHTML["Filters"];
  let layerList = document.getElementById('layersList');
  let filterListObserver = new MutationObserver(function() {
    SAGE2_AppState.callFunctionInContainer("consolePrint", "New list item added to filterList");
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
          activeMenu = "FeatureFilter";
          constructFeatureFilterMenu(listItem.innerHTML);
        }
      }
    }
    for (let childNode of layerList.childNodes) {
      childNode.onmouseover = getMouseHandler(childNode, 'mouseover');
      childNode.onmouseout = getMouseHandler(childNode, 'mouseout');
      childNode.onclick = getMouseHandler(childNode, "mouseclick");
    }
  });
  filterListObserver.observe(layerList, {
    subtree: true,
    childList: true,
    characterData: true
  });
}

let sidebarMenuConstructors = {
  "Layers": constructLayersMenu,
  "Filters": constructFiltersMenu,
  "LayerStyle": constructLayerStyleMenu
};

window.addEventListener("DOMContentLoaded", function(event) {
  SAGE2_AppState.callFunctionInContainer("processDataFile");
  let sideBar = document.getElementById("sideBar");
  sidebarMenuConstructors[activeMenu]();
  constructTopMenu();
});

SAGE2_AppState.titleUpdate("GIS-SAGE");

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
            layer.when(function() {
              view.extent = layer.fullExtent;
              let fieldInfos = [];
              for (let field of layer.fields) {
                if (field.name !== "__OBJECTID") {
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
            break;
          case "geojson":
            layer = new GeoJSONLayer({
              url: url,
              title: layerTitle
            });
            layer.when(function() {
              view.extent = layer.fullExtent
            }, function() {
              SAGE2_AppState.callFunctionInContainer("consolePrint", "Webpage failed to set MapView to extent of loaded data");
            })
            map.add(layer);
            break;
        }

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

let addCSVDataToMap = function(url) {
  require([
    "esri/layers/CSVLayer"
  ], function(CSVLayer) {
    let title = getTitleFromURL(url);
    var layer = new CSVLayer({
      url: url,
      title: title,
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

let addClientDataToMap = function(url) {
  require([
    "esri/layers/GeoJSONLayer"
  ], function(GeoJSONLayer) {
    let title = getTitleFromURL(url);
    let layer = new GeoJSONLayer({
      url: url,
      title: title,
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

let attachEventHandlersToLayerStyleControls = function(layerName) {
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

function addLayerToLayersList(layer) {
  let layerList = document.getElementById("layersList");
  layerList.innerHTML += `<li>${layer.title}</li>`;
}

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

function focusTopMenuButton(id, focus) {
  let button = document.getElementById(id);
  let buttonClassNames = button.className.split(' ');
  buttonClassNames[2] = focus;
  button.className = buttonClassNames.join(' ');
}

function addSharedPointer(coords) {
  require([
    "esri/symbols/PictureMarkerSymbol",
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

function updateSharedPointer(coords) {
  globalSharedPointerLayer.removeAll();
  addSharedPointer(coords);
}

function removeSharedPointer() {
  globalSharedPointerLayer.removeAll();
}

function printFieldTypes(layerName) {
  for (let field of globalLayers[layerName].fields) {
    SAGE2_AppState.callFunctionInContainer("consolePrint", `Field ${field.name} has type ${field.type}`);
  }
}

function applyFilterToField(layerName, featureName, queryString) {
  let layer = globalLayers[layerName];
  layer.definitionExpression = `${featureName} ${queryString}`;
}