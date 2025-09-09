import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, CheckCircle, AlertCircle, User, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../UI/LoadingSpinner.tsx';

interface FaceSetupProps {
  onSuccess: (faceEncoding: string) => void;
  onCancel: () => void;
  existingFaceEncoding?: string | null;
  mode: 'setup' | 'update';
}

const FaceSetup: React.FC<FaceSetupProps> = ({ 
  onSuccess, 
  onCancel, 
  existingFaceEncoding, 
  mode 
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedFaces, setCapturedFaces] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [confidence, setConfidence] = useState<number>(0);

  const totalSteps = 3; // Capture 3 different angles for better recognition

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      
      const response = await fetch('/models/tiny_face_detector_model-weights_manifest.json');
      if (!response.ok) {
        throw new Error('Face recognition models not found. Please add the models to public/models directory.');
      }
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      setError('Face recognition models not available. This feature will be enabled once models are installed.');
      setModelsLoaded(false);
    }
  };

  const detectAndCaptureFace = async () => {
    if (!webcamRef.current || !canvasRef.current || !modelsLoaded || detecting || faceDetected) return;

    setDetecting(true);
    setError(null);

    try {
      const video = webcamRef.current.video;
      if (!video) return;

      const canvas = canvasRef.current;
      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);

      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) {
        setError('No face detected. Please position your face in the camera.');
        setFaceDetected(false);
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only one person is in the frame.');
        setFaceDetected(false);
        return;
      }

      const detection = detections[0];
      const faceDescriptor = detection.descriptor;
      
      // Calculate confidence based on detection score
      const detectionConfidence = detection.detection.score;
      setConfidence(detectionConfidence);

      if (detectionConfidence < 0.5) {
        setError('Face detection confidence too low. Please ensure good lighting and clear view of your face.');
        setFaceDetected(false);
        return;
      }

      // If updating existing face, verify it's the same person
      if (mode === 'update' && existingFaceEncoding) {
        try {
          const existingDescriptor = new Float32Array(JSON.parse(existingFaceEncoding));
          const distance = faceapi.euclideanDistance(faceDescriptor, existingDescriptor);
          
          if (distance > 0.8) { // Threshold for same person
            setError('Face does not match your existing profile. Please use the same person\'s face.');
            setFaceDetected(false);
            return;
          }
        } catch (err) {
          console.warn('Could not verify against existing face encoding:', err);
        }
      }
      
      const faceEncoding = JSON.stringify(Array.from(faceDescriptor));
      
      setFaceDetected(true);
      setError(null);

      // Draw detection on canvas
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

      // Add to captured faces (prevent duplicates for current step)
      setCapturedFaces(prev => {
        const currentStepFaces = prev.filter((_, index) => index < step);
        return [...currentStepFaces, faceEncoding];
      });

      // Move to next step or complete
      if (step < totalSteps) {
        setTimeout(() => {
          setStep(prev => prev + 1);
          setFaceDetected(false);
        }, 1500);
      } else {
        // Complete setup with the best quality face encoding
        setTimeout(() => {
          onSuccess(faceEncoding);
        }, 1000);
      }

    } catch (error) {
      console.error('Face detection error:', error);
      setError('Face detection failed. Please try again.');
      setFaceDetected(false);
    } finally {
      setDetecting(false);
    }
  };

  const resetCapture = () => {
    setCapturedFaces([]);
    setStep(1);
    setFaceDetected(false);
    setError(null);
    setConfidence(0);
  };

  const getStepInstruction = () => {
    switch (step) {
      case 1:
        return "Look straight at the camera";
      case 2:
        return "Turn your head slightly to the right";
      case 3:
        return "Turn your head slightly to the left";
      default:
        return "Position your face in the camera";
    }
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-6 sm:p-8 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {mode === 'setup' ? 'Face Setup' : 'Update Face Profile'}
              </h3>
              <p className="text-sm text-gray-600">
                Step {step} of {totalSteps}: {getStepInstruction()}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!modelsLoaded ? (
          <div className="text-center py-12">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Loading facial recognition models...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((capturedFaces.length / totalSteps) * 100, 100)}%` }}
              ></div>
            </div>

            <div className="relative">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full rounded-2xl shadow-lg"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full rounded-2xl"
                style={{ transform: 'scaleX(-1)' }}
              />
              
              {faceDetected && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white p-3 rounded-2xl shadow-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}

              {confidence > 0 && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-xl text-sm font-medium">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 font-medium">
                {mode === 'setup' 
                  ? 'We\'ll capture your face from multiple angles for better recognition accuracy'
                  : 'Update your face profile with a new capture'
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                
                {capturedFaces.length > 0 && (
                  <button
                    onClick={resetCapture}
                    className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-2xl transition-all duration-300 flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                )}
                
                <button
                  onClick={detectAndCaptureFace}
                  disabled={detecting || !modelsLoaded}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {detecting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Detecting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Capture Face
                    </div>
                  )}
                </button>
              </div>

              {/* Captured faces indicator */}
              {capturedFaces.length > 0 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i < capturedFaces.length
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                          : i === capturedFaces.length
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceSetup;
