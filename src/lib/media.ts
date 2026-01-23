import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegSingleton: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

const getFfmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    // Load core from CDN to keep initial bundle small (loaded only when a video is processed)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegSingleton = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoadPromise;
};

export const isLikelyVideoFile = (file: File): boolean => {
  if (file.type.startsWith('video/')) return true;
  return /\.(mp4|mov|mkv|webm|ogg)$/i.test(file.name);
};

export const extractAudioFromVideoToWavFile = async (videoFile: File): Promise<File> => {
  const ffmpeg = await getFfmpeg();

  const inputName = `input_${Date.now()}_${videoFile.name.replace(/[^a-z0-9_.-]/gi, '_')}`;
  const baseName = videoFile.name.replace(/\.[^/.]+$/, '') || 'audio';
  const outputName = `output_${Date.now()}.wav`;

  await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

  // Extract audio only, downmix to mono, 16kHz to keep WAV smaller.
  // Note: WAV is still larger than MP3, but this dramatically shrinks typical video uploads.
  await ffmpeg.exec([
    '-i', inputName,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-acodec', 'pcm_s16le',
    outputName,
  ]);

  const wavData = await ffmpeg.readFile(outputName);

  // Cleanup best-effort
  try { await ffmpeg.deleteFile(inputName); } catch {}
  try { await ffmpeg.deleteFile(outputName); } catch {}

  const bytes = typeof wavData === 'string' ? new TextEncoder().encode(wavData) : (wavData as Uint8Array);
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'audio/wav' });
  return new File([blob], `${baseName}.wav`, { type: 'audio/wav' });
};
