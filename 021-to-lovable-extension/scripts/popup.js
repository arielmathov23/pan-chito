// Popup script for extension popup.html

document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const statusMessage = document.getElementById('status-message');
  const noContentDiv = document.getElementById('no-content');
  const hasContentDiv = document.getElementById('has-content');
  
  const guideStatus = document.getElementById('guide-status');
  const stepsStatus = document.getElementById('steps-status');
  const promptStatus = document.getElementById('prompt-status');
  
  const pasteGuideBtn = document.getElementById('paste-guide');
  const pasteStepsBtn = document.getElementById('paste-steps');
  const pastePromptBtn = document.getElementById('paste-prompt');
  const copyAllBtn = document.getElementById('copy-all');
  
  // Check stored content
  await updateContentStatus();
  
  // Add event listeners
  pasteGuideBtn.addEventListener('click', () => sendPasteMessage('guide'));
  pasteStepsBtn.addEventListener('click', () => sendPasteMessage('steps'));
  pastePromptBtn.addEventListener('click', () => sendPasteMessage('prompt'));
  copyAllBtn.addEventListener('click', requestCopyAllContent);
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    updateContentStatus();
  });
  
  // Function to update UI based on stored content
  async function updateContentStatus() {
    try {
      const storage = await chrome.storage.local.get(['guide', 'steps', 'prompt']);
      
      const hasGuide = !!storage.guide;
      const hasSteps = !!storage.steps;
      const hasPrompt = !!storage.prompt;
      
      // Update status text and class
      updateStatusElement(guideStatus, hasGuide);
      updateStatusElement(stepsStatus, hasSteps);
      updateStatusElement(promptStatus, hasPrompt);
      
      // Update button states
      pasteGuideBtn.disabled = !hasGuide;
      pasteStepsBtn.disabled = !hasSteps;
      pastePromptBtn.disabled = !hasPrompt;
      
      // Show/hide content divs
      if (hasGuide || hasSteps || hasPrompt) {
        noContentDiv.classList.add('hidden');
        hasContentDiv.classList.remove('hidden');
      } else {
        noContentDiv.classList.remove('hidden');
        hasContentDiv.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error checking stored content:', error);
      showStatusMessage('Error checking stored content', 'error');
    }
  }
  
  // Function to update status elements
  function updateStatusElement(element, hasContent) {
    if (hasContent) {
      element.textContent = 'Ready to paste';
      element.classList.add('ready');
    } else {
      element.textContent = 'Not copied';
      element.classList.remove('ready');
    }
  }
  
  // Function to first check if content script is ready, then send message
  async function ensureContentScriptLoaded(tabId) {
    return new Promise((resolve, reject) => {
      // First try a simple ping to see if content script is ready
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, response => {
        if (chrome.runtime.lastError) {
          // The content script isn't ready yet or there was an error
          // We'll need to inject it
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['scripts/lovable-content.js']
          })
          .then(() => {
            // Now add the CSS
            return chrome.scripting.insertCSS({
              target: { tabId: tabId },
              files: ['styles/lovable-styles.css']
            });
          })
          .then(() => resolve())
          .catch(error => reject(error));
        } else {
          // Content script is ready
          resolve();
        }
      });
    });
  }
  
  // Function to send paste message to content script
  async function sendPasteMessage(contentType) {
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      // Check if we're on Lovable
      if (!currentTab.url.includes('lovable.dev')) {
        showStatusMessage('Please navigate to lovable.dev to paste content', 'error');
        return;
      }
      
      // Make sure content script is loaded
      await ensureContentScriptLoaded(currentTab.id);
      
      // Send message to show paste UI
      await chrome.tabs.sendMessage(currentTab.id, { action: 'showPasteUI' });
      
      // Close popup
      window.close();
    } catch (error) {
      console.error('Error sending paste message:', error);
      showStatusMessage('Error connecting to page. Try refreshing.', 'error');
    }
  }
  
  // Function to request all content to be copied (from current page if on from021.io)
  async function requestCopyAllContent() {
    try {
      // Get current active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (currentTab.url.includes('from021.io')) {
        // If on from021.io, check if we're on implementation page
        try {
          const response = await chrome.tabs.sendMessage(currentTab.id, { action: 'checkPageType' });
          
          if (response && response.isImplementationPage) {
            // If on implementation page, request content extraction
            try {
              const extractResult = await chrome.tabs.sendMessage(currentTab.id, { action: 'extractAndStoreContent' });
              
              if (extractResult && extractResult.success) {
                showStatusMessage('Content copied successfully!', 'success');
                updateContentStatus();
              } else {
                showStatusMessage(extractResult.error || 'Failed to extract content', 'error');
              }
            } catch (err) {
              showStatusMessage('Error communicating with page, try refreshing', 'error');
            }
          } else {
            showStatusMessage('Navigate to an implementation guide page to copy content', 'error');
          }
        } catch (err) {
          showStatusMessage('Content script not loaded. Try refreshing the page.', 'error');
        }
      } else {
        showStatusMessage('Navigate to from021.io to copy content', 'error');
      }
    } catch (error) {
      console.error('Error requesting content copy:', error);
      showStatusMessage('Error communicating with page', 'error');
    }
  }
  
  // Function to show status message
  function showStatusMessage(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = type;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = '';
    }, 3000);
  }
}); 