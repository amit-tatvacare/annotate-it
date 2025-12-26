# Annotate It

A modern, interactive web application for annotating images with drawing tools. Upload any image and add annotations, highlights, or notes using customizable drawing tools.

## 🎯 Features

- **Image Upload**: Upload any image file to use as a background for annotations
- **Customizable Drawing Tools**:
  - Adjustable pen color (color picker)
  - Adjustable pen size (1-20px)
  - Eraser tool with adjustable size
- **Background Image Controls**:
  - Fit (contain) - maintains aspect ratio, fits within canvas
  - Fill (cover) - maintains aspect ratio, fills entire canvas
  - Stretch - stretches image to fill canvas dimensions
- **Drawing Actions**:
  - Undo/Redo functionality
  - Clear all annotations
  - Export annotated image as PNG
- **User-Friendly Interface**: Clean, modern UI with intuitive controls

## 🛠️ Technologies Used

- **React 19.2.3** - UI framework
- **react-sketch-canvas 6.2.0** - Canvas drawing library
- **Create React App** - Build tooling and development environment
- **gh-pages** - GitHub Pages deployment

## 📋 Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn package manager

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/amit-tatvacare/annotate-it.git
cd annotate-it
```

2. Install dependencies:
```bash
npm install
```

## 💻 Usage

### Development Mode

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000) in your browser. The page will automatically reload when you make changes to the code.

### Using the Application

1. **Upload an Image**: Click "Upload Background" and select an image file from your device
2. **Choose Drawing Settings**:
   - Select a pen color using the color picker
   - Adjust pen size using the slider (1-20px)
   - Choose background image sizing option (Fit, Fill, or Stretch)
3. **Draw Annotations**: Click and drag on the canvas to draw
4. **Use Eraser**: Click the "Eraser" button to switch to eraser mode
5. **Manage Your Work**:
   - Use "Undo" to remove the last action
   - Use "Redo" to restore an undone action
   - Use "Clear All" to remove all annotations
6. **Export**: Click "Save Image" to download your annotated image as a PNG file

## 📜 Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm test`

Launches the test runner in interactive watch mode. See the [running tests](https://facebook.github.io/create-react-app/docs/running-tests) section for more information.

### `npm run build`

Builds the app for production to the `build` folder. The build is optimized and minified for best performance. The app is ready to be deployed!

### `npm run deploy`

Builds the app and deploys it to GitHub Pages. This command:
1. Runs `predeploy` script (which builds the app)
2. Deploys the `build` folder to the `gh-pages` branch

### `npm run eject`

**Note: This is a one-way operation. Once you `eject`, you can't go back!**

Ejects from Create React App, giving you full control over the build configuration. All configuration files and dependencies are copied into your project.

## 📁 Project Structure

```
annotate-it/
├── public/                 # Static files
│   ├── default-image.jpg  # Default placeholder image
│   ├── index.html         # HTML template
│   └── ...
├── src/                   # Source code
│   ├── App.js            # Main application component
│   ├── App.css           # Application styles
│   ├── App.test.js       # Application tests
│   ├── index.js          # Application entry point
│   ├── index.css         # Global styles
│   └── ...
├── build/                # Production build (generated)
├── package.json          # Project dependencies and scripts
└── README.md            # This file
```

## 🎨 Key Components

### App.js

The main application component that includes:
- Canvas drawing functionality using `ReactSketchCanvas`
- Image upload handling
- Drawing tool controls (color, size, eraser)
- Background image sizing options
- Export functionality

### State Management

The app uses React hooks for state management:
- `backgroundImage`: Current background image URL
- `strokeColor`: Current pen color (hex format)
- `strokeWidth`: Current pen/eraser size (1-20px)
- `eraseMode`: Boolean flag for eraser mode
- `bgSize`: Background image sizing option

## 🚢 Deployment

The application is configured for deployment to GitHub Pages. The homepage is set to `https://amit-tatvacare.github.io/annotate-it` in `package.json`.

To deploy:

```bash
npm run deploy
```

This will:
1. Build the production-ready app
2. Deploy it to the `gh-pages` branch
3. Make it available at the configured GitHub Pages URL

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Tests are written using React Testing Library and Jest.

## 📝 Browser Support

The application supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- [react-sketch-canvas](https://github.com/vinothpandian/react-sketch-canvas) for the drawing canvas functionality
- [Create React App](https://github.com/facebook/create-react-app) for the development setup

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

Built with ❤️ using React
