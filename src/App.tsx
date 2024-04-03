import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { v4 as uuidv4 } from "uuid";

let sessionSalt = "";

function App() {
  let popup = null as any;
  const backendHost = "https://localhost:7104";
  const frontEndCallback = "http://localhost:3000";

  const [socialSigninData, setSocialSigninData] = useState<any>();
  const [district, setDistrict] = useState<string>(
    "Thu duc, Ho Chi Minh city, Vietnam"
  );
  const [visualizeLoading, setVisualizeLoading] = useState<boolean>(true);

  const [position, setPosition] = useState<{
    latitude: Number | null;
    longitude: Number | null;
  } | null>({ latitude: null, longitude: null });

  useEffect(() => {
    // Handle callback response
    window.addEventListener("message", receiveMessage, false);

    detectMyLocation();

    return () => {
      // Cleanup
      window.removeEventListener("message", receiveMessage, false);
    };
  }, []);

  useEffect(() => {
    console.log(
      `Current position: latitude: ${position?.latitude} longitude: ${position?.longitude}`
    );
  }, [position]);

  const detectMyLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          setPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        undefined,
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not available in your browser.");
    }
  };

  const buildLocationUrl = () => {
    // Generate random security salt and store this
    sessionSalt = uuidv4();

    const callbackUrl = new URL(frontEndCallback);
    callbackUrl.searchParams.append("sessionSalt", sessionSalt);

    const url = new URL(`${backendHost}/external/google/location`);

    url.searchParams.append("ulat", `${position?.latitude}`);
    url.searchParams.append("ulng", `${position?.longitude}`);
    url.searchParams.append("address", district);
    url.searchParams.append("accessToken", socialSigninData?.accessToken);
    url.searchParams.append("returnUrl", callbackUrl.toString());
    
    return url.toString();
  };

  const socialSignin = (provider: string) => {
    // Generate random security salt and store this
    sessionSalt = uuidv4();

    // Build callback url
    const callbackUrl = new URL(frontEndCallback);
    callbackUrl.searchParams.append("sessionSalt", sessionSalt);

    // Build backend url
    const url = new URL(
      `${backendHost}/api/v1/external/signin/${provider}/challenge`
    );
    url.searchParams.append("returnUrl", callbackUrl.toString());

    // Start flow in popup
    popup = window.open(url, "_blank", "width=800,height=600,left=200,top=200");
  };

  // Handle callback response
  const receiveMessage = (event: any) => {
    // security check
    if (
      event.origin === backendHost &&
      event.data.sessionSalt === sessionSalt
    ) {
      switch (event.data.action) {
        case "SocialSignin":
          // authenticated data
          setSocialSigninData(event.data.result);
          break;
        case "LocationVerification":
          console.log(event.data.result);
          break;
        default:
          break;
      }
    } else {
      console.log("Avoid unknown message post");
      setSocialSigninData(undefined);
    }
  };

  return (
    <div>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>Single-Sign-On with social accounts</p>
          <div
            style={{ display: "flex", justifyContent: "space-around", gap: 15 }}
          >
            <button onClick={() => socialSignin("google")}>Google</button>
            <button onClick={() => socialSignin("facebook")}>Facebook</button>
            <button onClick={() => socialSignin("kakao")}>Kakao</button>
            <button onClick={() => socialSignin("naver")}>Naver</button>
          </div>
        </header>
        <br />
        <div className="result">
          <p>
            <span>
              <b>Username: </b>
              <span>{socialSigninData?.userName}</span>
            </span>
            <span> | </span>
            <span>
              <b>User roles: </b>
              <span>{socialSigninData?.userRoles}</span>
            </span>
          </p>

          <b>Access token: </b>
          <p>
            <span>{socialSigninData?.accessToken}</span>
          </p>
          <b>Refresh token: </b>
          <p>
            <span>{socialSigninData?.refreshToken}</span>
          </p>
        </div>
        <div>
          <b>My location: </b>
          <span>{`(${position?.latitude ?? "NaN"}, ${
            position?.longitude ?? "NaN"
          })`}</span>
          <span> - </span>
          <button
            onClick={() => (position ? setPosition(null) : detectMyLocation())}
          >
            {position ? "Remove" : "Detect"}
          </button>
        </div>
        <div>
          <input
            style={{ width: "50%" }}
            onKeyUp={(e: any) => {
              setVisualizeLoading(true);
              setDistrict(e.target.value);
            }}
            defaultValue={district}
          />
          <span> - </span>
          <button onClick={() => setVisualizeLoading(!visualizeLoading)}>
            Visualize
          </button>
        </div>

        <h4>Visualized:</h4>
        <div>
          {!visualizeLoading && socialSigninData?.accessToken && (
            <iframe
              style={{ width: "450px", height: "450px" }}
              title="map"
              id="map"
              allow="geolocation *;"
              src={buildLocationUrl()}
            ></iframe>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;