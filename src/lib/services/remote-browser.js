import { chromium } from 'playwright-core';

// Lazy load Browserbase to avoid import issues
let BrowserbaseSDK = null;

export class RemoteBrowserService {
  constructor(mode = null) {
    // Auto-detect mode from environment if not specified
    this.mode = mode || process.env.PLAYWRIGHT_MODE || 'local';
    this.sessions = new Map();
    this.browserbaseSessions = new Map(); // Track Browserbase session objects

    // Browserbase configuration
    this.browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
    this.browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;

    // Browserbase client will be initialized on first use
    this.browserbase = null;
  }

  async createSession(sessionId, options = {}) {
    try {
      let browser, context, page, browserbaseSession;
      let liveViewUrls = null; // Initialize here so it's available in all branches

      if (this.mode === 'browserbase') {
        // Browserbase mode - use their SDK
        if (!this.browserbaseApiKey || !this.browserbaseProjectId) {
          throw new Error('BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are required for Browserbase mode');
        }

        // Initialize Browserbase client on first use
        if (!this.browserbase) {
          if (!BrowserbaseSDK) {
            // Dynamic import - Browserbase is a named export
            const sdkModule = await import('@browserbasehq/sdk');
            
            // Get the Browserbase class from named export (not default!)
            BrowserbaseSDK = sdkModule.Browserbase;
            
            if (!BrowserbaseSDK) {
              throw new Error(`Browserbase not found in SDK exports. Available: ${Object.keys(sdkModule)}`);
            }
          }
          
          // Create new instance
          this.browserbase = new BrowserbaseSDK({
            apiKey: this.browserbaseApiKey
          });
          
         
        }

        console.log('Creating Browserbase session...');

        // Create Browserbase session - it's a direct method, not sessions.create
        browserbaseSession = await this.browserbase.createSession({
          projectId: this.browserbaseProjectId
        });

        console.log('Fetching Live View URLs...');
        
        // Get Live View URLs for the session
        try {
          // Based on the flat API we discovered, try the direct REST call
          // since getDebugConnectionURLs might not exist
          const debugResponse = await fetch(`https://api.browserbase.com/v1/sessions/${browserbaseSession.id}/debug`, {
            headers: {
              'X-BB-API-Key': this.browserbaseApiKey
            }
          });
          
          if (debugResponse.ok) {
            liveViewUrls = await debugResponse.json();
            console.log('Live View URLs retrieved via API');

            console.log("this is live url", liveViewUrls);
            console.log("this is other attmpt at live url:")
            // const liveViewLinks = await bb.sessions.debug(browserbaseSession.id);
            // const liveViewLink = liveViewLinks.debuggerFullscreenUrl;
            console.log('Inspecting browserbase session:', browserbaseSession);
          } else {
            throw new Error(`Debug API failed: ${debugResponse.status}`);
          }
        } catch (error) {
          console.error('Failed to get Live View URLs:', error);
          // Continue without Live View URLs - not critical for operation
        }

        // Connect to the browser using connectOverCDP
        browser = await chromium.connectOverCDP(browserbaseSession.connectUrl);

        // Get the default context (Browserbase sessions come with a default context)
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          context = contexts[0];
          const pages = context.pages();
          page = pages.length > 0 ? pages[0] : await context.newPage();
        } else {
          context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true
          });
          page = await context.newPage();
        }

        console.log(`Browserbase session created: ${sessionId}, BB Session ID: ${browserbaseSession.id}`);

