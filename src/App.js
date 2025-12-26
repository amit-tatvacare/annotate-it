import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { HexColorPicker } from "react-colorful";
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
  // References and State
  /** @type {React.RefObject<ReactSketchCanvas>} Reference to the canvas component */
  const canvasRef = useRef(null);
  
  /** @type {[string, Function]} Background image URL (default or uploaded) */
  const [backgroundImage, setBackgroundImage] = useState(
    `${process.env.PUBLIC_URL}/default-image.jpg` // Default placeholder (local resource)
  );
  
  /** @type {[string, Function]} Current stroke color in hex format (default: red) */
  const [strokeColor, setStrokeColor] = useState("#FF0000");
  
  /** @type {[number, Function]} Current stroke width in pixels (range: 1-20) */
  const [strokeWidth, setStrokeWidth] = useState(4);
  
  /** @type {[boolean, Function]} Whether eraser mode is active */
  const [eraseMode, setEraseMode] = useState(false);
  
  /** @type {[string, Function]} Background image sizing option: "contain", "cover", or "100% 100%" */
  const [bgSize, setBgSize] = useState("contain");
  
  /** @type {[boolean, Function]} Whether color picker is visible */
  const [showColorPicker, setShowColorPicker] = useState(false);

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
      
      // Create a new canvas to combine background and annotations
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 768;
      const ctx = canvas.getContext("2d");

      // Load and draw the background image
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        bgImg.onload = () => {
          // Draw background with the same sizing as displayed
          ctx.save();
          if (bgSize === "contain") {
            const scale = Math.min(1024 / bgImg.width, 768 / bgImg.height);
            const x = (1024 - bgImg.width * scale) / 2;
            const y = (768 - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          } else if (bgSize === "cover") {
            const scale = Math.max(1024 / bgImg.width, 768 / bgImg.height);
            const x = (1024 - bgImg.width * scale) / 2;
            const y = (768 - bgImg.height * scale) / 2;
            ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
          } else {
            ctx.drawImage(bgImg, 0, 0, 1024, 768);
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
    }
  };


  return (
    <div className="app-container">
      <h1>Demo Annotation App</h1>

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
      </div>

      {/* Canvas Area */}
      <div className="canvas-wrapper">
        <ReactSketchCanvas
          ref={canvasRef}
          style={{
            border: "2px solid #333",
            borderRadius: "8px",
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: bgSize,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          width="1024px"
          height="768px"
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          eraserWidth={strokeWidth}
          canvasColor="transparent"
        />
      </div>
    </div>
  );
}

export default App;