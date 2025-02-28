import { useEffect, useState } from "preact/hooks";
import "croppie/croppie.css";
import "./style.scss";

import {
  AiFillCamera,
  AiOutlineCamera,
  AiOutlineClose,
  AiOutlineDownload,
  AiOutlineFileImage,
  AiOutlineRotateRight,
  AiOutlineScissor,
} from "react-icons/ai";

import Croppie from "croppie";

let CropArea = document.createElement("div");
var c;
let bg = new Image();

let DocW = 1080;
let DocH = 1350;
let Cropx = 153;
let Cropy = 387;
let CropW = 254;
let CropH = 325;

export function App(props) {
  let file = document.createElement("input");
  const [cropVis, setcropVis] = useState(false);
  const [BgLoadStatus, setBgLoadStatus] = useState(null);
  const [CroppedImg, setCroppedImg] = useState(null);
  const [CroppedImgStatus, setCroppedImgStatus] = useState(null);
  const [GeneratedData, setGeneratedData] = useState(null);
  const [PreviewAct, setPreviewAct] = useState(null);
  const [Name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  bg.src = "./bg.png";
  bg.onload = () => {
    setBgLoadStatus(1);
    console.log("Background image loaded");
  };

  let CroppedImgTag = new Image();
  CroppedImgTag.src = CroppedImg;
  CroppedImgTag.onload = () => {
    setCroppedImgStatus(1);
    console.log("Cropped image loaded");
  };

  let _canv = document.createElement("canvas");
  let _ctx = _canv.getContext("2d");
  _canv.width = DocW;
  _canv.height = DocH;

  useEffect(() => {
    if (CroppedImgStatus && Name) {
      setIsLoading(true);
      draw();
    }
  }, [CroppedImgStatus, Name]);

  // UseEffect to save user data after GeneratedData is set
  useEffect(() => {
    if (GeneratedData) {
      saveUserData();
    }
  }, [GeneratedData]);

  const saveUserData = async () => {
    if (!GeneratedData) {
      console.error("GeneratedData is not set yet");
      return;
    }

    const userData = {
      name: Name,
      email: `${Name.toLowerCase().replace(' ', '.')}@example.com`,
      created: new Date().toISOString(),
      location: 'Unknown',
      device: getDeviceType(),
      shared: false,
      posterUrl: GeneratedData
    };

    console.log('Saving user data:', {
      ...userData,
      posterUrl: userData.posterUrl.substring(0, 50) + "..." // Log only part of the base64 string
    });

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save user: ${response.status} - ${errorText}`);
      }
      const savedUser = await response.json();
      setUserId(savedUser._id);
      console.log('User saved to MongoDB:', savedUser);
    } catch (err) {
      console.error('Error saving user to MongoDB:', err.message);
      console.error('Error details:', err);
    }
  };

  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  };

  const draw = () => {
    if (BgLoadStatus && CroppedImgStatus) {
      console.log("Drawing canvas...");
      _ctx.clearRect(0, 0, DocW, DocH);
      _ctx.drawImage(CroppedImgTag, Cropx, Cropy);
      _ctx.drawImage(bg, 0, 0);
      _ctx.font = "600 30px 'Anek Malayalam', sans-serif";
      _ctx.fillStyle = "black";

      let _name = Name.toLocaleUpperCase();
      let txtW = _ctx.measureText(_name).width;
      _ctx.shadowBlur = 5;
      _ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      _ctx.fillText(_name, Cropx + CropW / 2 - txtW / 2, Cropy + CropH + 50);

      const dataUrl = _canv.toDataURL("image/jpeg");
      setGeneratedData(dataUrl);
      setIsLoading(false);
      console.log("GeneratedData set:", dataUrl.substring(0, 50) + "...");
    } else {
      console.log("Draw failed - Missing:", { BgLoadStatus, CroppedImgStatus });
      setIsLoading(false);
    }
  };

  const updateShareStatus = async () => {
    if (!userId) {
      console.warn('No userId available to update share status');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shared: true })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update share status: ${response.status} - ${errorText}`);
      }
      console.log('Share status updated in MongoDB');
    } catch (err) {
      console.error('Error updating share status:', err.message);
      console.error('Error details:', err);
    }
  };

  file.type = "file";
  file.accept = "image/*";
  let Img;
  file.onchange = () => {
    let _file = file.files[0];
    if (!_file) return;

    let fileReader = new FileReader();
    fileReader.readAsDataURL(_file);
    fileReader.onload = () => {
      Img = fileReader.result;
      console.log("Image file loaded");
      Crop();
    };
  };

  const Crop = () => {
    setcropVis(true);
    c = new Croppie(CropArea, {
      url: Img,
      viewport: {
        height: CropH,
        width: CropW,
      },
      boundary: {
        height: CropH + 100,
        width: CropW + 100,
      },
      enableOrientation: true
    });
    console.log("Cropper initialized");
  };

  const rotateImage = () => {
    c.rotate(90);
    console.log("Image rotated");
  };

  const Preview = () => {
    return (
      <>
        {PreviewAct && (
          <div
            onClick={() => {
              setPreviewAct(false);
            }}
            className="preview-modal"
          >
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-preview-btn" onClick={() => setPreviewAct(false)}>
                <AiOutlineClose size="24" />
              </button>
              <img src={GeneratedData} alt="Preview" />
              <a
                href={GeneratedData}
                download="campaign-poster.jpg"
                className="download-preview-btn"
                onClick={updateShareStatus}
              >
                <AiOutlineDownload size="20" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="modern-app">
      <div className="app-header">
        <h1>Campaign Poster Generator</h1>
        <p>Create your personalized campaign poster in seconds</p>
      </div>

      <div className="app-container">
        <div className="card">
          <div className="input-group">
            <label htmlFor="name-input">Enter Your Name</label>
            <input
              id="name-input"
              value={Name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              type="text"
              placeholder="e.g. Muhammed Basheer"
              className="modern-input"
            />
          </div>

          <div className="photo-upload">
            <button
              onClick={() => {
                file.click();
              }}
              className="upload-btn"
            >
              <AiOutlineCamera size="20" />
              <span>Upload Photo</span>
            </button>

            {!CroppedImg && !isLoading && (
              <div className="upload-placeholder">
                <AiFillCamera size="40" />
                <p>Upload your photo to get started</p>
              </div>
            )}

            {isLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Generating your poster...</p>
              </div>
            )}
          </div>

          {GeneratedData && (
            <div className="result-section">
              <div className="poster-preview">
                <img src={GeneratedData} alt="Generated Poster" />
              </div>

              <div className="action-buttons">
                <a
                  href={GeneratedData}
                  download="campaign-poster.jpg"
                  className="download-btn"
                  onClick={updateShareStatus}
                >
                  <AiOutlineDownload size="20" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => {
                    setPreviewAct(true);
                  }}
                  className="preview-btn"
                >
                  <AiOutlineFileImage size="20" />
                  <span>Full Preview</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`cropper-modal ${cropVis ? "visible" : ""}`}>
        <div className="cropper-content">
          <div className="cropper-header">
            <h3>Adjust Your Photo</h3>
            <button
              onClick={() => {
                c.destroy();
                setcropVis(false);
              }}
              className="close-btn"
            >
              <AiOutlineClose size="24" />
            </button>
          </div>

          <div
            ref={(e) => {
              if (e) {
                e.innerHTML = "";
                e.append(CropArea);
              }
            }}
            className="crop-area"
          ></div>

          <div className="cropper-controls">
            <button onClick={rotateImage} className="rotate-btn">
              <AiOutlineRotateRight size="20" />
              <span>Rotate</span>
            </button>
            <button
              onClick={() => {
                c.result({
                  type: 'base64',
                  size: 'viewport',
                  format: 'jpeg',
                  quality: 1
                }).then((e) => {
                  console.log("Crop applied, setting CroppedImg");
                  setCroppedImg(e);
                  c.destroy();
                  setcropVis(false);
                }).catch(err => {
                  console.error("Error cropping image:", err);
                });
              }}
              className="apply-btn"
            >
              <AiOutlineScissor size="20" />
              <span>Apply</span>
            </button>
          </div>
        </div>
      </div>

      <Preview />
    </div>
  );
}