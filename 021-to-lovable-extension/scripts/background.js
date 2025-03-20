// Background script for 021 Guide to Lovable extension

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // If we're on lovable.dev, toggle the paste UI
  if (tab.url.includes('lovable.dev')) {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'togglePasteUI' });
    } catch (error) {
      console.error('Error toggling paste UI:', error);
    }
  } else if (tab.url.includes('from021.io') || tab.url.includes('localhost')) {
    // On 021 site, check if the page is an implementation page
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPageType' });
      if (response && response.isImplementationPage) {
        // If it's an implementation page, show the modal
        await chrome.tabs.sendMessage(tab.id, { action: 'showModal' });
      }
    } catch (error) {
      console.error('Error checking page type:', error);
    }
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'contentCopied') {
    // Update badge when content is copied
    updateBadge();
  } else if (message.action === 'allContentCopied') {
    // Update badge when all content is copied
    updateBadge();
    
    // Show notification to user
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '021 Content Copied',
      message: 'All implementation guide content has been copied and is ready to paste in Lovable.',
      priority: 2
    });
  }
  
  return true; // Keep messaging channel open for async response
});

// Function to update extension badge
async function updateBadge() {
  try {
    // Check storage to see what's been copied
    const storage = await chrome.storage.local.get(['guide', 'steps', 'prompt']);
    
    // Count how many items are copied
    let count = 0;
    if (storage.guide) count++;
    if (storage.steps) count++;
    if (storage.prompt) count++;
    
    // Update badge text if items are copied
    if (count > 0) {
      chrome.action.setBadgeText({ text: count.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Initialize badge on startup
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Initialize badge on install
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
}); 