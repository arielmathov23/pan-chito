// Popup script for extension popup.html

document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const statusMessage = document.getElementById('status-message');
  const noContentDiv = document.getElementById('no-content');
  const hasContentDiv = document.getElementById('has-content');
  
  const guideStatus = document.getElementById('guide-status');
  const stepsStatus = document.getElementById('steps-status');
  const promptStatus = document.getElementById('prompt-status');
  
  // Check stored content
  await updateContentStatus();
  
  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    // If we detect changes, show a status message
    let changeMessages = [];
    
    if (changes.guide) {
      const action = changes.guide.newValue ? 'copied' : 'cleared';
      changeMessages.push(`Guide ${action}`);
    }
    
    if (changes.steps) {
      const action = changes.steps.newValue ? 'copied' : 'cleared';
      changeMessages.push(`Steps ${action}`);
    }
    
    if (changes.prompt) {
      const action = changes.prompt.newValue ? 'copied' : 'cleared';
      changeMessages.push(`Prompt ${action}`);
    }
    
    if (changeMessages.length > 0) {
      const type = changes.guide?.newValue || changes.steps?.newValue || changes.prompt?.newValue 
        ? 'success' : 'error';
      showStatusMessage(changeMessages.join(', '), type);
    }
    
    // Update the UI
    updateContentStatus();
  });
  
  // Function to update UI based on stored content
  async function updateContentStatus() {
    try {
      const storage = await chrome.storage.local.get(['guide', 'steps', 'prompt']);
      
      const hasGuide = !!storage.guide;
      const hasSteps = !!storage.steps;
      const hasPrompt = !!storage.prompt;
      
      // Add subtle animation to status updates
      animateStatusUpdate(guideStatus, hasGuide);
      animateStatusUpdate(stepsStatus, hasSteps);
      animateStatusUpdate(promptStatus, hasPrompt);
      
      // Show/hide content divs with animation
      if (hasGuide || hasSteps || hasPrompt) {
        if (noContentDiv.classList.contains('hidden') === false) {
          fadeOut(noContentDiv, () => {
            noContentDiv.classList.add('hidden');
            fadeIn(hasContentDiv);
            hasContentDiv.classList.remove('hidden');
          });
        }
      } else {
        if (hasContentDiv.classList.contains('hidden') === false) {
          fadeOut(hasContentDiv, () => {
            hasContentDiv.classList.add('hidden');
            fadeIn(noContentDiv);
            noContentDiv.classList.remove('hidden');
          });
        }
      }
    } catch (error) {
      console.error('Error checking stored content:', error);
      showStatusMessage('Error checking stored content', 'error');
    }
  }
  
  // Function to animate status updates
  function animateStatusUpdate(element, hasContent) {
    const wasReady = element.classList.contains('ready');
    const textContent = element.textContent;
    
    // Only animate if the state is changing
    if ((wasReady && !hasContent) || (!wasReady && hasContent)) {
      fadeOut(element, () => {
        updateStatusElement(element, hasContent);
        fadeIn(element);
      });
    } else {
      updateStatusElement(element, hasContent);
    }
  }
  
  // Function to update status elements
  function updateStatusElement(element, hasContent) {
    if (hasContent) {
      element.textContent = 'Copied';
      element.classList.add('ready');
    } else {
      element.textContent = 'Not copied';
      element.classList.remove('ready');
    }
  }
  
  // Helper function to fade out an element
  function fadeOut(element, callback) {
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    
    setTimeout(() => {
      if (callback) callback();
    }, 300);
  }
  
  // Helper function to fade in an element
  function fadeIn(element) {
    element.style.transition = 'opacity 0.3s ease';
    element.style.opacity = '0';
    
    // Force a reflow to ensure the transition works
    element.offsetHeight;
    
    element.style.opacity = '1';
  }
  
  // Function to show status message
  function showStatusMessage(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = type;
    
    // Clear message after 3 seconds
    setTimeout(() => {
      statusMessage.style.opacity = '0';
      setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = '';
        statusMessage.style.opacity = '';
      }, 300);
    }, 3000);
  }
}); 