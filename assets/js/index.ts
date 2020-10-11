import mapboxgl from 'mapbox-gl'

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tile2.openstreetmap.jp/styles/osm-bright/style.json',
  center: [139.767184, 35.680952],
  zoom: 17
})