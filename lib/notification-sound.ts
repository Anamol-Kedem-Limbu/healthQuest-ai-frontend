/**
 * Generate and play notification sounds using Web Audio API
 * Falls back to system sounds if available
 */

export function playNotificationSound(type: 'success' | 'info' | 'warning' | 'error' = 'success') {
  try {
    // Try to use Web Audio API for better control
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create oscillator for different tones based on type
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set frequency and duration based on notification type
    let frequency = 800; // Default for success
    let duration = 0.3;
    
    if (type === 'success') {
      frequency = 800;
      duration = 0.3;
      // Play two tones for success
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.15);
    } else if (type === 'info') {
      frequency = 600;
      duration = 0.2;
    } else if (type === 'warning') {
      frequency = 400;
      duration = 0.4;
    } else if (type === 'error') {
      frequency = 300;
      duration = 0.5;
    }
    
    // Set volume
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Silently fail if Web Audio API is not available
    console.debug('Notification sound unavailable:', e);
  }
}

export function playHealthTipSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(720, audioContext.currentTime + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(620, audioContext.currentTime + 0.18);

    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.28);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    console.debug('Health tip sound unavailable:', e);
  }
}

export function playSuccessSound() {
  playNotificationSound('success');
}

export function playWarningSound() {
  playNotificationSound('warning');
}

export function playErrorSound() {
  playNotificationSound('error');
}

export function playInfoSound() {
  playNotificationSound('info');
}
