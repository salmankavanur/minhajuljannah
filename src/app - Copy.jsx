import { useEffect, useState } from "preact/hooks";

import {
  AiFillAccountBook,
  AiFillCloseCircle,
  AiOutlineCamera,
  AiOutlineClose,
  AiOutlineDownload,
  AiOutlineFileImage,
  AiOutlineScissor,
} from "react-icons/ai";
import "croppie/croppie.css";
import "./style.scss";

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
  const [Name, setName] = useState(null);

  bg.src = "./bg.png";
  bg.onload = () => {
    setBgLoadStatus(1);
  };

  let CroppedImgTag = new Image();
  CroppedImgTag.src = CroppedImg;
  CroppedImgTag.onload = () => {
    setCroppedImgStatus(1);
  };

  let _canv = document.createElement("canvas");
  let _ctx = _canv.getContext("2d");
  _canv.width = DocW;
  _canv.height = DocH;

  useEffect(()=>{
    draw()
  },[CroppedImgStatus,Name])

  function draw() {
    if (BgLoadStatus && CroppedImgStatus) {
      _ctx.drawImage(CroppedImgTag, Cropx, Cropy);
      _ctx.drawImage(bg, 0, 0);
      _ctx.font = "600 30px 'Anek Malayalam', sans-serif"; // Updated to Anek font
      _ctx.fillStyle = "black";

      let _name = Name.toLocaleUpperCase();

      let txtW = _ctx.measureText(_name).width;
      _ctx.shadowBlur = 5;
      _ctx.shadowColor = "gray";

      _ctx.fillText(_name, Cropx + CropW / 2 - txtW / 2, Cropy + CropH + 50);
      setGeneratedData(_canv.toDataURL("image/jpeg"));
      //console.log(_data);
      // window.open(_data);
    } else {
      console.log(BgLoadStatus, CroppedImgStatus);
    }
  }

  file.type = "file";
  let Img;
  file.onchange = () => {
    let _file = file.files[0];
    let fileReader = new FileReader();

    fileReader.readAsDataURL(_file);
    fileReader.onload = () => {
      Img = fileReader.result;
      Crop();
    };
  };

  function Crop() {
    // console.log(Img);
    //crop.current.append(Img);
    setcropVis(true);
    c = new Croppie(CropArea, {
      url: Img,
      viewport: {
        height: CropH,
        width: CropW,
      },
    });
  }

  function Preview() {
    return (
      <>
        {PreviewAct && (
          <div
            onClick={() => {
              setPreviewAct(false);
            }}
            className="preview"
          >
            <img src={GeneratedData} alt="" srcset="" />
          </div>
        )}
      </>
    );
  }
  return (
    <>
    <div
  style={{ backgroundImage: `url('./header_bg_image.png')` }}
  className="Header"
></div>

<div className="Cont">
  <h1>Generate Poster</h1>
  <div className="Actions">
    <input
      value={Name}
      onInput={(e) => {
        setName(e.target.value);
      }}
      type="text"
      placeholder="Your Name Here"
    />
    <button
      onClick={() => {
        file.click();
      }}
    >
      <AiOutlineCamera size="30" />
    </button>
  </div>

  {GeneratedData && (
    <div className="GetAct">
      <a href={GeneratedData} download="campaign poster">
        <button className="modern-button">
          <AiOutlineDownload size="30" />
          Download
        </button>
      </a>
      <button
        onClick={() => {
          setPreviewAct(true);
        }}
        className="modern-button"
      >
        <AiOutlineFileImage size="30" />
        Preview
      </button>
    </div>
  )}
</div>

      <div
        ref={(e) => {
          if (e) {
            e.innerHTML = "";
            // e.append(_canv);
          }
        }}
      ></div>
      <Preview></Preview>
      <Cropper
        setCroppedImg={setCroppedImg}
        visible={cropVis}
        set={setcropVis}
      />
    </>
  );
}

function Cropper({ visible, set, setCroppedImg }) {
  return (
    <div className={visible ? "vi" : "hi"}>
      <div
        ref={(e) => {
          if (e) {
            e.innerHTML = "";
            e.append(CropArea);
          }
        }}
        className="Crop"
      ></div>
      <div className="Tools">
        <button
          onClick={() => {
            c.destroy();
            set(false);
          }}
        >
          <AiOutlineClose size="30" style={{ marginRight: '8px' }} />
          Close
        </button>
        <button
          onClick={() => {
            // CroppedImg =

            c.result().then((e) => {
              setCroppedImg(e);
              c.destroy();
              set(false);
            });
          }}
        >
          <AiOutlineScissor size="30" style={{ marginRight: '8px' }} />
          Crop
        </button>
      </div>
    </div>
  );
}
