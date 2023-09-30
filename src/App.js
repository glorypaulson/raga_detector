import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import UploadFiles from "./components/upload-files.component";
import backgroundImg from './ragabg.png';


function App() {
  return (
    <div style={{
      backgroundImage: `url(${backgroundImg})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    <div className="container" style={{ width: "600px" }}>
      <div style={{ margin: "20px" }}>
        <h3>Raga Detector</h3>
        <h4>Upload Files</h4>
      </div>
      <UploadFiles />
    </div>
    </div>
  );
}

export default App;
