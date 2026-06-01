/**
 * Capture a single JPEG frame from the device camera for SOS evidence.
 */
export async function captureSosPhoto() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera is not available on this device');
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;

  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Could not start camera'));
    video.play().catch(reject);
  });

  await new Promise((r) => setTimeout(r, 400));

  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);

  stream.getTracks().forEach((t) => t.stop());

  const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
  return { dataUrl, mimeType: 'image/jpeg' };
}
