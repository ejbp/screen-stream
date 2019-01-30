var os = require('os')
var exec = require('exec-stream')
var spawn = require('child_process').spawn

module.exports = function (opts) {

  var cmd = "ffmpeg"

  opts = opts || {}
  opts.fps = opts.fps || 24
  opts.resolution = opts.resolution || '1280×720'
  opts.threads = opts.threads || 1
  opts.bitrateKbps = opts.bitrateKbps || "2M" //2000k
  opts.bufSize = opts.bufSize || "1M" //2000k
  opts.audioRate = opts.audioRate || 44100 //44100
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
  
  //ffmpeg -use_wallclock_as_timestamps 1 -i input.dv -f lavfi -use_wallclock_as_timestamps 1 -i "aevalsrc=0:c=2:s=48000" \
       //-filter_complex "[0:a][1:a]amerge[a]" -map 0:v -map "[a]"  -c:v libx264 -b:v 4000k -c:a aac -b:a 128k -ac 2 -shortest method3.ts

  ///opt/local/bin/ffmpeg -i complaint.flv -f mp4 -vcodec libx264 -acodec aac -copyts -strict experimental -fpre /opt/local/share/ffmpeg/libx264-lossless_slow.ffpreset -ab 44k -threads 0 -crf 23 complaint.mp4

  var params = [
    '-use_wallclock_as_timestamps', 1,
    '-f',           opts.captureVideoDevice,
    '-s',           opts.resolution,
    '-r',           opts.fps,
    '-i',           opts.display,
    '-f',           'alsa',
    '-i',           'pulse',
    '-f',           opts.encodingFormat,
    '-use_wallclock_as_timestamps', 1,
    '-ac',          '2',
    '-ar',          opts.audioRate,
    '-af',          `aresample=async=1000`,
    //'-async',        1,
    '-vcodec',      opts.videoCodec,
    '-g',           opts.fps * 2,
    '-keyint_min',  opts.fps,
    '-b:v',         opts.bitrateKbps,
    //'-minrate',     opts.bitrateKbps,
    '-maxrate',     opts.bitrateKbps,
    '-pix_fmt',     'yuv420p',
    '-s',           opts.resolution,
    '-preset',      'ultrafast',
    '-tune',        'zerolatency', //film && //animation
    '-acodec',      'libmp3lame',
    '-threads',     opts.threads,
    '-strict',      'normal',
    '-bufsize',     opts.bufSize
  ]


  if ( opts.encodingFormat == 'flv' ) {
    params.push(`rtmp://localhost/live/${opts.token}`)
  }else {
    params.push('pipe:1'); //proc.stdout
  }

  console.log(cmd + " " + params.join(" "));

  const proc = spawn(cmd, params);

  proc.on('data', (...arguments)=>{
    console.log(arguments)
  });

  return proc; 
}
