// Lazy loader for face-api.js to improve initial app load time
let faceApiLoaded = false;
let faceApiPromise: Promise<typeof import('face-api.js')> | null = null;

export const loadFaceApi = async () => {
  if (faceApiLoaded) {
    return await import('face-api.js');
  }

  if (faceApiPromise) {
    await faceApiPromise;
    return await import('face-api.js');
  }

  faceApiPromise = (async () => {
    const faceapi = await import('face-api.js');
    
    const MODEL_URL = '/models';
    
    // Check if models are available
    try {
      const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
      if (!response.ok) {
        throw new Error('Face recognition models not found');
      }
      
      // Load models in parallel
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      faceApiLoaded = true;
      return faceapi;
    } catch (error) {
      faceApiPromise = null; // Reset promise on error
      throw error;
    }
  })();

  await faceApiPromise;
  return await import('face-api.js');
};

export const isFaceApiLoaded = () => faceApiLoaded;
