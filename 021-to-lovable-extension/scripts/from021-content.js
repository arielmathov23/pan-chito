// Content script for from021.io
(() => {
  console.log("from021-content.js loaded on: " + window.location.href);
  
  // Only run on implementation guide pages
  if (!window.location.pathname.includes('/implementation/')) {
    return;
  }
  
  // State for tracking what's been copied
  let copyState = {
    guide: false,
    steps: false,
    prompt: false
  };

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
    title.innerHTML = `
      <span>021 to Lovable</span>
    `;
    
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    
    // Add minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'from021-copy-minimize';
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
      } else {
        minimizeButton.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 15L12 9L6 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'from021-copy-close';
    closeButton.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <path d="M20 8.5V13.5C20 17.5 18.5 19 14.5 19H9.5C5.5 19 4 17.5 4 13.5V8.5C4 4.5 5.5 3 9.5 3H14.5C18.5 3 20 4.5 20 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 14V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Copy All Content
    `;
    copyAllButton.style.backgroundColor = "#4F46E5";
    copyAllButton.style.color = "#FFFFFF";
    copyAllButton.style.fontWeight = "700";
    copyAllButton.style.fontSize = "14px";
    copyAllButton.style.padding = "10px 16px";
    copyAllButton.style.border = "2px solid rgba(255, 255, 255, 0.5)";
    copyAllButton.style.boxShadow = "0 4px 10px rgba(79, 70, 229, 0.5)";
    copyAllButton.style.position = "relative";
    copyAllButton.style.zIndex = "1";
    copyAllButton.style.marginBottom = "12px";
    copyAllButton.style.animation = "pulseButton 2s infinite";
    
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
        <path d="M8 8V5C8 4.44772 8.44772 4 9 4H19C19.5523 4 20 4.44772 20 5V16C20 16.5523 19.5523 17 19 17H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 8H5C4.44772 8 4 8.44772 4 9V19C4 19.5523 4.44772 20 5 20H16C16.5523 20 17 19.5523 17 17V9C17 8.44772 16.5523 8 16 8Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Implementation Guide
    `;
    copyGuideButton.addEventListener('click', () => handleCopyContent('guide'));
    
    // Add copy steps button
    const copyStepsButton = document.createElement('button');
    copyStepsButton.className = 'from021-copy-button';
    copyStepsButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 4H4V11H11V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 4H13V11H20V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 13H13V20H20V13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 13H4V20H11V13Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Implementation Steps
    `;
    copyStepsButton.addEventListener('click', () => handleCopyContent('steps'));
    
    // Add copy prompt button
    const copyPromptButton = document.createElement('button');
    copyPromptButton.className = 'from021-copy-button';
    copyPromptButton.innerHTML = `
      <svg class="from021-copy-button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 9H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 9H15.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      AI Prompt
    `;
    copyPromptButton.addEventListener('click', () => handleCopyContent('prompt'));
    
    // Add clear memory button to from021 copy UI
    const clearMemoryButton = document.createElement('button');
    clearMemoryButton.className = 'from021-copy-button from021-clear-button';
    clearMemoryButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19 6V20C19 21 18 21 18 21H6C6 21 5 21 5 20V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 11V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Clear Memory
    `;
    clearMemoryButton.style.backgroundColor = "#EF4444";
    clearMemoryButton.style.color = "#FFFFFF";
    clearMemoryButton.style.marginTop = "12px";
    clearMemoryButton.style.width = "100%";
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
    // Try multiple selectors to find the content
    const selectors = [
      'div.border-\\[\\#e5e7eb\\].rounded-lg.p-4.bg-\\[\\#f8f9fa\\].overflow-auto.max-h-\\[500px\\]:nth-of-type(1) pre',
      'pre.text-sm.text-\\[\\#374151\\].whitespace-pre-wrap',
      'div.bg-\\[\\#f8f9fa\\] pre',
      '.implementation-guide pre',
      'div[class*="overflow-auto"] pre'
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          return element.textContent.trim();
        }
      } catch (e) {}
    }
    
    // Direct extraction from the page based on what you showed
    const guideText = document.body.textContent.match(/## Overview[\s\S]*?## Conclusion[\s\S]*?user-friendly\./);
    if (guideText && guideText[0].length > 100) {
      return guideText[0];
    }
    
    return '';
  }
  
  // Function to extract implementation steps content
  function extractImplementationSteps() {
    // First look specifically for "Implementation Steps" section
    const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b'));
    
    for (const heading of allHeadings) {
      if (heading.textContent.trim().toLowerCase().includes('implementation steps')) {
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
          console.log("Found Implementation Steps by heading:", content.substring(0, 100) + "...");
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
      'pre.steps'
    ];
    
    for (const selector of stepsSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim().length > 50) {
        console.log("Found Implementation Steps by selector:", element.textContent.substring(0, 100) + "...");
        return element.textContent.trim();
      }
    }
    
    // Try to find by content pattern - look for text that follows a Phase or Step pattern
    const fullText = document.body.textContent;
    
    // Look for common implementation steps patterns
    const stepsPatterns = [
      /# Implementation Steps[\s\S]*?(?=# AI Prompt|$)/i,
      /## Phase \d[\s\S]*?(?=# AI Prompt|$)/i,
      /\d\. Set up[\s\S]*?(?=# AI Prompt|$)/i,
      /Step \d:[\s\S]*?(?=# AI Prompt|$)/i
    ];
    
    for (const pattern of stepsPatterns) {
      const match = fullText.match(pattern);
      if (match && match[0].length > 100) {
        console.log("Found Implementation Steps by pattern:", match[0].substring(0, 100) + "...");
        return match[0].trim();
      }
    }
    
    // Fall back to the selector-based approach if nothing else worked
    const selectors = [
      'div.border-\\[\\#e5e7eb\\].rounded-lg.p-4.bg-\\[\\#f8f9fa\\].overflow-auto.max-h-\\[500px\\]:nth-of-type(2) pre',
      'pre.text-sm.text-\\[\\#374151\\].whitespace-pre-wrap:nth-of-type(2)',
      'div.bg-\\[\\#f8f9fa\\]:nth-of-type(2) pre',
      '.implementation-steps pre'
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          console.log("Found Implementation Steps by fallback selector:", element.textContent.substring(0, 100) + "...");
          return element.textContent.trim();
        }
      } catch (e) {}
    }
    
    console.log("Could not find Implementation Steps content");
    return '';
  }
  
  // Function to extract AI prompt content
  function extractPrompt() {
    // Try multiple selectors
    const selectors = [
      'div.bg-\\[\\#f8f9fa\\].rounded-lg.p-4.font-mono',
      '.ai-assistant-prompt',
      'div[class*="bg-\\[\\#f8f9fa\\]"].font-mono',
      'pre.font-mono'
    ];
    
    for (const selector of selectors) {
      try {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim().length > 50) {
          return element.textContent.trim();
        }
      } catch (e) {}
    }
    
    // Direct extraction from the page based on what you showed
    const promptText = document.body.textContent.match(/To get started with this new project follow these instructions carefully[\s\S]*?The step number, A brief description of the task, The word "Done", The stage it belongs to \(if applicable\)/);
    if (promptText && promptText[0].length > 100) {
      return promptText[0];
    }
    
    return '';
  }
  
  // Function to copy content to clipboard and store in extension storage
  async function copyToClipboard(text, type) {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(text);
      
      // Store in Chrome storage
      const storageData = {};
      storageData[type] = text;
      
      await chrome.storage.local.set(storageData);
      
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
        button.innerHTML = button.innerHTML; // Reset the button content
      }, 2000);
      return;
    }
    
    const originalContent = button.innerHTML;
    
    try {
      button.classList.add('success');
      button.textContent = 'Copying...';
      
      const success = await copyToClipboard(content, type);
      
      if (success) {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.classList.remove('success');
          button.innerHTML = originalContent;
        }, 2000);
      } else {
        button.classList.remove('success');
        button.classList.add('error');
        button.textContent = 'Failed';
        setTimeout(() => {
          button.classList.remove('error');
          button.innerHTML = originalContent;
        }, 2000);
      }
    } catch (error) {
      console.error('Copy operation failed:', error);
      button.classList.remove('success');
      button.classList.add('error');
      button.textContent = 'Error';
      setTimeout(() => {
        button.classList.remove('error');
        button.innerHTML = originalContent;
      }, 2000);
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
  
  // Wait for page to load completely
  window.addEventListener('load', () => {
    // Add visible indicator of script running
    const indicator = document.createElement('div');
    indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 8.5V13.5C20 17.5 18.5 19 14.5 19H9.5C5.5 19 4 17.5 4 13.5V8.5C4 4.5 5.5 3 9.5 3H14.5C18.5 3 20 4.5 20 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 14V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        021 Copy Active
      </div>
    `;
    indicator.style.position = "fixed";
    indicator.style.top = "10px";
    indicator.style.right = "10px";
    indicator.style.padding = "8px 12px";
    indicator.style.background = "rgba(139, 92, 246, 0.9)";
    indicator.style.color = "white";
    indicator.style.zIndex = "9999";
    indicator.style.borderRadius = "8px";
    indicator.style.fontSize = "12px";
    indicator.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    indicator.style.fontWeight = "500";
    indicator.style.backdropFilter = "blur(4px)";
    indicator.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    indicator.style.transition = "opacity 0.3s ease";
    indicator.style.cursor = "pointer";
    
    // Add hover effect
    indicator.addEventListener('mouseenter', () => {
      indicator.style.background = "rgba(124, 58, 237, 0.9)";
    });
    
    indicator.addEventListener('mouseleave', () => {
      indicator.style.background = "rgba(139, 92, 246, 0.9)";
    });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      indicator.style.opacity = "0.7";
    }, 5000);
    
    // Show again on hover
    indicator.addEventListener('mouseenter', () => {
      indicator.style.opacity = "1";
    });
    
    // Click to create/show copy container
    indicator.addEventListener('click', () => {
      createCopyContainer();
    });
    
    document.body.appendChild(indicator);
    
    // Create copy UI
    createCopyContainer();
    
    // Try to extract and store content automatically
    setTimeout(() => {
      const guide = extractImplementationGuide();
      const steps = extractImplementationSteps();
      const prompt = extractPrompt();
      
      if (guide || steps || prompt) {
        chrome.storage.local.set({
          guide: guide || '',
          steps: steps || '',
          prompt: prompt || ''
        });
      }
    }, 3000);
  });
  
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'checkPageType') {
      sendResponse({ isImplementationPage: true });
    } else if (message.action === 'extractAndStoreContent') {
      try {
        const guide = extractImplementationGuide();
        const steps = extractImplementationSteps();
        const prompt = extractPrompt();
        
        chrome.storage.local.set({
          guide: guide || '',
          steps: steps || '',
          prompt: prompt || ''
        }, () => {
          sendResponse({ 
            success: !!(guide || steps || prompt),
            found: { guide: !!guide, steps: !!steps, prompt: !!prompt }
          });
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true; // Keep the messaging channel open for async response
    }
  });

  // Function to clear all stored content
  function clearStoredContent() {
    // Show confirmation dialog
    if (confirm("Are you sure you want to clear all copied content from memory?")) {
      // Clear storage
      chrome.storage.local.remove(['guide', 'steps', 'prompt'], () => {
        // Show tooltip
        showTooltip('✅ Memory cleared successfully');
        
        // Update button states
        updateButtonStates();
      });
    }
  }
})(); 