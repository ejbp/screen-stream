var os = require('os')
var exec = require('exec-stream')
var spawn = require('child_process').spawn

module.exports = function (opts) {

  var cmd = "ffmpeg"

  opts = opts || {}
  opts.fps = opts.fps || 30
  opts.resolution = opts.resolution || '1440x900'
  opts.threads = opts.threads || 2
  opts.bitrateKbps = opts.bitrateKbps || "2000k"
  opts.bufSize = opts.bufSize || opts.bitrateKbps
  opts.audioRate = opts.audioRate || 44100
  opts.videoCodec = opts.videoCodec || 'libx264'
  opts.encodingFormat = opts.encodingFormat || 'matroska'

  // Platform-specific junk
  if (os.platform() === 'linux') {
    opts.captureVideoDevice = "x11grab"
    opts.captureAudioDevice = "pulse"
    opts.display = opts.display || ":0.0"
  } else {
    throw new Error(os.platform() + ' not yet supported!')
  }

  //ffmpeg -f x11grab -r 25 -s 800x450 -i :0.0+0,60 -f alsa  -i plughw:1,0 -vcodec libx264 -crf 0 -preset ultrafast -acodec pcm_s16le file.mkv
  
  var params = [
    '-f',           opts.captureVideoDevice,
    '-s',           opts.resolution,
    '-r',           opts.fps,
    '-i',           opts.display,
    '-f',           'alsa',
    '-i',           'pulse',
    '-f',           opts.encodingFormat,
    '-ac',          '2',
    '-ar',          opts.audioRate,
    '-vcodec',      opts.videoCodec,
    '-g',           opts.fps * 2,
    '-keyint_min',  opts.fps,
    '-b:v',         opts.bitrateKbps,
    '-minrate',     opts.bitrateKbps,
    '-maxrate',     opts.bitrateKbps,
    '-pix_fmt',     'yuv420p',
    '-s',           opts.resolution,
    '-preset',      'ultrafast',
    '-tune',        'zerolatency', //film
    '-acodec',      'libmp3lame',
    '-threads',     opts.threads,
    '-strict',      'normal',
    '-bufsize',     opts.bufSize
  ]


  if ( opts.encodingFormat == 'flv' ) {
    params.push(`rtmp://localhost/live/${opts.token}`)
  }else {
    params.push('pipe:1');
  }

  console.log(cmd + " " + params.join(" "));

  const proc = spawn(cmd, params);
  return proc;
}
