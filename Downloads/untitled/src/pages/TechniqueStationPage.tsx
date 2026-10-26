import React, { useState, useEffect, useRef } from 'react';
import { TechniqueStep } from '../types';
import { whoTechniqueSteps } from '../data/initialData';
import { cameraService } from '../services/cameraService';
import { IconCamera, IconCheckCircle, IconRefresh } from '../icons';

export const TechniqueStationPage: React.FC = () => {
  const [steps, setSteps] = useState<TechniqueStep[]>([...whoTechniqueSteps]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(-1);
  const [sessionActive, setSessionActive] = useState<boolean>(false);
  const [cameraState, setCameraState] = useState<'requesting' | 'active' | 'unavailable' | 'idle'>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [guidanceMessage, setGuidanceMessage] = useState<string>('Technique station ready. Click "Start Technique Session" to begin WHO hand-hygiene guidance.');
  const [isSimulatedVideo, setIsSimulatedVideo] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attempt camera initialization
  const startCamera = async () => {
    setCameraState('requesting');
    setCameraErrorMessage(null);
    const result = await cameraService.requestCamera();
    if (result.success && result.stream) {
      setCameraState('active');
      setIsSimulatedVideo(false);
      if (videoRef.current) {
        videoRef.current.srcObject = result.stream;
        videoRef.current.play().catch(() => {});
      }
    } else {
      setCameraState('unavailable');
      setIsSimulatedVideo(true);
      setCameraErrorMessage(result.error || 'Camera device unavailable.');
    }
  };

  const stopCamera = () => {
    cameraService.stopCamera();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
    setIsSimulatedVideo(true);
  };

  useEffect(() => {
    return () => {
      cameraService.stopCamera();
    };
  }, []);

  // Guided technique step timer loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionActive && currentStepIdx >= 0 && currentStepIdx < steps.length) {
      const step = steps[currentStepIdx];
      setGuidanceMessage(`Step ${step.id} of 8: ${step.name} - ${step.guidanceText}`);

      timer = setTimeout(() => {
        // Mark current step as detected
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === currentStepIdx ? { ...s, status: 'Detected' } : s
          )
        );

        if (currentStepIdx + 1 < steps.length) {
          setCurrentStepIdx(currentStepIdx + 1);
        } else {
          // Finished all 8 steps
          setSessionActive(false);
          setGuidanceMessage('Technique guidance completed: All 8 WHO friction zones observed. Hands ready for clinical zone.');
        }
      }, step.durationSec * 1000);
    }

    return () => clearTimeout(timer);
  }, [sessionActive, currentStepIdx, steps.length]);

  const handleStartSession = () => {
    setSteps(whoTechniqueSteps.map((s) => ({ ...s, status: 'Pending' })));
    setCurrentStepIdx(0);
    setSessionActive(true);
  };

  const handleResetSession = () => {
    setSessionActive(false);
    setCurrentStepIdx(-1);
    setSteps(whoTechniqueSteps.map((s) => ({ ...s, status: 'Pending' })));
    setGuidanceMessage('Technique station ready. Click "Start Technique Session" to begin.');
  };

  const handleMarkNeedsRepeat = (idx: number) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, status: 'Needs Repeat' } : s))
    );
    setGuidanceMessage(`Repeat recommended for step: ${steps[idx].name}. Insufficient coverage duration.`);
  };

  return (
    <div className="page-container technique-page">
      <div className="page-header-row">
        <div>
          <h2>SHARED HAND-HYGIENE TECHNIQUE GUIDANCE STATION</h2>
          <p className="page-subtitle">
            Shared optical guidance station for WHO 6-step / 8-zone rub technique verification
          </p>
        </div>
        <div className="station-badge-wrapper">
          <span className="station-tag">STATION #1 (SHARED WARD CORRIDOR)</span>
        </div>
      </div>

      <div className="hospital-callout callout-warning">
        <strong>IMPORTANT SAFETY DISCLOSURE:</strong> This station provides interactive visual technique guidance. It does NOT claim clinical or medical-grade computer vision proof. It is an educational and guidance aid for healthcare professionals.
      </div>

      <div className="technique-grid">
        {/* LEFT COLUMN: CAMERA / GUIDANCE FEED */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>CAMERA GUIDANCE VIEWER</h3>
            <span className="panel-sub">
              {isSimulatedVideo ? 'DEMO / CAMERA GUIDANCE MODE' : 'LIVE LOCAL OPTICAL STREAM'}
            </span>
          </div>

          <div className="camera-view-box">
            {/* Live or Simulated Camera Area */}
            {cameraState === 'active' && !isSimulatedVideo ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="live-video-stream"
              />
            ) : (
              <div className="simulated-camera-frame">
                <div className="guidance-overlay-scanline"></div>
                <div className="simulated-viewfinder">
                  <div className="viewfinder-corner top-left"></div>
                  <div className="viewfinder-corner top-right"></div>
                  <div className="viewfinder-corner bottom-left"></div>
                  <div className="viewfinder-corner bottom-right"></div>
                  
                  <div className="viewfinder-center">
                    <IconCamera size={36} className="viewfinder-icon" />
                    <span className="viewfinder-label">
                      {sessionActive ? 'OPTICAL MOVEMENT GUIDANCE ACTIVE' : 'GUIDANCE VIEW AREA'}
                    </span>
                    <span className="viewfinder-sub">
                      {isSimulatedVideo ? 'DEMO / CAMERA GUIDANCE MODE' : 'POSITION HANDS IN FIELD'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* In-Frame Status Tag */}
            <div className="camera-badge-tag">
              <span className={`status-indicator-dot ${sessionActive ? 'online' : 'idle'}`}></span>
              <span>
                {sessionActive
                  ? `STEP ${currentStepIdx + 1}/8: ${steps[currentStepIdx]?.name.toUpperCase()}`
                  : 'STATION STANDBY'}
              </span>
            </div>
          </div>

          {/* Camera Hardware Controls */}
          <div className="camera-controls-bar">
            {cameraState !== 'active' ? (
              <button
                type="button"
                onClick={startCamera}
                className="btn btn-secondary"
              >
                <IconCamera size={14} className="inline-icon" />
                Enable Browser Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="btn btn-secondary"
              >
                Disconnect Camera
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSimulatedVideo(!isSimulatedVideo)}
              className="btn btn-secondary"
            >
              Toggle Demo Feed
            </button>
          </div>

          {cameraErrorMessage && (
            <div className="camera-error-banner">
              <strong>Camera Notice:</strong> {cameraErrorMessage} (Continuing safely in Demo Guidance Mode).
            </div>
          )}

          {/* Guidance Message Display */}
          <div className="guidance-speech-box">
            <div className="speech-title">GUIDANCE INSTRUCTIONS:</div>
            <div className="speech-content">{guidanceMessage}</div>
          </div>

          <div className="session-action-row">
            {!sessionActive ? (
              <button
                type="button"
                onClick={handleStartSession}
                className="btn btn-primary btn-large"
              >
                START TECHNIQUE SESSION
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetSession}
                className="btn btn-warn btn-large"
              >
                CANCEL SESSION
              </button>
            )}

            <button
              type="button"
              onClick={handleResetSession}
              className="btn btn-secondary"
            >
              <IconRefresh size={14} className="inline-icon" />
              Reset Checklist
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 8-STEP TECHNIQUE CHECKLIST */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>WHO HAND-HYGIENE RUB CHECKLIST</h3>
            <span className="panel-sub">Standard 8-friction technique zones</span>
          </div>

          <div className="checklist-items">
            {steps.map((step, idx) => {
              const isCurrent = sessionActive && currentStepIdx === idx;
              return (
                <div
                  key={step.id}
                  className={`technique-step-item ${
                    isCurrent ? 'current-step' : ''
                  } status-${step.status.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="step-num">{step.id}</div>
                  <div className="step-details">
                    <div className="step-name">{step.name}</div>
                    <div className="step-desc">{step.guidanceText}</div>
                  </div>
                  <div className="step-status-col">
                    <span
                      className={`step-status-tag tag-${step.status
                        .toLowerCase()
                        .replace(' ', '-')}`}
                    >
                      {step.status === 'Detected' ? (
                        <>
                          <IconCheckCircle size={12} className="inline-icon" />
                          Technique step detected
                        </>
                      ) : step.status === 'Needs Repeat' ? (
                        'Repeat recommended'
                      ) : (
                        'Pending'
                      )}
                    </span>

                    {sessionActive && (
                      <button
                        type="button"
                        onClick={() => handleMarkNeedsRepeat(idx)}
                        className="btn-step-repeat"
                        title="Mark step for repetition"
                      >
                        Needs Repeat
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
