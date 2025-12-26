import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import "./App.css";

function App() {
  // References and State
  const canvasRef = useRef(null);
  const [backgroundImage, setBackgroundImage] = useState(
    "https://gist.github.com/user-attachments/assets/48dfa5e2-1e90-497d-b787-deab325b3dc5" // Default placeholder
  );
  const [strokeColor, setStrokeColor] = useState("#FF0000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraseMode, setEraseMode] = useState(false);
  const [bgSize, setBgSize] = useState("contain"); // Options: contain, cover, 100% 100%

  // Update erase mode via ref when it changes
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(eraseMode);
    }
  }, [eraseMode]);


  const handleClear = () => {
    canvasRef.current.clearCanvas();
  };

  const handleUndo = () => {
    canvasRef.current.undo();
  };

  const handleRedo = () => {
    canvasRef.current.redo();
  };

  const handleExport = () => {
    canvasRef.current
      .exportImage("png")
      .then((data) => {
        const link = document.createElement("a");
        link.href = data;
        link.download = "annotated-image.png";
        link.click();
      })
      .catch((e) => {
        console.error(e);
      });
  };

  // Handlers
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBackgroundImage(url);
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setStrokeColor(newColor);
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
          <input
            type="color"
            value={strokeColor}
            onChange={handleColorChange}
            disabled={eraseMode}
          />
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "2px" }}>
            {strokeColor}
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