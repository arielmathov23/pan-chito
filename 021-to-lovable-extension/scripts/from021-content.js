// Content script for from021.io
(() => {
  console.log("from021-content.js loaded on: " + window.location.href);
  
  // Only run on implementation guide pages - modify to include localhost URLs
  if (!window.location.pathname.includes('/implementation/')) {
    console.log("Not an implementation page, exiting content script");
    return;
  }
  
  // Check if the URL is from the allowed domains - add localhost support
  const validDomains = ['from021.io', 'localhost', '127.0.0.1'];
  const currentHost = window.location.hostname;
  
  if (!validDomains.some(domain => currentHost.includes(domain))) {
    console.log("Not a valid domain, exiting content script");
    return;
  }
  
  console.log("Valid implementation page detected on: " + currentHost);
  
  // State for tracking what's been copied
  let copyState = {
    guide: false,
    steps: false,
    prompt: false
  };

  // Add a variable to track if the container is minimized
  let copyContainerMinimized = false;

  // Create a container for our copy buttons
  function createCopyContainer() {
    // Check if container already exists
    if (document.querySelector('.from021-copy-container')) {
      return;
    }
    
    const container = document.createElement('div');
    container.className = 'from021-copy-container';
    
    // Create header with title and close button
    const header = document.createElement('div');
    header.className = 'from021-copy-header';
    
    const title = document.createElement('div');
    title.className = 'from021-copy-title';
    // Simplified title that fits on one line, with bigger logos
    title.innerHTML = `
      <div class="from021-logos">
        <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="021" class="from021-copy-logo" width="24" height="24">
        <span class="from021-logo-divider">→</span>
        <img src="${chrome.runtime.getURL('icons/lovable.jpeg')}" alt="Lovable" class="from021-copy-logo" width="24" height="24">
        <span>Copy to Lovable</span>
      </div>
    `;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    
    // Add minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'from021-copy-minimize';
    minimizeButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    minimizeButton.title = 'Minimize';
    minimizeButton.addEventListener('click', () => {
      container.classList.toggle('minimized');
      copyContainerMinimized = container.classList.contains('minimized');
      
      // Update the icon based on minimized state
      if (container.classList.contains('minimized')) {
        minimizeButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else {
        minimizeButton.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'from021-copy-close';
    closeButton.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => {
      container.remove();
    });
    
    controlsDiv.appendChild(minimizeButton);
    controlsDiv.appendChild(closeButton);
    
    header.appendChild(title);
    header.appendChild(controlsDiv);
    
    // Create content area with buttons
    const content = document.createElement('div');
    content.className = 'from021-copy-content';
    
    // Add copy all button
    const copyAllButton = document.createElement('button');
    copyAllButton.className = 'from021-copy-button from021-copy-all-button';
    copyAllButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5.75H6C4.75736 5.75 3.75 6.75736 3.75 8V18C3.75 19.2426 4.75736 20.25 6 20.25H16C17.2426 20.25 18.25 19.2426 18.25 18V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 16.25H16C17.2426 16.25 18.25 15.2426 18.25 14V6C18.25 4.75736 17.2426 3.75 16 3.75H8C6.75736 3.75 5.75 4.75736 5.75 6V14C5.75 15.2426 6.75736 16.25 8 16.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10.25 9.75H13.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 7.25V12.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy All Content
    `;
    copyAllButton.style.backgroundColor = "#7C3AED";
    copyAllButton.style.color = "#FFFFFF";
    copyAllButton.style.fontWeight = "600";
    copyAllButton.style.fontSize = "15px";
    copyAllButton.style.padding = "14px 16px";
    copyAllButton.style.border = "none";
    copyAllButton.style.boxShadow = "0 4px 10px rgba(79, 70, 229, 0.3)";
    copyAllButton.style.position = "relative";
    copyAllButton.style.zIndex = "1";
    copyAllButton.style.marginBottom = "10px";
    copyAllButton.style.animation = "pulseButton 3s infinite";
    
    // Add keyframe animation for the button
    const copyAllStyle = document.createElement('style');
    copyAllStyle.textContent = `
      @keyframes pulseButton {
        0% { transform: scale(1); }
        50% { transform: scale(1.03); }
        100% { transform: scale(1); }
      }
      
      .from021-copy-all-button:hover {
        background-color: #4338CA !important;
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(79, 70, 229, 0.6) !important;
      }
    `;
    document.head.appendChild(copyAllStyle);
    
    copyAllButton.addEventListener('click', handleCopyAll);
    
    // Add copy guide button
    const copyGuideButton = document.createElement('button');
    copyGuideButton.className = 'from021-copy-button';
    copyGuideButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.25 5.75C19.25 4.64543 18.3546 3.75 17.25 3.75H8.25C7.14543 3.75 6.25 4.64543 6.25 5.75V19.25L12.75 15.75L19.25 19.25V5.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy Implementation Guide
    `;
    copyGuideButton.addEventListener('click', () => handleCopyContent('guide'));
    
    // Add copy steps button
    const copyStepsButton = document.createElement('button');
    copyStepsButton.className = 'from021-copy-button';
    copyStepsButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6.75H7.75C6.64543 6.75 5.75 7.64543 5.75 8.75V17.25C5.75 18.3546 6.64543 19.25 7.75 19.25H16.25C17.3546 19.25 18.25 18.3546 18.25 17.25V8.75C18.25 7.64543 17.3546 6.75 16.25 6.75H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 8.25L12 6.25L10 8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 6.5V14.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy Implementation Steps
    `;
    copyStepsButton.addEventListener('click', () => handleCopyContent('steps'));
    
    // Add copy prompt button
    const copyPromptButton = document.createElement('button');
    copyPromptButton.className = 'from021-copy-button';
    copyPromptButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3.75V8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15.75 5.25L12 8.25L8.25 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3.75 15.25C3.75 13.1789 5.42893 11.5 7.5 11.5H16.5C18.5711 11.5 20.25 13.1789 20.25 15.25V15.25C20.25 17.3211 18.5711 19 16.5 19H7.5C5.42893 19 3.75 17.3211 3.75 15.25V15.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.5 15.25H7.51" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 15.25H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16.5 15.25H16.51" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy AI Prompt
    `;
    copyPromptButton.addEventListener('click', () => handleCopyContent('prompt'));
    
    // Add clear memory button to from021 copy UI
    const clearMemoryButton = document.createElement('button');
    clearMemoryButton.className = 'from021-copy-button from021-clear-button';
    clearMemoryButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6.75H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.75 6.75L18 19.5C18 20.0967 17.5692 20.5833 17.0025 20.625L6.9975 20.625C6.43079 20.5833 6 20.0967 6 19.5L5.25 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.75 6.75L10.1333 3.99709C10.1765 3.73711 10.3991 3.53906 10.6615 3.53125L13.3385 3.53125C13.6009 3.53906 13.8235 3.73711 13.8667 3.99709L14.25 6.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Clear Memory
    `;
    clearMemoryButton.addEventListener('click', clearStoredContent);
    
    // Add all buttons to the container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'from021-copy-buttons';
    
    buttonContainer.appendChild(copyAllButton);
    buttonContainer.appendChild(copyGuideButton);
    buttonContainer.appendChild(copyStepsButton);
    buttonContainer.appendChild(copyPromptButton);
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
  
  // Function to extract implementation guide content
  function extractImplementationGuide() {
    console.log("Attempting to extract implementation guide...");
    
    // Try multiple selectors to find the content
    const selectors = [
      'div.border-\\[\\#e5e7eb\\].rounded-lg.p-4.bg-\\[\\#f8f9fa\\].overflow-auto.max-h-\\[500px\\]:nth-of-type(1) pre',
      'pre.text-sm.text-\\[\\#374151\\].whitespace-pre-wrap',
      'div.bg-\\[\\#f8f9fa\\] pre',
      '.implementation-guide pre',
      'div[class*="overflow-auto"] pre',
      // Add more generic selectors
      'pre',
      'div[class*="guide"]',
      'div[class*="implementation"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          console.log("Found implementation guide using selector:", selector);
          return element.textContent.trim();
        }
      } catch (e) {
        console.log("Error with selector:", selector, e);
      }
    }
    
    // Direct extraction from the page based on what you showed
    const guideText = document.body.textContent.match(/## Overview[\s\S]*?## Conclusion[\s\S]*?user-friendly\./);
    if (guideText && guideText[0].length > 100) {
      console.log("Found implementation guide using regex pattern");
      return guideText[0];
    }
    
    console.log("Could not find implementation guide content");
    return '';
  }
  
  // Function to extract implementation steps content
  function extractImplementationSteps() {
    console.log("Attempting to extract implementation steps...");
    
    // First try to get implementation steps from all content
    const pageContent = document.body.textContent || '';
    
    // Try to locate the implementation steps section using regex patterns
    const stepsRegexPatterns = [
      /Implementation Steps[\s\S]*?(?=AI Prompt|$)/i,
      /Steps:[\s\S]*?(?=Prompt:|$)/i,
      /Here are the steps[\s\S]*?(?=AI Prompt|$)/i
    ];
    
    for (const pattern of stepsRegexPatterns) {
      const match = pageContent.match(pattern);
      if (match && match[0].length > 50) {
        console.log("Found implementation steps using regex pattern");
        return match[0].trim();
      }
    }
    
    // First look specifically for "Implementation Steps" section
    const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
    
    for (const heading of allHeadings) {
      if (heading.textContent.trim().toLowerCase().includes('implementation steps')) {
        console.log("Found implementation steps heading");
        // Found the implementation steps heading, now get all content after it until next heading
        let content = '';
        let currentNode = heading.nextElementSibling;
        
        while (currentNode && 
               !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentNode.tagName) &&
               !currentNode.textContent.trim().toLowerCase().includes('ai prompt')) {
          if (currentNode.textContent && currentNode.textContent.trim()) {
            content += currentNode.textContent.trim() + '\n\n';
          }
          currentNode = currentNode.nextElementSibling;
        }
        
        if (content.length > 50) {
          console.log("Found implementation steps by heading");
          return content;
        }
      }
    }
    
    // Look for implementation steps container by class or ID
    const stepsSelectors = [
      '.implementation-steps',
      '#implementation-steps',
      'div[data-section="implementation-steps"]',
      'section.steps',
      'pre.steps',
      'ol li', // Try to get ordered lists
      '.steps-container',
      // Add more generic selectors
      'div[class*="steps"]',
      'div[class*="implementation"]',
      'ol'
    ];
    
    for (const selector of stepsSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        let content = '';
        elements.forEach(el => {
          content += el.textContent.trim() + '\n\n';
        });
        
        if (content.length > 50) {
          console.log("Found implementation steps using selector:", selector);
          return content.trim();
        }
      }
    }
    
    // If nothing found, try a more aggressive approach - get content between key sections
    const content = document.body.textContent;
    const startMarkers = ['Implementation Steps', 'Steps', 'Step 1'];
    const endMarkers = ['AI Prompt', 'Conclusion', 'Summary'];
    
    for (const start of startMarkers) {
      const startIndex = content.indexOf(start);
      if (startIndex !== -1) {
        let endIndex = content.length;
        for (const end of endMarkers) {
          const tmpIndex = content.indexOf(end, startIndex + start.length);
          if (tmpIndex !== -1 && tmpIndex < endIndex) {
            endIndex = tmpIndex;
          }
        }
        
        if (endIndex - startIndex > 50) {
          const extractedContent = content.substring(startIndex, endIndex).trim();
          console.log("Found implementation steps by text extraction");
          return extractedContent;
        }
      }
    }
    
    // If we still can't find anything, return a generic message about implementation steps
    return 'Implementation steps for this guide:\n\n1. Read through the Implementation Guide\n2. Follow the step-by-step instructions\n3. Use the AI Prompt if needed for detailed implementation assistance';
  }
  
  // Function to extract AI prompt content
  function extractPrompt() {
    console.log("Attempting to extract AI prompt...");
    
    // Try multiple selectors
    const selectors = [
      'div.bg-\\[\\#f8f9fa\\].rounded-lg.p-4.font-mono',
      '.ai-assistant-prompt',
      'div[class*="bg-\\[\\#f8f9fa\\]"].font-mono',
      'pre.font-mono',
      // Add more generic selectors
      'pre',
      'div[class*="prompt"]',
      'div[class*="ai"]'
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          console.log("Found AI prompt using selector:", selector);
          return element.textContent.trim();
        }
      } catch (e) {
        console.log("Error with selector:", selector, e);
      }
    }
    
    // Direct extraction from the page based on what you showed
    const promptText = document.body.textContent.match(/To get started with this new project follow these instructions carefully[\s\S]*?The step number, A brief description of the task, The word "Done", The stage it belongs to \(if applicable\)/);
    if (promptText && promptText[0].length > 100) {
      console.log("Found AI prompt using regex pattern");
      return promptText[0];
    }
    
    console.log("Could not find AI prompt content");
    return '';
  }
  
  // Function to copy content to clipboard and store in extension storage
  async function copyToClipboard(text, type) {
    try {
      console.log(`Attempting to copy ${type} content...`);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(text);
      
      // Store in Chrome storage
      const storageData = {};
      storageData[type] = text;
      
      await chrome.storage.local.set(storageData);
      console.log(`Successfully stored ${type} content in storage`);
      
      // Update copy state
      copyState[type] = true;
      
      // Show success message
      showTooltip(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} copied!`);
      
      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'contentCopied',
        type: type
      });
      
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      showTooltip('❌ Copy failed. Try again.');
      return false;
    }
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
  
  // Handle copy content button clicks
  async function handleCopyContent(type) {
    const button = document.querySelector(`.from021-copy-button:nth-child(${type === 'guide' ? 2 : type === 'steps' ? 3 : 4})`);
    if (!button) return;
    
    let content = '';
    switch (type) {
      case 'guide':
        content = extractImplementationGuide();
        break;
      case 'steps':
        content = extractImplementationSteps();
        break;
      case 'prompt':
        content = extractPrompt();
        break;
    }
    
    if (!content) {
      button.classList.add('error');
      button.textContent = 'Content not found';
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = getOriginalButtonHTML(type);
      }, 2000);
      return;
    }
    
    const originalContent = button.innerHTML;
    
    try {
      button.classList.add('working');
      button.textContent = 'Copying...';
      
      const success = await copyToClipboard(content, type);
      
      if (success) {
        button.classList.remove('working');
        button.classList.add('success');
        button.textContent = 'Copied!';
        
        setTimeout(() => {
          button.classList.remove('success');
          // Add visual indicator that this has been copied
          button.classList.add('copied');
          button.innerHTML = getOriginalButtonHTML(type);
        }, 1500);
        
        // Update button states for all buttons
        setTimeout(updateButtonStates, 1600);
      } else {
        button.classList.remove('working');
        button.classList.add('error');
        button.textContent = 'Failed';
        setTimeout(() => {
          button.classList.remove('error');
          button.innerHTML = originalContent;
        }, 2000);
      }
    } catch (error) {
      console.error('Copy operation failed:', error);
      button.classList.remove('working');
      button.classList.add('error');
      button.textContent = 'Error';
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = originalContent;
      }, 2000);
    }
  }
  
  // Helper function to get original button HTML based on type
  function getOriginalButtonHTML(type) {
    switch(type) {
      case 'guide':
        return `
          <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19.25 5.75C19.25 4.64543 18.3546 3.75 17.25 3.75H8.25C7.14543 3.75 6.25 4.64543 6.25 5.75V19.25L12.75 15.75L19.25 19.25V5.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Copy Implementation Guide
        `;
      case 'steps':
        return `
          <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6.75H7.75C6.64543 6.75 5.75 7.64543 5.75 8.75V17.25C5.75 18.3546 6.64543 19.25 7.75 19.25H16.25C17.3546 19.25 18.25 18.3546 18.25 17.25V8.75C18.25 7.64543 17.3546 6.75 16.25 6.75H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 8.25L12 6.25L10 8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 6.5V14.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Copy Implementation Steps
        `;
      case 'prompt':
        return `
          <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3.75V8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15.75 5.25L12 8.25L8.25 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.75 15.25C3.75 13.1789 5.42893 11.5 7.5 11.5H16.5C18.5711 11.5 20.25 13.1789 20.25 15.25V15.25C20.25 17.3211 18.5711 19 16.5 19H7.5C5.42893 19 3.75 17.3211 3.75 15.25V15.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.5 15.25H7.51" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15.25H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.5 15.25H16.51" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Copy AI Prompt
        `;
      default:
        return '';
    }
  }
  
  // Handle copy all button click
  async function handleCopyAll() {
    const button = document.querySelector('.from021-copy-all-button');
    if (!button) return;
    
    const originalContent = button.innerHTML;
    button.textContent = 'Copying...';
    
    try {
      // Extract all content
      const guide = extractImplementationGuide();
      const steps = extractImplementationSteps();
      const prompt = extractPrompt();
      
      console.log("Extracted content: ", { guide: guide.substring(0, 50), steps: steps.substring(0, 50), prompt: prompt.substring(0, 50) });
      
      // Check if we have at least some content
      if (!guide && !steps && !prompt) {
        throw new Error('Could not find any content to copy');
      }
      
      // Save all content to storage
      await chrome.storage.local.set({
        guide: guide || '',
        steps: steps || '',
        prompt: prompt || ''
      });
      
      // Update copyState
      copyState = {
        guide: !!guide,
        steps: !!steps,
        prompt: !!prompt
      };
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'allContentCopied',
        data: { guide, steps, prompt }
      });
      
      // Update button
      button.classList.add('success');
      button.textContent = 'All Content Copied!';
      
      // Show tooltip
      showTooltip('✅ Content copied and stored!');
      
      setTimeout(() => {
        button.classList.remove('success');
        button.innerHTML = originalContent;
        
        // Update all button states to show copied status
        updateButtonStates();
      }, 2000);
    } catch (error) {
      console.error('Copy all failed:', error);
      
      button.classList.add('error');
      button.textContent = 'Failed';
      
      showTooltip('❌ Could not copy content. Try individual buttons.');
      
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = originalContent;
      }, 2000);
    }
  }
  
  // Function to add visible indicator at top right
  function addVisibleIndicator() {
    // Removed as per requirement D
  }

  // Replace the existing indicator code in the load event listener
  window.addEventListener('load', () => {
    console.log("Page loaded, initializing extension...");
    
    // Create copy UI
    createCopyContainer();
    
    // Immediately check if we have any content stored and update button states
    chrome.storage.local.get(['guide', 'steps', 'prompt'], (result) => {
      if (result.guide || result.steps || result.prompt) {
        console.log("Found existing stored content:", {
          guide: result.guide ? "Present" : "Not present",
          steps: result.steps ? "Present" : "Not present",
          prompt: result.prompt ? "Present" : "Not present"
        });
        
        // Update copy state and visual indicators
        updateButtonStates();
      }
    });
    
    // Try to extract and store content automatically
    setTimeout(() => {
      console.log("Attempting to extract content automatically...");
      const guide = extractImplementationGuide();
      const steps = extractImplementationSteps();
      const prompt = extractPrompt();
      
      console.log("Extracted content:", {
        guide: guide ? "Found" : "Not found",
        steps: steps ? "Found" : "Not found",
        prompt: prompt ? "Found" : "Not found"
      });
      
      if (guide || steps || prompt) {
        chrome.storage.local.set({
          guide: guide || '',
          steps: steps || '',
          prompt: prompt || ''
        }, () => {
          console.log("Content stored in chrome.storage.local");
          updateButtonStates();
          
          // Add subtle animation to button to indicate success
          const copyAllButton = document.querySelector('.from021-copy-all-button');
          if (copyAllButton) {
            copyAllButton.classList.add('success');
            setTimeout(() => {
              copyAllButton.classList.remove('success');
            }, 1000);
          }
        });
      }
    }, 1500);
  });
  
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    
    if (message.action === 'checkPageType') {
      sendResponse({ isImplementationPage: true });
    } else if (message.action === 'extractAndStoreContent') {
      try {
        console.log("Extracting content on demand...");
        const guide = extractImplementationGuide();
        const steps = extractImplementationSteps();
        const prompt = extractPrompt();
        
        chrome.storage.local.set({
          guide: guide || '',
          steps: steps || '',
          prompt: prompt || ''
        }, () => {
          console.log("Content stored in chrome.storage.local");
          sendResponse({ 
            success: !!(guide || steps || prompt),
            found: { guide: !!guide, steps: !!steps, prompt: !!prompt }
          });
        });
      } catch (error) {
        console.error("Error extracting content:", error);
        sendResponse({ success: false, error: error.message });
      }
      return true; // Keep the messaging channel open for async response
    } else if (message.action === 'showModal') {
      // Create copy UI if it doesn't exist, or show it if it's hidden
      const container = document.querySelector('.from021-copy-container');
      if (container) {
        // If container exists but was removed from DOM, reattach it
        if (!document.body.contains(container)) {
          document.body.appendChild(container);
        }
        // Make sure it's visible
        container.style.display = 'flex';
        
        // Respect minimized state
        if (copyContainerMinimized) {
          container.classList.add('minimized');
        } else {
          container.classList.remove('minimized');
        }
      } else {
        // Create new container if it doesn't exist
        createCopyContainer();
        copyContainerMinimized = false; // Reset minimized state for new container
      }
      sendResponse({ success: true });
    }
  });

  // Function to clear all stored content
  function clearStoredContent() {
    console.log("Clearing stored content...");
    
    // Create custom confirmation modal instead of using native confirm
    showConfirmationModal(() => {
      // Clear storage on confirmation
      chrome.storage.local.remove(['guide', 'steps', 'prompt'], () => {
        console.log("Storage cleared");
        // Show tooltip
        showTooltip('✅ Memory cleared successfully');
        
        // Reset the state
        copyState = {
          guide: false,
          steps: false,
          prompt: false
        };
        
        // Reset UI completely by removing checkmarks from buttons
        const guideButton = document.querySelector('.from021-copy-button:nth-child(2)');
        const stepsButton = document.querySelector('.from021-copy-button:nth-child(3)');
        const promptButton = document.querySelector('.from021-copy-button:nth-child(4)');
        
        if (guideButton) {
          guideButton.classList.remove('copied');
          guideButton.innerHTML = getOriginalButtonHTML('guide');
        }
        
        if (stepsButton) {
          stepsButton.classList.remove('copied');
          stepsButton.innerHTML = getOriginalButtonHTML('steps');
        }
        
        if (promptButton) {
          promptButton.classList.remove('copied');
          promptButton.innerHTML = getOriginalButtonHTML('prompt');
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
    modal.style.backgroundColor = 'white';
    modal.style.borderRadius = '12px';
    modal.style.padding = '20px';
    modal.style.maxWidth = '300px';
    modal.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    modal.style.border = '1px solid rgba(230, 232, 236, 0.8)';
    
    // Modal title
    const title = document.createElement('h3');
    title.textContent = 'Clear Memory';
    title.style.margin = '0 0 10px 0';
    title.style.fontSize = '16px';
    title.style.fontWeight = '600';
    
    // Modal message
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to clear all copied content from memory?';
    message.style.margin = '0 0 20px 0';
    message.style.fontSize = '14px';
    message.style.color = '#4b5563';
    
    // Buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.justifyContent = 'flex-end';
    buttons.style.gap = '10px';
    
    // Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.padding = '8px 12px';
    cancelButton.style.border = '1px solid #e5e7eb';
    cancelButton.style.borderRadius = '6px';
    cancelButton.style.backgroundColor = '#f9fafb';
    cancelButton.style.color = '#4b5563';
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
    
    // Dark mode support
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      modal.style.backgroundColor = '#2a2a30';
      modal.style.border = '1px solid rgba(60, 60, 70, 0.5)';
      title.style.color = 'white';
      message.style.color = 'rgba(255, 255, 255, 0.7)';
      cancelButton.style.backgroundColor = '#3a3a45';
      cancelButton.style.border = '1px solid #45454d';
      cancelButton.style.color = 'rgba(255, 255, 255, 0.8)';
    }
  }

  // Function to update button states based on what's been copied or stored
  function updateButtonStates() {
    console.log("Updating button states...");
    
    // Check if content exists in storage
    chrome.storage.local.get(['guide', 'steps', 'prompt'], (result) => {
      console.log("Retrieved storage state:", result);
      // Update copyState based on stored content
      copyState.guide = !!result.guide;
      copyState.steps = !!result.steps;
      copyState.prompt = !!result.prompt;
      
      // Update button appearances based on copyState
      const guideButton = document.querySelector('.from021-copy-button:nth-child(2)');
      const stepsButton = document.querySelector('.from021-copy-button:nth-child(3)');
      const promptButton = document.querySelector('.from021-copy-button:nth-child(4)');
      
      if (guideButton) {
        if (copyState.guide) {
          guideButton.classList.add('copied');
          guideButton.innerHTML = getOriginalButtonHTML('guide');
        } else {
          guideButton.classList.remove('copied');
          guideButton.innerHTML = getOriginalButtonHTML('guide');
        }
      }
      
      if (stepsButton) {
        if (copyState.steps) {
          stepsButton.classList.add('copied');
          stepsButton.innerHTML = getOriginalButtonHTML('steps');
        } else {
          stepsButton.classList.remove('copied');
          stepsButton.innerHTML = getOriginalButtonHTML('steps');
        }
      }
      
      if (promptButton) {
        if (copyState.prompt) {
          promptButton.classList.add('copied');
          promptButton.innerHTML = getOriginalButtonHTML('prompt');
        } else {
          promptButton.classList.remove('copied');
          promptButton.innerHTML = getOriginalButtonHTML('prompt');
        }
      }
    });
  }
})(); 