import React, { Component } from "react";
import UploadService from "../services/upload-files.service";
import aubio from "aubiojs";

const ragas = {
  Hindolam: [
    { name: 'S', lower: 195, upper: 495 },
    { name: 'G2', lower: 275, upper: 575 },
    { name: 'M1', lower: 325, upper: 625 },
    { name: 'D1', lower: 430, upper: 730 },
    { name: 'N2', lower: 500, upper: 800 },
    { name: 'S1', lower: 590, upper: 890 }
  ],
  Anandabhairavi: [
    { name: 'S', lower: 195, upper: 495 },
    { name: 'G2', lower: 275, upper: 575 },
    { name: 'R2', lower: 245, upper: 545 },
    { name: 'M1', lower: 325, upper: 625 },
    { name: 'P', lower: 390, upper: 690 },
    { name: 'D2', lower: 455, upper: 755 },
    { name: 'S1', lower: 590, upper: 890 }
  ],
  // kalyani: [
  //   { name: 'S', lower: 195, upper: 495}, // 208 Hz
  //   { name: 'R2', lower: 245, upper: 575},   // 234 Hz
  //   { name: 'G3', lower: 150, upper: 350 },   // 260 Hz
  //   { name: 'M2', lower: 200, upper: 400},   // -->   296 Hz
  //   { name: 'P', lower: 390, upper: 690},     // -->   312 Hz
  //   { name: 'D2', lower: 455, upper: 755},    // -->   347 Hz
  //   { name: 'N3', lower: 300, upper: 500},   //-->   390 Hz
  //   { name: 'S1', lower: 590, upper: 890}    //  -->   416 Hz ] 
  // ],
  // Abhogi: [
  //   { name: 'S', lower: 195, upper: 495}, // 208 Hz
  //   { name: 'R2', lower: 245, upper: 575},   // 234 Hz
  //   { name: 'G2', lower: 275, upper: 575 },   // 250 Hz
  //   { name: 'M1', lower: 325, upper: 625},   // -->   278 Hz
  //   { name: 'D2', lower: 455, upper: 755},    // -->   347 Hz
  //   { name: 'S1', lower: 590, upper: 890}    //  -->   416 Hz 
  // ]
};

export default class UploadFiles extends Component {
  constructor(props) {
    super(props);
    this.selectFile = this.selectFile.bind(this);
    this.upload = this.upload.bind(this);

    this.state = {
      selectedFiles: undefined,
      currentFile: undefined,
      progress: 0,
      message: "",

      fileInfos: [],
    };
  }

  componentDidMount() {
    UploadService.getFiles().then((response) => {
      this.setState({
        fileInfos: response.data,
      });
    });
  }

  selectFile(event) {
    this.setState({
      selectedFiles: event.target.files,
    });
  }

  fileToBuffer = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  getPitchNameAndRaga = (pitch) => {

    const ragaMap = {
      'S': 261.626,  // Sa
      'r1': 293.665,  // Re (komal)
      'R1': 293.665,  // Re (shuddha)
      'g1': 329.628,  // Ga (komal)
      'G1': 329.628,  // Ga (shuddha)
      'm1': 349.228,  // Ma (komal)
      'M1': 349.228,  // Ma (shuddha)
      'P': 391.995,  // Pa
      'd1': 440.000,  // Dha (komal)
      'D1': 440.000,  // Dha (shuddha)
      'n1': 493.883,  // Ni (komal)
      'N1': 493.883,  // Ni (shuddha)
      'S1': 523.251   // Sa (shuddha)
    }
  
    const noteNumber = 12 * (Math.log2(pitch / 440) + 4);
    const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const noteName = noteNames[Math.floor(noteIndex)] + octave;
  
    let closestRaga = null;
    let closestDistance = Infinity;
    for (const [ragaName, ragaFrequency] of Object.entries(ragaMap)) {
     const distance = Math.abs(pitch - ragaFrequency);
     if (distance < closestDistance) {
        closestRaga = ragaName.toUpperCase();
        closestDistance = distance;
      }
    }
  
    return {
      noteName,
      closestRaga
    }
  }
  

  upload = async () => {
    const currentFile = this.state.selectedFiles[0];
    const fileBuffer = await this.fileToBuffer(currentFile);
    console.log(Buffer.from(fileBuffer));

    const { Pitch } = await aubio();
    const audioData = new Float32Array(Buffer.from(fileBuffer));

    const pitchDetector = new Pitch('default', 2048, 1024, 44100);

    const pitches = [];
    let noteNames = []
    let ragaNames = []
    for (let i = 0; i < audioData.length; i += 1024) {
      if(audioData.slice(i, i + 1024) !== "undefined" && audioData[i + 1024]){
        const pitch = pitchDetector.do(audioData.slice(i, i + 1024));
        const {noteName, closestRaga} = this.getPitchNameAndRaga(pitch)
        noteNames.push(noteName)
        ragaNames.push(closestRaga)
        pitches.push({
          pitchFrequency: pitch,
          noteName: closestRaga
        });
      }
    }

    console.log(pitches);

    noteNames = noteNames.filter(function (value) {
      return !Number.isNaN(value);
    });
  
    noteNames = noteNames.filter((value, index, self) => self.indexOf(value) === index);
  
    ragaNames = ragaNames.filter(function (value) {
      return !Number.isNaN(value);
    });
  
    ragaNames = ragaNames.filter((value, index, self) => self.indexOf(value) === index);

    const scores = {};
    Object.keys(ragas).forEach((ragaName) => {
      const notes = ragas[ragaName];
      let score = 0;
      notes.forEach((note) => {
        console.log(note);
        const matches = pitches.filter((pitch) => 
          pitch.pitchFrequency >= note.lower && pitch.pitchFrequency <= note.upper && pitch.noteName === note.name
        );
        console.log(matches);
        score += matches.length;
        console.log({score, note, ragaName})
      });
      scores[ragaName] = score;
    })

    console.log(scores, 'scores');

    // Determine the raga with highest score
    let maxScore = 0;
    let ragaName = 'Unkonwn';
    Object.keys(scores).forEach((name) => {
      if(scores[name] > maxScore) {
        maxScore = scores[name];
        ragaName = name;
      }
    });

    this.setState({
      message: `RAGA NAME: ${ragaName}`,
    });

    this.setState({
      progress: 0,
      currentFile: currentFile,
    });

    this.setState({
      selectedFiles: undefined,
    });
  }

  render() {
    const {
      selectedFiles,
      currentFile,
      progress,
      message,
      fileInfos,
    } = this.state;

    return (
      <div>
        {currentFile && (
          <div className="progress">
            <div
              className="progress-bar progress-bar-info progress-bar-striped"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
              style={{ width: progress + "%" }}
            >
              {progress}%
            </div>
          </div>
        )}

        <label className="btn btn-default">
          <input type="file" onChange={this.selectFile} />
        </label>

        <button
          className="btn btn-success"
          disabled={!selectedFiles}
          onClick={this.upload}
        >
          Upload
        </button>

        <div className="alert alert-light" role="alert">
          {message}
        </div>
      </div>
    );
  }
}
