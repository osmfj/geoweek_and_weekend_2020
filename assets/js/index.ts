import mapboxgl from 'mapbox-gl'

const map = new mapboxgl.Map({
  container: 'map',
  style: 'https://tile2.openstreetmap.jp/styles/osm-bright/style.json',
  center: [139.767184, 35.680952],
  zoom: 17
})

const context = new AudioContext()
let musicBuffer = null;
let bufferSource = null;

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
      bufferSource.start(context.currentTime + 0.100)
    })
  }
  request.send()
}

const btn = document.getElementById('button')
btn.addEventListener('click', () => {
  if (musicBuffer == null) {
    loadSound('https://archive.org/download/OTMN051/3_memory-of-the-cartridge.mp3')
  } else {
    !bufferSource || bufferSource.stop()
  }
}, false);

