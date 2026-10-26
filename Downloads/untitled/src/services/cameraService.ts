// HYGIENIX Shared Technique Guidance Service

export interface CameraState {
  stream: MediaStream | null;
  hasPermission: boolean | null; // null: not asked, true: granted, false: denied/unavailable
  errorMessage: string | null;
  isDemoMode: boolean;
}

export class CameraService {
  private stream: MediaStream | null = null;

  async requestCamera(): Promise<{ success: boolean; stream: MediaStream | null; error?: string }> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return {
        success: false,
        stream: null,
        error: 'MediaDevices camera API not supported in this environment.',
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });
      this.stream = stream;
      return { success: true, stream };
    } catch (err: any) {
      const message =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied by user or system policy.'
          : 'Camera device unavailable or busy.';
      return {
        success: false,
        stream: null,
        error: message,
      };
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}

export const cameraService = new CameraService();
