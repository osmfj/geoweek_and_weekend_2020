import mapboxgl from 'mapbox-gl'

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tile2.openstreetmap.jp/styles/osm-bright/style.json',
  center: [139.767184, 35.680952],
  zoom: 16,
  pitch: 55,
})
const context = new (window.AudioContext || window.webkitAudioContext)()
let musicBuffer = null;
const bins = 16
const analyser = context.createAnalyser()
analyser.minDecibels = -90
analyser.maxDecibels = -10
analyser.smoothingTimeConstant = 0.05
analyser.fftSize = bins * 2
let bufferSource;
let loaded = false
let playing = false

const playSilence = () => {
  const buf = context.createBuffer(1, 1, 22050);
  const src = context.createBufferSource();
  src.buffer = buf;
  src.connect(context.destination);
  src.start(0);
}

const play = (buffer) => {
  bufferSource = context.createBufferSource()
  bufferSource.buffer = buffer
  bufferSource.loop = true
  bufferSource.connect(context.destination)
  bufferSource.connect(analyser)
  bufferSource.start(context.currentTime + 0.100)
}

const loadSound = (url: string) => {
  // play silent
  playSilence()

  const request = new XMLHttpRequest()
  request.open('GET', url, true)
  request.responseType = 'arraybuffer'

  request.onload = () => {
    context.decodeAudioData(request.response, (buffer) => {
      loaded = true
      musicBuffer = buffer
      if (playing) {
        play(musicBuffer)
      }
    })
  }
  request.send()
}
let dataArray = null;

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
  dataArray = new Uint8Array(bins)
})

let requestId = null

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

  requestId = requestAnimationFrame(draw)
}

const btn = document.getElementById('button')
btn.addEventListener('click', () => {
  if (!playing) {
    if (!loaded) {
      loadSound('https://archive.org/download/OTMN051/3_memory-of-the-cartridge.mp3')
    } else {
      playSilence()
      play(musicBuffer)
    }
    requestId = requestAnimationFrame(draw)
    btn.textContent = 'Stop'
  } else {
    if (loaded) {
      !bufferSource || bufferSource.stop()
      bufferSource = null
    }
    cancelAnimationFrame(requestId)
    requestId = null
    btn.textContent = 'Play'
  }
  playing = !playing
}, false);

