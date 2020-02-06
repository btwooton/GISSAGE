class TopMenu {
  constructor() {
    this.state = {
      layerFocus: 'focused',
      filterFocus: 'unfocused'
    }
  }

  render() {
    let { layerFocus, filterFocus } = this.state;
    return `
    <div class="topmenu">
      <img id="gis-logo" src="./assets/logo.png" height="70px" width="124px" style="height:65%; width:65%></img>
      <i id="layer-button" class="fas fa-layer-group ${layerFocus} menu-button"></i>
      &nbsp;
      <i id="filter-button" class="fas fa-filter ${filterFocus} menu-button"></i>
    </div>
    <button id="hideSideBar"><span style="font-size: calc(1.25vw + 1.25vh);"><strong>&lt;</strong></span></button>
      `;
  }
}