        // Store the Browserbase session for cleanup
        this.browserbaseSessions.set(sessionId, browserbaseSession);

      } else if (this.mode === 'local') {
        // Local mode - launch local browser with visible window
        const isProduction = process.env.NODE_ENV === 'production';

        browser = await chromium.launch({
          headless: isProduction ? true : false, // Visible in dev, headless in prod
          args: ['--use-fake-ui-for-media-stream', '--start-maximized']
        });

        context = await browser.newContext({
          viewport: { width: 1280, height: 720 },
          ignoreHTTPSErrors: true,
          ...options
        });

        page = await context.newPage();

        console.log(`Local browser session created: ${sessionId}`);

      } else {
        throw new Error(`Unsupported browser mode: ${this.mode}`);
      }

      // Store session with Live View URLs
      this.sessions.set(sessionId, {
        browser,
        context,
        page,
        mode: this.mode,
        browserbaseSessionId: browserbaseSession?.id,
        liveViewUrls: liveViewUrls,
        createdAt: new Date().toISOString()
      });

      return {
        sessionId,
        mode: this.mode,
        status: 'active',
        browserbaseSessionId: browserbaseSession?.id,
        replayUrl: browserbaseSession ? `https://browserbase.com/sessions/${browserbaseSession.id}` : null,
        liveViewUrl: liveViewUrls?.debuggerFullscreenUrl || null,
        liveViewUrlWithBorders: liveViewUrls?.debuggerUrl || null,
        liveViewPages: liveViewUrls?.pages || []
      };

    } catch (error) {
      console.error('Failed to create browser session:', error);
      throw error;
    }
  }

  async navigateToForm(sessionId, url) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      await session.page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      return await this.captureScreenshot(sessionId);
    } catch (error) {
      console.error('Navigation error:', error);
      throw error;
    }
  }

  async fillField(sessionId, selector, value) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      // Wait for the field to be visible
      await session.page.waitForSelector(selector, {
        state: 'visible',
        timeout: 5000
      });

      // Clear and fill the field
      await session.page.fill(selector, value);

      return await this.captureScreenshot(sessionId);
    } catch (error) {
      console.error('Fill field error:', error);
      throw error;
    }
  }

  async click(sessionId, selector) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      await session.page.click(selector);

      // Wait a bit for any animations/transitions
      await session.page.waitForTimeout(500);

      return await this.captureScreenshot(sessionId);
    } catch (error) {
      console.error('Click error:', error);
      throw error;
    }
  }

  async selectOption(sessionId, selector, value) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      await session.page.selectOption(selector, value);

      return await this.captureScreenshot(sessionId);
    } catch (error) {
      console.error('Select error:', error);
      throw error;
    }
  }

  async injectSignature(sessionId, signatureDataUrl) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      const result = await session.page.evaluate(
        async (dataUrl) => {
          // Define signature patterns for different form types
          const signaturePatterns = [
            {
              name: 'Illinois Form',
              selector: 'button.signature-button',
              type: 'modal-based',
              parentSelector: 'fl-signature'
            },
            {
              name: 'Canvas Form',
              selector: '#signature-canvas',
              type: 'direct-canvas'
            },
            {
              name: 'Generic Canvas',
              selector: 'canvas[data-signature]',
              type: 'direct-canvas'
            },
            {
              name: 'Hidden Input',
              selector: 'input[type="hidden"][name*="signature"]',
              type: 'direct-input'
            }
          ];

          // Find which pattern matches current page
          let detectedPattern = null;
          for (const pattern of signaturePatterns) {
            if (document.querySelector(pattern.selector)) {
              detectedPattern = pattern;
              break;
            }
          }

          if (!detectedPattern) {
            throw new Error('No signature field detected on current page');
          }

          console.log(`Detected signature pattern: ${detectedPattern.name}`);

          // Handle different signature types - using modal approach by default
          switch (detectedPattern.type) {
            case 'modal-based':
              return await useModalApproach(detectedPattern, dataUrl);
            case 'direct-canvas':
              return await handleDirectCanvas(detectedPattern, dataUrl);
            case 'direct-input':
              return await handleDirectInput(detectedPattern, dataUrl);
            default:
              throw new Error(`Unsupported signature pattern: ${detectedPattern.type}`);
          }


          // Modal approach for clicking through their signature flow
          async function useModalApproach(pattern, signature) {
            try {
              console.log('🔘 Using modal approach for signature injection');
              
              // Click the Sign button
              const signButton = document.querySelector(pattern.selector);
              if (!signButton) throw new Error('Sign button not found');
              
              console.log('📝 Clicking Sign button...');
              signButton.click();
              
              // Wait a bit for modal to initialize
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Look for any modal/dialog that appeared
              console.log('🔍 Searching for signature modal...');
              
              // First, let's see what elements appeared after clicking
              const allModals = document.querySelectorAll([
                '.modal',
                '.dialog', 
                '[role="dialog"]',
                '.popup',
                '.overlay',
                '[class*="modal"]',
                '[class*="dialog"]',
                '[class*="signature"]'
              ].join(','));
              
              console.log('Found potential modals:', allModals.length);
              allModals.forEach((modal, i) => {
                console.log(`Modal ${i}:`, modal.className, modal.tagName);
              });
              
              // Try to find signature input within any modal
              const signatureSelectors = [
                'canvas.draw',  // Illinois form active drawing canvas
                'canvas',       // Any canvas
                'input[type="text"]',
                'input[name*="signature"]',
                'textarea',
                '.signature-pad',
                '.signature-input'
              ];
              
              let signatureInput = null;
              let foundInModal = null;
              
              // Check each modal for signature inputs
              for (const modal of allModals) {
                for (const selector of signatureSelectors) {
                  const input = modal.querySelector(selector);
                  if (input) {
                    signatureInput = input;
                    foundInModal = modal;
                    console.log(`📝 Found signature input: ${selector} in modal:`, modal.className);
                    break;
                  }
                }
                if (signatureInput) break;
              }
              
              // If no modal found, try global search
              if (!signatureInput) {
                console.log('🔍 No modal signature found, trying global search...');
                for (const selector of signatureSelectors) {
                  signatureInput = document.querySelector(selector);
                  if (signatureInput) {
                    console.log(`📝 Found global signature input: ${selector}`);
                    break;
                  }
                }
              }
              
              if (!signatureInput) {
                // Log what we can see for debugging
                console.log('❌ No signature input found. Available elements:');
                document.querySelectorAll('*').forEach(el => {
                  if (el.tagName === 'CANVAS' || 
                      el.tagName === 'INPUT' || 
                      el.className.includes('signature') ||
                      el.className.includes('modal')) {
                    console.log('Element:', el.tagName, el.className, el.type || '');
                  }
                });
                throw new Error('No signature input found in modal or page');
              }
              
              // Inject signature based on input type
              if (signatureInput.tagName === 'CANVAS') {
                console.log('🎨 Injecting into canvas...', signatureInput.className);
                console.log('Canvas dimensions:', signatureInput.width, 'x', signatureInput.height);
                
                // For Illinois form, we need to trigger their drawing events
                if (signatureInput.classList.contains('draw')) {
                  console.log('🖋️ Illinois drawing canvas detected, triggering mouse events...');
                  
                  // Simulate a drawing action to trigger their signature detection
                  const rect = signatureInput.getBoundingClientRect();
                  const events = [
                    'pointerdown', 'pointerenter', 'pointermove', 'pointerup', 'pointerleave',
                    'mousedown', 'mouseenter', 'mousemove', 'mouseup', 'mouseleave',
                    'touchstart', 'touchmove', 'touchend'
                  ];
                  
                  // Trigger start event
                  events.slice(0, 2).forEach(eventType => {
                    signatureInput.dispatchEvent(new PointerEvent(eventType, {
                      bubbles: true,
                      clientX: rect.left + 50,
                      clientY: rect.top + 45,
                      pointerId: 1
                    }));
                  });
                }
                
                await injectIntoCanvas(signatureInput, signature);
                
                // Trigger additional events after drawing
                if (signatureInput.classList.contains('draw')) {
                  console.log('🎯 Triggering end drawing events...');
                  const rect = signatureInput.getBoundingClientRect();
                  
                  // Trigger end events
                  ['pointermove', 'pointerup', 'pointerleave'].forEach(eventType => {
                    signatureInput.dispatchEvent(new PointerEvent(eventType, {
                      bubbles: true,
                      clientX: rect.left + 100,
                      clientY: rect.top + 45,
                      pointerId: 1
                    }));
                  });
                  
                  // Trigger change/input events
                  signatureInput.dispatchEvent(new Event('change', { bubbles: true }));
                  signatureInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
              } else if (signatureInput.tagName === 'INPUT' || signatureInput.tagName === 'TEXTAREA') {
                console.log('📝 Injecting into input field...');
                signatureInput.value = signature;
                signatureInput.dispatchEvent(new Event('input', { bubbles: true }));
                signatureInput.dispatchEvent(new Event('change', { bubbles: true }));
              }
              
              // Wait a bit for the signature to be processed and button to become enabled
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Check Sign button status
              console.log('🔍 Checking Sign button status...');
              const signBtn = foundInModal?.querySelector('.btn.signature');
              if (signBtn) {
                console.log('Sign button found - Text:', signBtn.textContent.trim(), 'Disabled:', signBtn.disabled, 'Classes:', signBtn.className);
              } else {
                console.log('❌ No .btn.signature button found');
              }
              
              // Try to find and click accept/save button in the modal
              if (foundInModal) {
                const acceptButtons = [
                  '.btn.signature',  // Illinois form specific "Sign" button
                  'button[type="submit"]',
                  '.btn-primary:not(.dropdown-toggle)',
                  '.accept',
                  '.save',
                  '.done',
                  '.ok'
                ];
                
                let acceptButton = null;
                for (const selector of acceptButtons) {
                  const button = foundInModal.querySelector(selector);
                  if (button && !button.disabled) {
                    acceptButton = button;
                    console.log(`✅ Found accept button: ${selector}, text: "${button.textContent.trim()}"`);
                    break;
                  }
                }
                
                // If no enabled button found, also check for buttons with specific text
                if (!acceptButton) {
                  const allButtons = foundInModal.querySelectorAll('button');
                  for (const button of allButtons) {
                    const text = button.textContent.trim().toLowerCase();
                    if ((text.includes('sign') || text.includes('save') || text.includes('done') || text.includes('accept')) && !button.disabled) {
                      acceptButton = button;
                      console.log(`✅ Found accept button by text: "${button.textContent.trim()}"`);
                      break;
                    }
                  }
                }
                
                if (acceptButton) {
                  console.log('🔘 Clicking accept button...');
                  acceptButton.click();
                  await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                  console.log('⚠️ No enabled accept button found in modal');
                  // Log all buttons for debugging
                  const allButtons = foundInModal.querySelectorAll('button');
                  console.log('Available buttons:');
                  allButtons.forEach((btn, i) => {
                    console.log(`Button ${i}: "${btn.textContent.trim()}", disabled: ${btn.disabled}, classes: ${btn.className}`);
                  });
                }
              }
              
              return { 
                success: true, 
                method: 'modal-approach',
                pattern: pattern.name,
                inputType: signatureInput.tagName.toLowerCase()
              };
            } catch (error) {
              console.error('Modal approach error:', error);
              throw new Error(`Modal approach failed: ${error.message}`);
            }
          }

          // Direct canvas injection
          async function handleDirectCanvas(pattern, signature) {
            const canvas = document.querySelector(pattern.selector);
            if (!canvas) throw new Error('Canvas not found');
            
            await injectIntoCanvas(canvas, signature);
            
            return { 
              success: true, 
              method: 'direct-canvas',
              pattern: pattern.name 
            };
          }

          // Direct input injection
          async function handleDirectInput(pattern, signature) {
            const input = document.querySelector(pattern.selector);
            if (!input) throw new Error('Input field not found');
            
            input.value = signature;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            return { 
              success: true, 
              method: 'direct-input',
              pattern: pattern.name 
            };
          }

          // Helper function to draw signature on canvas
          async function injectIntoCanvas(canvas, signature) {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                try {
                  const ctx = canvas.getContext('2d');
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  // Trigger canvas events
                  canvas.dispatchEvent(new Event('change', { bubbles: true }));
                  canvas.dispatchEvent(new Event('input', { bubbles: true }));
                  
                  resolve();
                } catch (error) {
                  reject(error);
                }
              };
              img.onerror = () => reject(new Error('Failed to load signature image'));
              img.src = signature;
            });
          }
        },
        signatureDataUrl
      );

      console.log('Signature injection result:', result);
      
      // Wait a moment for UI updates
      await session.page.waitForTimeout(500);
      
      return {
        success: result.success,
        method: result.method,
        pattern: result.pattern,
        screenshot: await this.captureScreenshot(sessionId)
      };
      
    } catch (error) {
      console.error('Inject signature error:', error);
      throw error;
    }
  }

  async captureScreenshot(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      const screenshot = await session.page.screenshot({
        type: 'jpeg',
        quality: 80,
        fullPage: false
      });

      return `data:image/jpeg;base64,${screenshot.toString('base64')}`;
    } catch (error) {
      console.error('Screenshot error:', error);
      throw error;
    }
  }

  async getPageInfo(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');

      const url = session.page.url();
      const title = await session.page.title();

      // Get all form fields on the page
      const fields = await session.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
        return inputs.map(input => ({
          id: input.id,
          name: input.name,
          type: input.type || input.tagName.toLowerCase(),
          value: input.value,
          required: input.required,
          selector: input.id ? `#${input.id}` : input.name ? `[name="${input.name}"]` : null
        })).filter(f => f.selector);
      });

      return { url, title, fields };
    } catch (error) {
      console.error('Get page info error:', error);
      throw error;
    }
  }

  async refreshLiveViewUrls(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) throw new Error('Session not found');
      
      // Only available for Browserbase sessions
      if (session.mode !== 'browserbase' || !session.browserbaseSessionId) {
        return null;
      }

      // Refresh Live View URLs (useful when new tabs are opened)
      const debugResponse = await fetch(`https://api.browserbase.com/v1/sessions/${session.browserbaseSessionId}/debug`, {
        headers: {
          'X-BB-API-Key': this.browserbaseApiKey
        }
      });
      
      if (!debugResponse.ok) {
        throw new Error(`Debug API failed: ${debugResponse.status}`);
      }
      
      const liveViewUrls = await debugResponse.json();
      
      // Update stored session
      session.liveViewUrls = liveViewUrls;
      
      return {
        liveViewUrl: liveViewUrls?.debuggerFullscreenUrl || null,
        liveViewUrlWithBorders: liveViewUrls?.debuggerUrl || null,
        liveViewPages: liveViewUrls?.pages || []
      };
    } catch (error) {
      console.error('Refresh Live View URLs error:', error);
      throw error;
    }
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async closeSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        // Close the browser connection
        await session.browser.close();
        this.sessions.delete(sessionId);

        // Clean up Browserbase session if it exists
        const browserbaseSession = this.browserbaseSessions.get(sessionId);
        if (browserbaseSession) {
          this.browserbaseSessions.delete(sessionId);
          console.log(`Browserbase session closed : ${sessionId}, BB Session ID: ${browserbaseSession.id}`);
        } else {
          console.log(`Browser session closed: ${sessionId}`);
        }
      }
    } catch (error) {
      console.error('Close session error:', error);
    }
  }

  async closeAllSessions() {
    for (const [sessionId, session] of this.sessions) {
      try {
        await session.browser.close();
      } catch (error) {
        console.error(`Error closing session ${sessionId}:`, error);
      }
    }
    this.sessions.clear();
    this.browserbaseSessions.clear();
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  getAllSessions() {
    return Array.from(this.sessions.keys()).map(sessionId => ({
      sessionId,
      createdAt: this.sessions.get(sessionId).createdAt
    }));
  }
}

// Create singleton instance
let browserService;

export function getBrowserService() {
  if (!browserService) {
    // Will auto-detect mode from PLAYWRIGHT_MODE env var
    browserService = new RemoteBrowserService();
  }
  return browserService;
}

