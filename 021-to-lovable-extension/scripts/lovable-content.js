// Content script for Lovable
(() => {
  console.log("lovable-content.js loaded on: " + window.location.href);
  
  // Check if we're on Lovable
  if (!window.location.host.includes('lovable')) {
    return;
  }
  
  // Track if the modal was manually closed to prevent auto-reopening
  let modalManuallyClosed = false;
  
  let copiedContent = {
    guide: null,
    steps: null,
    prompt: null
  };
  
  // Create paste UI
  function createPasteContainer() {
    // Check if container already exists
    if (document.querySelector('.from021-paste-container')) {
      return;
    }
    
    const container = document.createElement('div');
    container.className = 'from021-paste-container';
    
    // For dark background of Lovable with subtle green gradient
    container.style.backgroundColor = "rgba(32, 32, 36, 0.95)";
    container.style.backgroundImage = "linear-gradient(to bottom right, rgba(32, 32, 36, 0.95), rgba(10, 40, 30, 0.92))";
    container.style.color = "#FFFFFF";
    container.style.borderColor = "rgba(75, 75, 90, 0.5)";
    container.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.25)";
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'from021-paste-header';
    
    const title = document.createElement('div');
    title.className = 'from021-paste-title';
    // Add logos to the header
    title.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="021" style="width: 16px; height: 16px; border-radius: 4px;">
        <span style="font-size: 12px; opacity: 0.8; color: white;">→</span>
        <img src="${chrome.runtime.getURL('icons/lovable.jpeg')}" alt="Lovable" style="width: 16px; height: 16px; border-radius: 4px;">
        <span>Copy to Lovable</span>
      </div>
    `;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    
    // Add minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'from021-paste-minimize';
    minimizeButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    minimizeButton.title = 'Minimize';
    minimizeButton.addEventListener('click', () => {
      container.classList.toggle('minimized');
      
      // Update the icon based on minimized state
      if (container.classList.contains('minimized')) {
        minimizeButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        
        // Add minimized styles
        container.style.height = 'auto';
        content.style.display = 'none';
      } else {
        minimizeButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
        
        // Restore normal styles
        container.style.height = '';
        content.style.display = 'block';
      }
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'from021-paste-close';
    closeButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => {
      modalManuallyClosed = true; // Set flag to prevent auto-reopening
      container.remove();
    });
    
    controlsDiv.appendChild(minimizeButton);
    controlsDiv.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(controlsDiv);
    
    // Create content area with buttons
    const content = document.createElement('div');
    content.className = 'from021-paste-content';
    
    // Center the check icon above the instructions instead of using a status div
    if (copiedContent.guide || copiedContent.steps || copiedContent.prompt) {
      const checkIconDiv = document.createElement('div');
      checkIconDiv.style.textAlign = 'center';
      checkIconDiv.style.marginBottom = '12px';
      checkIconDiv.innerHTML = `
      
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.95); margin-bottom: 4px; font-weight: 500;">Ready to paste content from 021!</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">Click a button below to paste directly into the chat:</div>
      `;
      content.appendChild(checkIconDiv);
    } else {
      const emptyStateDiv = document.createElement('div');
      emptyStateDiv.style.textAlign = 'center';
      emptyStateDiv.style.marginBottom = '12px';
      emptyStateDiv.innerHTML = `
        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.95); margin-bottom: 4px; font-weight: 500;">No content available</div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">Visit a from021.io implementation guide page to copy content.</div>
      `;
      content.appendChild(emptyStateDiv);
    }
    
    // Add CSS for minimized state
    const style = document.createElement('style');
    style.textContent = `
      .from021-paste-container.minimized {
        height: auto !important;
        min-height: 0 !important;
      }
      
      .from021-paste-container.minimized .from021-paste-content {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add paste all button
    const pasteAllButton = document.createElement('button');
    pasteAllButton.className = 'from021-paste-button from021-paste-all-button';
    pasteAllButton.id = 'from021-paste-all-button';
    pasteAllButton.disabled = !(copiedContent.guide || copiedContent.steps || copiedContent.prompt);
    pasteAllButton.innerHTML = `
      <svg class="from021-paste-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 8.5V13.5C20 17.5 18.5 19 14.5 19H9.5C5.5 19 4 17.5 4 13.5V8.5C4 4.5 5.5 3 9.5 3H14.5C18.5 3 20 4.5 20 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 14V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Paste All Content
    `;
    // Higher contrast for dark mode
    pasteAllButton.style.backgroundColor = "#7C3AED"; // Brighter purple for dark background
    pasteAllButton.style.color = "#FFFFFF";  // White text
    pasteAllButton.style.fontWeight = "700"; // Bold text
    pasteAllButton.style.border = "1px solid rgba(255, 255, 255, 0.4)"; // More visible border
    pasteAllButton.style.fontSize = "14px";
    pasteAllButton.style.boxShadow = "0 2px 8px rgba(124, 58, 237, 0.5)"; // Glow effect
    pasteAllButton.addEventListener('click', handlePasteAll);
    
    // Add paste guide button
    const pasteGuideButton = document.createElement('button');
    pasteGuideButton.className = 'from021-paste-button';
    pasteGuideButton.id = 'from021-paste-guide-button';
    pasteGuideButton.disabled = !copiedContent.guide;
    pasteGuideButton.innerHTML = `
      <svg class="from021-paste-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 17V9C17 8.44772 16.5523 8 16 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Paste Guide
    `;
    pasteGuideButton.addEventListener('click', () => handlePasteContent('guide'));
    
    // Add paste steps button
    const pasteStepsButton = document.createElement('button');
    pasteStepsButton.className = 'from021-paste-button';
    pasteStepsButton.id = 'from021-paste-steps-button';
    pasteStepsButton.disabled = !copiedContent.steps;
    pasteStepsButton.innerHTML = `
      <svg class="from021-paste-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4V11H11V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 4H13V11H20V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 13H13V20H20V13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 13H4V20H11V13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Paste Steps
    `;
    pasteStepsButton.addEventListener('click', () => handlePasteContent('steps'));
    
    // Add paste prompt button
    const pastePromptButton = document.createElement('button');
    pastePromptButton.className = 'from021-paste-button';
    pastePromptButton.id = 'from021-paste-prompt-button';
    pastePromptButton.disabled = !copiedContent.prompt;
    pastePromptButton.innerHTML = `
      <svg class="from021-paste-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 9H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Paste Prompt
    `;
    pastePromptButton.addEventListener('click', () => handlePasteContent('prompt'));
    
    // Style for regular buttons
    const buttonStyles = (button) => {
      button.style.backgroundColor = "rgba(45, 55, 50, 0.7)"; // Subtle green-tinged background
      button.style.color = "rgba(255, 255, 255, 0.9)";
      button.style.border = "1px solid rgba(80, 90, 85, 0.4)";
      button.style.fontWeight = "500";
      button.style.transition = "all 0.2s ease";
    };

    // Add hover styles
    const addButtonHoverEffects = (button) => {
      button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.15)";
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = "rgba(45, 55, 50, 0.7)";
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
      });
    };
    
    // Add clear memory button (more subtle)
    const clearMemoryButton = document.createElement('button');
    clearMemoryButton.className = 'from021-paste-button from021-clear-button';
    clearMemoryButton.id = 'from021-clear-button';
    clearMemoryButton.style.backgroundColor = "transparent";
    clearMemoryButton.style.color = "rgba(255, 255, 255, 0.5)";
    clearMemoryButton.style.border = "none";
    clearMemoryButton.style.padding = "6px 10px";
    clearMemoryButton.style.fontSize = "12px";
    clearMemoryButton.style.marginTop = "8px";
    clearMemoryButton.style.display = "flex";
    clearMemoryButton.style.justifyContent = "center";
    clearMemoryButton.style.alignItems = "center";
    clearMemoryButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
        <path d="M3 6.75H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.75 6.75L18 19.5C18 20.0967 17.5692 20.5833 17.0025 20.625L6.9975 20.625C6.43079 20.5833 6 20.0967 6 19.5L5.25 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.75 6.75L10.1333 3.99709C10.1765 3.73711 10.3991 3.53906 10.6615 3.53125L13.3385 3.53125C13.6009 3.53906 13.8235 3.73711 13.8667 3.99709L14.25 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Clear Memory
    `;
    clearMemoryButton.addEventListener('mouseenter', () => {
      clearMemoryButton.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
      clearMemoryButton.style.color = "rgba(239, 68, 68, 0.9)";
    });
    clearMemoryButton.addEventListener('mouseleave', () => {
      clearMemoryButton.style.backgroundColor = "transparent";
      clearMemoryButton.style.color = "rgba(255, 255, 255, 0.5)";
    });
    clearMemoryButton.addEventListener('click', clearStoredContent);
    
    // Add buttons to a container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'from021-paste-buttons';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.gap = '6px';
    
    // Apply styles to paste buttons
    [pasteGuideButton, pasteStepsButton, pastePromptButton].forEach(button => {
      buttonStyles(button);
      addButtonHoverEffects(button);
    });
    
    buttonContainer.appendChild(pasteAllButton);
    buttonContainer.appendChild(pasteGuideButton);
    buttonContainer.appendChild(pasteStepsButton);
    buttonContainer.appendChild(pastePromptButton);
    buttonContainer.appendChild(clearMemoryButton);
    
    content.appendChild(buttonContainer);
    
    container.appendChild(header);
    container.appendChild(content);
    
    document.body.appendChild(container);
    
    // Create tooltip element (hidden by default)
    const tooltip = document.createElement('div');
    tooltip.className = 'from021-tooltip';
    document.body.appendChild(tooltip);
  }
  
  // Function to show tooltip
  function showTooltip(message, duration = 2000) {
    const tooltip = document.querySelector('.from021-tooltip');
    if (!tooltip) return;
    
    // Position tooltip near cursor
    tooltip.style.top = `${window.innerHeight / 2}px`;
    tooltip.style.left = `${window.innerWidth / 2 - 100}px`;
    
    // Set message and show
    tooltip.textContent = message;
    tooltip.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
      tooltip.classList.remove('show');
    }, duration);
  }
  
  // Function to find Lovable chat input field
  function findLovableChatInput() {
    // Specific selectors for Lovable's chat interface based on the screenshot
    const selectors = [
      // Direct textarea selectors
      'textarea[placeholder*="Ask"]',
      'textarea.ProseMirror',
      
      // Editor component selectors
      '.cm-content',
      '.ProseMirror',
      '[role="textbox"]',
      
      // Fallback to any textarea in editor area
      '.editor-container textarea',
      '.chat-container textarea',
      
      // Very generic fallbacks
      'textarea',
      '[contenteditable="true"]'
    ];
    
    // Try each selector
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      // Get the visible one that's on screen
      for (const element of elements) {
        if (element.offsetParent !== null) { // Element is visible
          console.log('Found Lovable chat input:', element);
          return element;
        }
      }
    }
    
    // If no direct match, look for related elements that might help us identify the input
    const submitButtons = document.querySelectorAll('button[type="submit"], button.send-button');
    for (const button of submitButtons) {
      if (button.offsetParent === null) continue; // Skip invisible buttons
      
      // Look for input near the submit button
      const container = button.closest('form, .chat-container, .editor-container');
      if (container) {
        const input = container.querySelector('textarea, [contenteditable="true"], [role="textbox"]');
        if (input) {
          console.log('Found chat input near submit button:', input);
          return input;
        }
      }
    }
    
    return null;
  }
  
  // Function to set cursor position at the end of text in an input
  function setCursorToEnd(element) {
    if (!element) return;
    
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      // For standard form elements
      element.focus();
      const length = element.value.length;
      element.setSelectionRange(length, length);
    } else if (element.isContentEditable) {
      // For contentEditable elements
      element.focus();
      // Create a range at the end of the content
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false); // collapse to end
      
      // Apply the range as a selection
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // Show visual feedback that paste was successful
  function showSuccessFeedback(element) {
    if (!element) return;
    
    // Create a brief highlight flash effect
    const flashElement = document.createElement('div');
    flashElement.style.position = 'absolute';
    flashElement.style.top = `${element.offsetTop}px`;
    flashElement.style.left = `${element.offsetLeft}px`;
    flashElement.style.width = `${element.offsetWidth}px`;
    flashElement.style.height = `${element.offsetHeight}px`;
    flashElement.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; // Light green
    flashElement.style.borderRadius = '4px';
    flashElement.style.pointerEvents = 'none';
    flashElement.style.zIndex = '9998';
    flashElement.style.animation = 'flash-animation 1s ease-out forwards';
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flash-animation {
        0% { opacity: 0.8; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Add to the DOM then remove after animation
    const parent = element.offsetParent || document.body;
    parent.appendChild(flashElement);
    setTimeout(() => {
      parent.removeChild(flashElement);
      document.head.removeChild(style);
    }, 1000);
  }

  // Function to paste content into active element or selected text
  function pasteContentIntoActiveElement(content) {
    // First, try to find the Lovable chat input specifically
    const lovableChatInput = findLovableChatInput();
    
    if (lovableChatInput) {
      console.log('Inserting content into Lovable chat input');
      
      if (lovableChatInput.tagName === 'TEXTAREA' || lovableChatInput.tagName === 'INPUT') {
        // For standard input elements
        const originalValue = lovableChatInput.value || '';
        lovableChatInput.value = originalValue + content;
        
        // Set cursor at the end and focus
        setCursorToEnd(lovableChatInput);
        
        // Trigger input event to notify Lovable that content has changed
        lovableChatInput.dispatchEvent(new Event('input', { bubbles: true }));
        lovableChatInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Sometimes we need to trigger a keypress event to make the interface respond
        lovableChatInput.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
        lovableChatInput.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
        
        // Show success feedback
        showSuccessFeedback(lovableChatInput);
        
        return true;
      } else if (lovableChatInput.isContentEditable || lovableChatInput.getAttribute('role') === 'textbox') {
        // For contentEditable elements
        const originalText = lovableChatInput.textContent || '';
        lovableChatInput.textContent = originalText + content;
        
        // Set cursor at the end and focus
        setCursorToEnd(lovableChatInput);
        
        // Trigger input event
        lovableChatInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // If it's a rich text editor, we might need to handle mutations differently
        if (lovableChatInput.classList.contains('ProseMirror') || 
            lovableChatInput.classList.contains('cm-content')) {
          // Simulate additional events for complex editors
          lovableChatInput.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
          lovableChatInput.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
        }
        
        // Show success feedback
        showSuccessFeedback(lovableChatInput);
        
        return true;
      }
    }
    
    // Fallback to the original implementation
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT' || activeElement.isContentEditable)) {
      // Get the current selection
      const selectionStart = activeElement.selectionStart || 0;
      const selectionEnd = activeElement.selectionEnd || 0;
      
      // Get the current content
      const currentContent = activeElement.value || activeElement.textContent;
      
      // Create the new content by replacing the selected text with the new content
      const newContent = 
        (currentContent ? currentContent.substring(0, selectionStart) : '') + 
        content + 
        (currentContent ? currentContent.substring(selectionEnd) : '');
      
      // Update the content
      if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
        activeElement.value = newContent;
      } else {
        activeElement.textContent = newContent;
      }
      
      // Dispatch input event to trigger any event listeners
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      
      return true;
    }
    
    // If we can't find any input elements, try to find the send button and create an input
    const sendButton = document.querySelector('button[type="submit"], button.send-button, button.chat-submit');
    if (sendButton) {
      // Look for the closest parent that might contain the input
      const chatContainer = sendButton.closest('.chat-container, .chat-input-container, form');
      if (chatContainer) {
        const input = chatContainer.querySelector('textarea, input[type="text"], div[role="textbox"]');
        if (input) {
          // We found an input near the send button
          if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
            input.value = content;
          } else {
            input.textContent = content;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
          return true;
        }
      }
    }
    
    // Last resort: Try to use clipboard
    try {
      // Create a temporary textarea to hold the content
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      
      // Select and copy the content
      textarea.focus();
      textarea.select();
      
      // Copy the content to clipboard
      document.execCommand('copy');
      
      // Show a special tooltip instructing to paste manually
      showTooltip('Content copied to clipboard. Please click in the chat and press Ctrl+V to paste.', 4000);
      
      // Clean up
      document.body.removeChild(textarea);
      
      return false; // Return false since we didn't paste directly
    } catch (error) {
      console.error('Paste operation failed:', error);
      return false;
    }
  }
  
  // Handle paste content button clicks
  async function handlePasteContent(type) {
    // Get button by ID - more reliable than CSS selectors
    const buttonId = `from021-paste-${type}-button`;
    const button = document.getElementById(buttonId);
    
    if (!button || button.disabled) {
      console.error(`Button with ID ${buttonId} not found or disabled`);
        return;
      }
      
    const content = copiedContent[type];
    if (!content) {
      showTooltip(`❌ No ${type} content available to paste.`);
        return;
      }
      
    const originalContent = button.innerHTML;
      
    try {
      button.classList.add('working');
      button.textContent = 'Pasting...';
      
      // Log what we're trying to paste
      console.log(`Attempting to paste ${type} content:`, content.substring(0, 100) + "...");
      
      // Try to paste directly to the chat input
      const pasteSuccess = pasteContentIntoActiveElement(content);
      
      if (pasteSuccess) {
        button.classList.remove('working');
        button.classList.add('success');
        button.textContent = 'Pasted!';
        showTooltip(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} pasted to chat!`);
        console.log(`Successfully pasted ${type} content`);
      } else {
        // If direct paste fails, try to copy to clipboard
        await navigator.clipboard.writeText(content);
        button.classList.remove('working');
        button.classList.add('success');
        button.textContent = 'Copied to clipboard!';
        showTooltip(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard. Click in the chat and press Ctrl+V to paste.`);
        console.log(`Copied ${type} content to clipboard`);
      }
      
      setTimeout(() => {
        button.classList.remove('success');
        button.innerHTML = originalContent;
      }, 2000);
    } catch (error) {
      console.error(`Paste operation failed for ${type}:`, error);
      button.classList.remove('working');
      button.classList.add('error');
      button.textContent = 'Failed';
      showTooltip('❌ Paste failed. Try again.');
      
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = originalContent;
      }, 2000);
    }
  }
  
  // Handle paste all button click
  async function handlePasteAll() {
    const button = document.getElementById('from021-paste-all-button');
    if (!button || button.disabled) return;
    
    // Prepare content for pasting in the new order: prompt, guide, steps
    const allContent = [];
    
    if (copiedContent.prompt) {
      allContent.push("# AI Prompt\n\n");
      allContent.push(copiedContent.prompt);
      allContent.push("\n\n");
    }
    
    if (copiedContent.guide) {
      allContent.push("# Implementation Guide\n\n");
      allContent.push(copiedContent.guide);
      allContent.push("\n\n");
    }
    
    if (copiedContent.steps) {
      allContent.push("# Implementation Steps\n\n");
      allContent.push(copiedContent.steps);
    }
    
    if (allContent.length === 0) {
      showTooltip('❌ No content available to paste.');
      return;
    }
    
    const combinedContent = allContent.join('');
    
    const originalContent = button.innerHTML;
    
    try {
      button.classList.add('working');
      button.textContent = 'Pasting...';
      
      // Try to paste directly to the chat input
      const pasteSuccess = pasteContentIntoActiveElement(combinedContent);
      
      if (pasteSuccess) {
        button.classList.remove('working');
        button.classList.add('success');
        button.textContent = 'Pasted!';
        showTooltip('✅ All content pasted to chat!');
      } else {
        // If direct paste fails, try to copy to clipboard
        await navigator.clipboard.writeText(combinedContent);
        button.classList.remove('working');
        button.classList.add('success');
        button.textContent = 'Copied to clipboard!';
        showTooltip('✅ All content copied to clipboard. Click in the chat and press Ctrl+V to paste.');
      }
      
      setTimeout(() => {
        button.classList.remove('success');
        button.innerHTML = originalContent;
      }, 2000);
    } catch (error) {
      console.error('Paste all operation failed:', error);
      button.classList.remove('working');
      button.classList.add('error');
      button.textContent = 'Failed';
      showTooltip('❌ Paste failed. Try again.');
      
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = originalContent;
      }, 2000);
    }
  }
  
  // Function to clear all stored content with custom modal
  function clearStoredContent() {
    // Show custom confirmation modal instead of browser's confirm
    showConfirmationModal(() => {
      // Clear storage on confirmation
      chrome.storage.local.remove(['guide', 'steps', 'prompt'], () => {
        // Clear local content
        copiedContent = {
          guide: null,
          steps: null,
          prompt: null
        };
        
        // Show tooltip
        showTooltip('✅ Memory cleared successfully');
        
        // Update UI
        const container = document.querySelector('.from021-paste-container');
        if (container) {
          container.remove();
          createPasteContainer();
        }
      });
    });
  }

  // Function to show custom confirmation modal
  function showConfirmationModal(onConfirm) {
    // Check if a modal already exists
    if (document.querySelector('.from021-modal-overlay')) {
      return;
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'from021-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.backdropFilter = 'blur(4px)';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'from021-modal';
    modal.style.backgroundColor = 'rgba(30, 35, 33, 0.97)'; // Darker with subtle green
    modal.style.backgroundImage = 'linear-gradient(to bottom right, rgba(32, 32, 36, 0.97), rgba(12, 35, 28, 0.94))';
    modal.style.borderRadius = '12px';
    modal.style.padding = '20px';
    modal.style.maxWidth = '300px';
    modal.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    modal.style.border = '1px solid rgba(75, 75, 90, 0.5)';
    
    // Modal title
    const title = document.createElement('h3');
    title.textContent = 'Clear Memory';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.fontWeight = '600';
    title.style.color = 'white';
    
    // Modal message
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to clear all copied content from memory?';
    message.style.margin = '0 0 20px 0';
    message.style.fontSize = '14px';
    message.style.color = 'rgba(255, 255, 255, 0.8)';
    message.style.lineHeight = '1.5';
    
    // Buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '10px';
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.border = '1px solid rgba(75, 75, 90, 0.5)';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.backgroundColor = 'rgba(50, 50, 60, 0.9)';
    cancelButton.style.color = 'rgba(255, 255, 255, 0.8)';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.fontSize = '14px';
    
    // Confirm button
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    confirmButton.style.padding = '8px 12px';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '6px';
    confirmButton.style.backgroundColor = '#ef4444';
    confirmButton.style.color = 'white';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.fontSize = '14px';
    
    // Add event listeners
    cancelButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    confirmButton.addEventListener('click', () => {
      onConfirm();
      overlay.remove();
    });
    
    // Add buttons to container
    buttons.appendChild(cancelButton);
    buttons.appendChild(confirmButton);
    
    // Add elements to modal
    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(buttons);
    
    // Add modal to overlay
    overlay.appendChild(modal);
    
    // Add overlay to body
    document.body.appendChild(overlay);
  }
  
  // Update the UI based on available content
  function updatePasteUI() {
    const container = document.querySelector('.from021-paste-container');
    if (!container) return;
    
    const pasteAllButton = document.getElementById('from021-paste-all-button');
    const pasteGuideButton = document.getElementById('from021-paste-guide-button');
    const pasteStepsButton = document.getElementById('from021-paste-steps-button');
    const pastePromptButton = document.getElementById('from021-paste-prompt-button');
    
    // Create the container again to refresh UI with new content
    container.remove();
    createPasteContainer();
    
    // Update button states
    if (pasteAllButton) {
      pasteAllButton.disabled = !(copiedContent.guide || copiedContent.steps || copiedContent.prompt);
    }
    
    if (pasteGuideButton) {
      pasteGuideButton.disabled = !copiedContent.guide;
    }
    
    if (pasteStepsButton) {
      pasteStepsButton.disabled = !copiedContent.steps;
    }
    
    if (pastePromptButton) {
      pastePromptButton.disabled = !copiedContent.prompt;
    }
  }
  
  // Initialize
  window.addEventListener('load', () => {
    initializeLovablePage();
    
    // Watch for DOM changes to detect dynamically loaded chat
    const observer = new MutationObserver((mutations) => {
      // Check if we've found a chat input after DOM changes
      if (!document.querySelector('.from021-paste-container') && isLovableChatPage()) {
        // If we detect the chat input and we don't have the UI shown, initialize again
        initializeLovablePage();
      }
    });
    
    // observe the entire document for large-scale changes
    observer.observe(document.body, { childList: true, subtree: true });
  });
  
  // Initialize Lovable page
  function initializeLovablePage() {
    console.log("Initializing Lovable page...");
    
    // Load saved content
    chrome.storage.local.get(['guide', 'steps', 'prompt'], (result) => {
      console.log("Retrieved content from storage:", result);
      
      // Check if we have any content
      const hasContent = !!(result.guide || result.steps || result.prompt);
      
      if (hasContent) {
        // Update our content object
        copiedContent = {
          guide: result.guide || null,
          steps: result.steps || null,
          prompt: result.prompt || null
        };
        
        // Check if we're on a chat page
        const isChatPage = isLovableChatPage();
        console.log("Is chat page:", isChatPage);
        
        // If we're on a chat page and have content, automatically show the paste UI
        // Only show if it wasn't manually closed
        if (isChatPage && !modalManuallyClosed) {
          // Wait a short bit for the page to fully render
          setTimeout(() => {
            showPasteUI();
          }, 1000);
        }
      }
    });
  }
  
  // Check if we're on a Lovable chat page
  function isLovableChatPage() {
    // Check for various elements that would indicate we're on a chat page
    const chatInput = findLovableChatInput();
    if (chatInput) return true;
    
    // Check for other elements that might indicate a chat interface
    const chatElements = [
      // Headers or titles indicating chat
      'h1:contains("Chat"), h2:contains("Chat"), h3:contains("Chat")',
      '.chat-title, .chat-header, .chat-container',
      
      // UI elements specific to chat interfaces
      '.message-list, .chat-messages, .conversation',
      'button[aria-label*="Send"], button[title*="Send"]',
      
      // Lovable specific
      '.lovable-chat, .lovable-ai-container'
    ];
    
    for (const selector of chatElements) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) return true;
      } catch (e) {
        // Some selectors might cause errors, just continue
      }
    }
    
    // Check URL patterns that might indicate chat
    if (window.location.pathname.includes('/chat') || 
        window.location.pathname.includes('/conversation') ||
        window.location.search.includes('chat=true')) {
      return true;
    }
    
    return false;
  }

  // Function to show paste UI
  function showPasteUI() {
    // Don't show if manually closed
    if (modalManuallyClosed) {
      return;
    }
    
    // Remove existing UI if it exists
    const existingContainer = document.querySelector('.from021-paste-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Create new paste UI
    createPasteContainer();
  }
  
  // Handle storage changes (e.g., when content is copied on from021.io)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      let contentChanged = false;
      
      if (changes.guide) {
        copiedContent.guide = changes.guide.newValue || null;
        contentChanged = true;
      }
      
      if (changes.steps) {
        copiedContent.steps = changes.steps.newValue || null;
        contentChanged = true;
      }
      
      if (changes.prompt) {
        copiedContent.prompt = changes.prompt.newValue || null;
        contentChanged = true;
      }
      
      if (contentChanged) {
        updatePasteUI();
      }
    }
  });
  
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ping') {
      // Simple ping to check if content script is loaded
      sendResponse({ status: 'ok' });
    } else if (message.action === 'checkPageType') {
      sendResponse({ isLovablePage: true });
    } else if (message.action === 'refreshContent') {
      initializeLovablePage();
      sendResponse({ success: true });
    } else if (message.action === 'showPasteUI') {
      // Reset the manually closed flag when explicitly showing the UI
      modalManuallyClosed = false;
      showPasteUI();
      sendResponse({ success: true });
    } else if (message.action === 'togglePasteUI') {
      // If container exists, remove it, otherwise create it
      const container = document.querySelector('.from021-paste-container');
      if (container) {
        container.remove();
        // Only set the manually closed flag if removing the container
        modalManuallyClosed = true;
      } else {
        // Reset the manually closed flag when showing the UI
        modalManuallyClosed = false;
        showPasteUI();
      }
      sendResponse({ success: true });
    }
    
    return true; // Keep the messaging channel open
  });
})(); 