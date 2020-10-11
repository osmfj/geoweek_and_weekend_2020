import mapboxgl from 'mapbox-gl'

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tile2.openstreetmap.jp/styles/osm-bright/style.json',
  center: [139.767184, 35.680952],
  zoom: 16,
  pitch: 55,
})
window.AudioContext = window.AudioContext || window.webkitAudioContext
const context = new AudioContext()
let musicBuffer = null;
let bufferSource = null;
const analyser = context.createAnalyser()
analyser.minDecibels = -90
analyser.maxDecibels = -10
analyser.smoothingTimeConstant = 0.05

const loadSound = (url: string) => {
  const request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer'

  request.onload = () => {
    context.decodeAudioData(request.response, (buffer) => {
      musicBuffer = buffer
      bufferSource = context.createBufferSource()
      bufferSource.buffer = buffer
      bufferSource.connect(context.destination)
      bufferSource.connect(analyser)
      bufferSource.start(context.currentTime + 0.100)
    })
  }
  request.send()
}
let dataArray = null;
const bins = 16

map.on('load', () => {
  const maxHeight = 200
  const binWidth = maxHeight / bins
   
  // Divide the buildings into 16 bins based on their true height, using a layer filter.
  for (let i = 0; i < bins; i++) {
    map.addLayer({
      'id': '3d-buildings-' + i,
      'source': 'openmaptiles',
      'source-layer': 'building',
      'filter': [
        'all',
        ['>', 'render_height', i * binWidth],
        ['<=', 'render_height', (i + 1) * binWidth]
      ],
      'type': 'fill-extrusion',
      'paint': {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height-transition': {
          duration: 0,
          delay: 0
        },
        'fill-extrusion-opacity': 0.6
      }
    })
  }
  analyser.fftSize = bins * 2
  dataArray = new Uint8Array(bins)
})

const draw = (now) => {
  analyser.getByteFrequencyData(dataArray)
  let avg = 0
  for (let i = 0; i < bins; i++) {
    avg += dataArray[i]
    map.setPaintProperty(
      '3d-buildings-' + i,
      'fill-extrusion-height',
      10 + 4 * i + dataArray[i]
    )
  }
  avg /= bins
  map.setBearing(now / 500)
  map.setLight({
    color:
      'hsl(' +
      ((now / 100) % 360) +
      ',' +
      Math.min(50 + avg / 4, 100) +
      '%,50%)',
      intensity: Math.min(1, (avg / 256) * 10)
  })

  requestAnimationFrame(draw)
}

const btn = document.getElementById('button')
btn.addEventListener('click', () => {
  if (musicBuffer == null) {
    loadSound('https://archive.org/download/OTMN051/3_memory-of-the-cartridge.mp3')
    requestAnimationFrame(draw)
  } else {
    !bufferSource || bufferSource.stop()
  }
}, false);

