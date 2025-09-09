import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { X, Camera, AlertCircle, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import LoadingSpinner from '../UI/LoadingSpinner.tsx';

interface FacialRecognitionProps {
  onSuccess: (faceEncoding: string) => void;
  onCancel: () => void;
  mode?: 'checkin' | 'setup';
}

const FacialRecognition: React.FC<FacialRecognitionProps> = ({ onSuccess, onCancel, mode = 'checkin' }) => {
  const { profile } = useAuth();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'detecting' | 'verifying' | 'success' | 'failed'>('detecting');
  const [matchConfidence, setMatchConfidence] = useState<number>(0);

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

  const detectFace = async () => {
    if (!webcamRef.current || !canvasRef.current || !modelsLoaded) return;

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
        setError('No face detected. Please position your face clearly in the camera.');
        setFaceDetected(false);
        setVerificationStep('failed');
        return;
      }

      if (detections.length > 1) {
        setError('Multiple faces detected. Please ensure only one person is in the frame.');
        setFaceDetected(false);
        setVerificationStep('failed');
        return;
      }

      const detection = detections[0];
      
      // Check detection confidence
      if (detection.detection.score < 0.7) {
        setError('Face detection quality too low. Please ensure good lighting and clear view.');
        setFaceDetected(false);
        setVerificationStep('failed');
        return;
      }

      setFaceDetected(true);
      
      // Draw detection on canvas
      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }
        
      if (mode === 'setup') {
        // For setup mode, just return the face encoding
        const faceEncoding = Array.from(detection.descriptor);
        onSuccess(JSON.stringify(faceEncoding));
        return;
      }

      // For check-in mode, verify against stored face encoding
      if (profile?.face_encoding) {
        setVerificationStep('verifying');
        
        try {
          const storedDescriptor = new Float32Array(JSON.parse(profile.face_encoding));
          const currentDescriptor = detection.descriptor;
          
          // Calculate euclidean distance (lower = more similar)
          const distance = faceapi.euclideanDistance(currentDescriptor, storedDescriptor);
          const matchPercentage = Math.max(0, (1 - distance) * 100);
          
          setMatchConfidence(matchPercentage);
          
          // Very strict threshold - only allow extremely close matches
          const STRICT_THRESHOLD = 0.35; // Much stricter for security - requires ~65% similarity
          
          console.log(`Face verification: distance=${distance.toFixed(3)}, threshold=${STRICT_THRESHOLD}, match=${matchPercentage.toFixed(1)}%`);
          
          if (distance > STRICT_THRESHOLD) {
            setVerificationStep('failed');
            setError(`Access denied. Face does not match registered profile. (Match: ${matchPercentage.toFixed(1)}%)`);
            return;
          }
          
          // Success - face matches with high confidence
          setVerificationStep('success');
          setTimeout(() => {
            onSuccess(JSON.stringify(Array.from(currentDescriptor)));
          }, 1500);
          
        } catch (parseError) {
          setError('Invalid stored face encoding. Please set up facial recognition again.');
          setVerificationStep('failed');
        }
      } else {
        setError('No face encoding found. Please set up facial recognition first.');
        setVerificationStep('failed');
      }

    } catch (error) {
      console.error('Face detection error:', error);
      setError('Face detection failed. Please try again.');
      setFaceDetected(false);
      setVerificationStep('failed');
    } finally {
      setDetecting(false);
    }
  };

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-6 sm:p-8 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              {mode === 'checkin' ? (
                <Shield className="w-5 h-5 text-white" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {mode === 'checkin' ? 'Face Verification' : 'Facial Recognition'}
              </h3>
              <p className="text-sm text-gray-600">
                {mode === 'checkin' ? 'Verify your identity for check-in' : 'Capture your face for attendance'}
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
              
              {/* Status Indicators */}
              {verificationStep === 'detecting' && detecting && (
                <div className="absolute top-4 right-4 bg-blue-500 text-white p-3 rounded-2xl shadow-lg">
                  <Camera className="w-5 h-5 animate-pulse" />
                </div>
              )}
              
              {verificationStep === 'verifying' && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white p-3 rounded-2xl shadow-lg">
                  <Shield className="w-5 h-5 animate-spin" />
                </div>
              )}
              
              {verificationStep === 'success' && faceDetected && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white p-3 rounded-2xl shadow-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
              )}
              
              {mode === 'checkin' && matchConfidence > 0 && (
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-2 rounded-xl text-sm font-medium">
                  Match: {matchConfidence.toFixed(1)}%
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
            
            {/* Verification Status */}
            {mode === 'checkin' && verificationStep === 'verifying' && (
              <div className="flex items-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                <Shield className="w-5 h-5 text-amber-600 mr-3 animate-pulse" />
                <p className="text-sm text-amber-700 font-medium">Verifying your identity...</p>
              </div>
            )}
            
            {mode === 'checkin' && verificationStep === 'success' && (
              <div className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl">
                <UserCheck className="w-5 h-5 text-emerald-600 mr-3" />
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Identity verified successfully!</p>
                  <p className="text-xs text-emerald-600 mt-1">Match confidence: {matchConfidence.toFixed(1)}%</p>
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 font-medium">
                {mode === 'checkin' 
                  ? 'Position your face in the camera for identity verification'
                  : 'Position your face in the camera and click detect when ready'
                }
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={detectFace}
                  disabled={detecting || !modelsLoaded || verificationStep === 'success'}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  {detecting ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      {verificationStep === 'verifying' ? 'Verifying...' : 'Detecting...'}
                    </div>
                  ) : verificationStep === 'success' ? (
                    <div className="flex items-center justify-center">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Camera className="w-4 h-4 mr-2" />
                      {mode === 'checkin' ? 'Verify Identity' : 'Detect Face'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacialRecognition;
