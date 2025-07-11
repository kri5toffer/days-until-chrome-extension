// Handle audio playback in offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playSound') {
        console.log('Playing sound:', message.soundFile);
        
        // Create audio element and play MP3
        const audio = new Audio(message.soundFile);
        audio.volume = 0.7; // Set volume to 70%
        
        audio.play().then(() => {
            console.log('Audio started playing successfully');
            sendResponse({ success: true });
        }).catch((error) => {
            console.error('Error playing audio:', error);
            sendResponse({ success: false, error: error.message });
        });
        
        // Return true to indicate we'll respond asynchronously
        return true;
    }
});