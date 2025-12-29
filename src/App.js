import React, { useRef, useState, useEffect } from "react";
import IpadOptimizedCanvas from "./IpadOptimizedCanvas";
import { HexColorPicker } from "react-colorful";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

/**
 * Main application component for the image annotation tool.
 * Provides a canvas-based interface for drawing annotations on uploaded images.
 * 
 * Features:
 * - Image upload and background display
 * - Customizable drawing tools (color, size)
 * - Eraser functionality
 * - Undo/Redo operations
 * - Export annotated images as PNG
 * 
 * @returns {JSX.Element} The main application component
 */
function App() {
  // Helper function to get the default image path
  const getDefaultImagePath = () => {
    const publicUrl = process.env.PUBLIC_URL || '';
    // Remove trailing slash from publicUrl if present, then add image path
    const cleanPublicUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
    return cleanPublicUrl ? `${cleanPublicUrl}/default-image.png` : '/default-image.png';
  };

  // References and State
  /** @type {React.RefObject} Reference to the canvas component */
  const canvasRef = useRef(null);
  
  /** @type {[string, Function]} Background image URL (default or uploaded) */
  const [backgroundImage, setBackgroundImage] = useState(getDefaultImagePath());
  
  /** @type {[number, Function]} Natural width of the background image */
  const [imageWidth, setImageWidth] = useState(1024);
  
  /** @type {[number, Function]} Natural height of the background image */
  const [imageHeight, setImageHeight] = useState(768);
  
  /** @type {[number, Function]} Current stroke color in hex format (default: red) */
  const [strokeColor, setStrokeColor] = useState("#FF0000");
  
  /** @type {[number, Function]} Current stroke width in pixels (range: 1-20) */
  const [strokeWidth, setStrokeWidth] = useState(4);
  
  /** @type {[boolean, Function]} Whether eraser mode is active */
  const [eraseMode, setEraseMode] = useState(false);
  
  /** @type {[string, Function]} Background image sizing option: "contain", "cover", or "100% 100%" */
  const [bgSize, setBgSize] = useState("contain");
  
  /** @type {[boolean, Function]} Whether color picker is visible */
  const [showColorPicker, setShowColorPicker] = useState(false);

  /** @type {[boolean, Function]} Whether digitization is in progress */
  const [isDigitizing, setIsDigitizing] = useState(false);
  
  /** @type {[string, Function]} Textual representation from Gemini */
  const [digitizedText, setDigitizedText] = useState(null);
  
  /** @type {[string, Function]} Error message from digitization */
  const [digitizationError, setDigitizationError] = useState(null);
  
  /** @type {[boolean, Function]} Whether to show the digitization result modal */
  const [showDigitizationResult, setShowDigitizationResult] = useState(false);
  
  /** @type {[string, Function]} User's Gemini API key (stored in localStorage) */
  const [apiKey, setApiKey] = useState(() => {
    // Load API key from localStorage on mount
    return localStorage.getItem('gemini_api_key') || '';
  });
  
  /** @type {[boolean, Function]} Whether to show API key settings modal */
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  
  /** @type {[string, Function]} Temporary API key input value */
  const [apiKeyInput, setApiKeyInput] = useState('');

  /**
   * Calculate canvas dimensions based on image dimensions
   * Maintains aspect ratio while fitting within reasonable bounds
   */
  const calculateCanvasDimensions = (imgWidth, imgHeight) => {
    const maxWidth = 1920; // Maximum canvas width
    const maxHeight = 1080; // Maximum canvas height
    const minWidth = 400; // Minimum canvas width
    const minHeight = 300; // Minimum canvas height
    
    let canvasWidth = imgWidth;
    let canvasHeight = imgHeight;
    
    // Scale down if image is too large
    if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
      const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
      canvasWidth = canvasWidth * scale;
      canvasHeight = canvasHeight * scale;
    }
    
    // Scale up if image is too small
    if (canvasWidth < minWidth || canvasHeight < minHeight) {
      const scale = Math.max(minWidth / canvasWidth, minHeight / canvasHeight);
      canvasWidth = canvasWidth * scale;
      canvasHeight = canvasHeight * scale;
    }
    
    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight)
    };
  };

  /**
   * Handle image load to capture its natural dimensions
   */
  const handleImageLoad = (e) => {
    const img = e.target;
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    
    if (naturalWidth && naturalHeight) {
      setImageWidth(naturalWidth);
      setImageHeight(naturalHeight);
    }
  };

  /**
   * Preload the default image to ensure it's available on page load
   */
  useEffect(() => {
    const imagePath = getDefaultImagePath();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);
      }
    };
    img.src = imagePath;
  }, []);

  /**
   * Updates the canvas erase mode when the eraseMode state changes.
   * This effect ensures the canvas component reflects the current erase mode.
   */
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(eraseMode);
    }
  }, [eraseMode]);

  /**
   * Save API key to localStorage when it changes
   */
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }, [apiKey]);


  /**
   * Close color picker when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest('.tool-group')) {
        setShowColorPicker(false);
      }
    };
    
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker]);

  /**
   * Clears all annotations from the canvas.
   */
  const handleClear = () => {
    canvasRef.current.clearCanvas();
  };

  /**
   * Undoes the last drawing action on the canvas.
   */
  const handleUndo = () => {
    canvasRef.current.undo();
  };

  /**
   * Redoes the last undone action on the canvas.
   */
  const handleRedo = () => {
    canvasRef.current.redo();
  };

  /**
   * Exports the annotated canvas as a PNG image and triggers a download.
   * Creates a temporary anchor element to download the image.
   */
  const handleExport = async () => {
    try {
      if (!canvasRef.current) {
        console.error("Canvas reference is not available");
        return;
      }

      // Export the canvas with annotations
      const data = await canvasRef.current.exportImage("png");
      
      // Calculate canvas dimensions based on image size
      const canvasDims = calculateCanvasDimensions(imageWidth, imageHeight);
      
      // Create a new canvas to combine background and annotations
      const canvas = document.createElement("canvas");
      canvas.width = canvasDims.width;
      canvas.height = canvasDims.height;
      const ctx = canvas.getContext("2d");

      // Load and draw the background image
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        bgImg.onload = () => {
          // Draw background with the same sizing as displayed
          ctx.save();
          if (bgSize === "contain") {
            const scale = Math.min(canvasDims.width / bgImg.width, canvasDims.height / bgImg.height);
            const x = (canvasDims.width - bgImg.width * scale) / 2;
            const y = (canvasDims.height - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          } else if (bgSize === "cover") {
            const scale = Math.max(canvasDims.width / bgImg.width, canvasDims.height / bgImg.height);
            const x = (canvasDims.width - bgImg.width * scale) / 2;
            const y = (canvasDims.height - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          } else {
            ctx.drawImage(bgImg, 0, 0, canvasDims.width, canvasDims.height);
          }
          ctx.restore();
          resolve();
        };
        bgImg.onerror = reject;
        bgImg.src = backgroundImage;
      });

      // Draw the annotations on top
      const annotationImg = new Image();
      await new Promise((resolve, reject) => {
        annotationImg.onload = () => {
          ctx.drawImage(annotationImg, 0, 0);
          resolve();
        };
        annotationImg.onerror = reject;
        annotationImg.src = data;
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = "annotated-image.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    } catch (e) {
      console.error("Error exporting image:", e);
      alert("Failed to export image. Please try again.");
    }
  };

  /**
   * Handles image file upload and sets it as the background image.
   * Creates an object URL from the uploaded file for display.
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - File input change event
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
      
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          setImageWidth(img.naturalWidth);
          setImageHeight(img.naturalHeight);
        }
      };
      img.src = url;
    }
  };

  /**
   * Gets the combined image (background + annotations) as a base64 string.
   * Reuses the logic from handleExport but returns base64 instead of downloading.
   * 
   * @returns {Promise<string>} Base64 encoded image data URL
   */
  const getCombinedImageAsBase64 = async () => {
    if (!canvasRef.current) {
      throw new Error("Canvas reference is not available");
    }

    // Export the canvas with annotations
    const data = await canvasRef.current.exportImage("png");
    
    // Calculate canvas dimensions based on image size
    const canvasDims = calculateCanvasDimensions(imageWidth, imageHeight);
    
    // Create a new canvas to combine background and annotations
    const canvas = document.createElement("canvas");
    canvas.width = canvasDims.width;
    canvas.height = canvasDims.height;
    const ctx = canvas.getContext("2d");

    // Load and draw the background image
    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    
    await new Promise((resolve, reject) => {
      bgImg.onload = () => {
        // Draw background with the same sizing as displayed
        ctx.save();
        if (bgSize === "contain") {
          const scale = Math.min(canvasDims.width / bgImg.width, canvasDims.height / bgImg.height);
          const x = (canvasDims.width - bgImg.width * scale) / 2;
          const y = (canvasDims.height - bgImg.height * scale) / 2;
          ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
        } else if (bgSize === "cover") {
          const scale = Math.max(canvasDims.width / bgImg.width, canvasDims.height / bgImg.height);
          const x = (canvasDims.width - bgImg.width * scale) / 2;
          const y = (canvasDims.height - bgImg.height * scale) / 2;
          ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
        } else {
          ctx.drawImage(bgImg, 0, 0, canvasDims.width, canvasDims.height);
        }
        ctx.restore();
        resolve();
      };
      bgImg.onerror = reject;
      bgImg.src = backgroundImage;
    });

    // Draw the annotations on top
    const annotationImg = new Image();
    await new Promise((resolve, reject) => {
      annotationImg.onload = () => {
        ctx.drawImage(annotationImg, 0, 0);
        resolve();
      };
      annotationImg.onerror = reject;
      annotationImg.src = data;
    });

    // Convert to base64
    return canvas.toDataURL("image/png");
  };

  /**
   * Converts base64 data URL to a format suitable for Gemini API.
   * Extracts the base64 string without the data URL prefix.
   * 
   * @param {string} dataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
   * @returns {string} Base64 string without prefix
   */
  const base64ToGeminiFormat = (dataUrl) => {
    return dataUrl.split(",")[1];
  };

  /**
   * Handles saving the API key from the settings modal
   */
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setShowApiKeySettings(false);
      setApiKeyInput('');
    }
  };

  /**
   * Handles clearing the API key
   */
  const handleClearApiKey = () => {
    setApiKey('');
    setApiKeyInput('');
    setShowApiKeySettings(false);
  };

  /**
   * Sends the annotated image to Gemini API and gets a textual representation.
   * Uses API key from localStorage (user-provided).
   */
  const handleDigitize = async () => {
    try {
      setIsDigitizing(true);
      setDigitizationError(null);
      setDigitizedText(null);

      // Check for API key
      if (!apiKey) {
        setShowApiKeySettings(true);
        setIsDigitizing(false);
        return;
      }

      // Get the combined image as base64
      const base64DataUrl = await getCombinedImageAsBase64();
      const base64Image = base64ToGeminiFormat(base64DataUrl);

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-2.5-flash for image analysis (supports vision tasks)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Prepare the image part
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/png",
        },
      };

      // Create prompt for textual representation
      const prompt = `Provide a formatted textual representation of this medical form image in a plain text field - value format. Don't make any assumptions, just extract the data as it is.`;

      // Generate content
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      setDigitizedText(text);
      setShowDigitizationResult(true);
    } catch (error) {
      console.error("Error digitizing image:", error);
      
      // Provide more helpful error messages
      let errorMessage = error.message || "Failed to digitize image. Please try again.";
      
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        errorMessage = "Model not found. Please check that your API key has access to Gemini Pro Vision model. You may need to enable the Generative Language API in Google Cloud Console.";
      } else if (errorMessage.includes("API key") || errorMessage.includes("401") || errorMessage.includes("403")) {
        errorMessage = "Invalid API key. Please check your API key in settings and ensure it's valid.";
      }
      
      setDigitizationError(errorMessage);
      setShowDigitizationResult(true);
    } finally {
      setIsDigitizing(false);
    }
  };


  return (
    <div className="app-container">
      <h1>Demo Annotation App</h1>
      <span style={{fontSize: '10px', position: 'absolute', top: 4, right: 8, opacity: 0.5}}>build id 1.001</span>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="tool-group">
          <label>Upload Background:</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>

        <div className="tool-group">
          <label>Pen Color:</label>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', position: 'relative' }}>
            {/* Color button that shows current color and opens picker */}
            <button
              type="button"
              onClick={() => {
                if (!eraseMode) {
                  setShowColorPicker(!showColorPicker);
                }
              }}
              disabled={eraseMode}
              style={{
                width: '60px',
                height: '40px',
                backgroundColor: strokeColor,
                border: '2px solid #333',
                borderRadius: '4px',
                cursor: eraseMode ? 'not-allowed' : 'pointer',
                padding: 0
              }}
              title="Click to choose color"
            />
            {/* Custom color picker popup */}
            {showColorPicker && !eraseMode && (
              <div style={{
                position: 'absolute',
                top: '50px',
                zIndex: 1000,
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <HexColorPicker
                  color={strokeColor}
                  onChange={(color) => {
                    setStrokeColor(color.toUpperCase());
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "2px" }}>
            Current: {strokeColor}
          </div>
        </div>

        <div className="tool-group">
          <label>Pen Size:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          />
        </div>

        <div className="tool-group">
          <label>Background Size:</label>
          <select 
            value={bgSize} 
            onChange={(e) => setBgSize(e.target.value)}
          >
            <option value="contain">Contain (Fit)</option>
            <option value="cover">Cover (Fill)</option>
            <option value="100% 100%">Stretch</option>
          </select>
        </div>
      </div>

      <div className="action-bar">
        <button 
          onClick={() => setEraseMode(!eraseMode)}
        >
          {eraseMode ? "Switch to Pen" : "Eraser"}
        </button>
        <button onClick={handleUndo}>Undo</button>
        <button onClick={handleRedo}>Redo</button>
        <button onClick={handleClear} className="btn-danger">Clear All</button>
        <button onClick={handleExport} className="btn-success">Save Image</button>
        <button 
          onClick={handleDigitize} 
          className="btn-primary"
          disabled={isDigitizing}
        >
          {isDigitizing ? "Digitizing..." : "Digitize Image"}
        </button>
        <button 
          onClick={() => {
            setApiKeyInput(apiKey);
            setShowApiKeySettings(true);
          }}
          className="btn-secondary"
          title="Configure Gemini API Key"
        >
          ⚙️ API Key
        </button>
      </div>

      {/* Canvas Area */}
      {(() => {
        const canvasDims = calculateCanvasDimensions(imageWidth, imageHeight);
        return (
          <div 
            className="canvas-wrapper"
            style={{
              position: "relative",
              width: `${canvasDims.width}px`,
              height: `${canvasDims.height}px`,
            }}
          >
            {/* Background Image Layer */}
            <img
              src={backgroundImage}
              alt="Background"
              onLoad={handleImageLoad}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: bgSize === "contain" ? "contain" : bgSize === "cover" ? "cover" : "fill",
                objectPosition: "center",
                zIndex: 0,
                pointerEvents: "none",
              }}
              onError={(e) => {
                // Try absolute URL as fallback
                if (!backgroundImage.startsWith('http')) {
                  const absolutePath = `${window.location.origin}${backgroundImage}`;
                  e.target.src = absolutePath;
                } else {
                  e.target.style.display = 'none';
                }
              }}
            />
            {/* Canvas Layer */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <IpadOptimizedCanvas
                ref={canvasRef}
                style={{
                  border: "2px solid #333",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                }}
                width={`${canvasDims.width}px`}
                height={`${canvasDims.height}px`}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
                eraserWidth={strokeWidth}
                canvasColor="transparent"
              />
            </div>
          </div>
        );
      })()}

      {/* Digitization Result Modal */}
      {showDigitizationResult && (
        <div className="modal-overlay" onClick={() => setShowDigitizationResult(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Digitized Image Text</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDigitizationResult(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {isDigitizing ? (
                <div className="loading-spinner">
                  <p>Processing image with Gemini...</p>
                </div>
              ) : digitizationError ? (
                <div className="error-message">
                  <p><strong>Error:</strong> {digitizationError}</p>
                  <p style={{ fontSize: "0.9rem", marginTop: "10px", color: "#666" }}>
                    Please check your API key in settings.
                  </p>
                </div>
              ) : digitizedText ? (
                <div className="digitized-text">
                  <p>{digitizedText}</p>
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDigitizationResult(false)}>Close</button>
              {digitizedText && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(digitizedText);
                    alert("Text copied to clipboard!");
                  }}
                  className="btn-success"
                >
                  Copy Text
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Key Settings Modal */}
      {showApiKeySettings && (
        <div className="modal-overlay" onClick={() => setShowApiKeySettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Gemini API Key Settings</h2>
              <button 
                className="modal-close"
                onClick={() => setShowApiKeySettings(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: "20px" }}>
                <p style={{ marginBottom: "10px", color: "#666" }}>
                  Enter your Google Gemini API key. This key is stored locally in your browser and never sent to our servers.
                </p>
                <p style={{ marginBottom: "15px", fontSize: "0.9rem", color: "#666" }}>
                  <strong>Get your API key:</strong>{" "}
                  <a 
                    href="https://makersuite.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#007bff" }}
                  >
                    https://makersuite.google.com/app/apikey
                  </a>
                </p>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  API Key:
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "1rem",
                    boxSizing: "border-box"
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveApiKey();
                    }
                  }}
                />
                {apiKey && (
                  <p style={{ marginTop: "10px", fontSize: "0.85rem", color: "#28a745" }}>
                    ✓ API key is currently set (hidden for security)
                  </p>
                )}
              </div>
              <div style={{ 
                padding: "15px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px",
                fontSize: "0.9rem",
                color: "#666"
              }}>
                <strong>Security Note:</strong> Your API key is stored only in your browser's localStorage. 
                It is never transmitted to any server except Google's Gemini API when you use the digitize feature.
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowApiKeySettings(false)}>Cancel</button>
              {apiKey && (
                <button 
                  onClick={handleClearApiKey}
                  className="btn-danger"
                >
                  Clear Key
                </button>
              )}
              <button 
                onClick={handleSaveApiKey}
                className="btn-success"
                disabled={!apiKeyInput.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;