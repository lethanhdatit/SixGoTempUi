import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import { v4 as uuidv4 } from "uuid";

let sessionSalt = "";

function App() {
  const backendIdHost = "https://192.168.1.13:8104";
  const frontEndCallback = "http://localhost:3000";

  const [socialSigninData, setSocialSigninData] = useState<any>();

  const [locationResult, setLocationResult] = useState<any>();
  const [district, setDistrict] = useState<string>(
    "Thu duc, Ho Chi Minh city, Vietnam"
  );
  const [visualization, setVisualization] = useState<boolean>(false);
  const [requestMap, setRequestMap] = useState<any>();
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

  const visualizeGoogleMap = () => {
    fetch(
      `${backendIdHost}/id/v1/external/google/maps/locations/visualization`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${socialSigninData?.accessToken}`,
        },
        body: JSON.stringify({
          data: {
            address: district,
            userPosition: {
              lat: position?.latitude,
              lng: position?.longitude,
            }
          }
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        setRequestMap(data.data);
        setVisualization(true);
        sessionSalt = data.data.security;
      })
      .catch((e) => alert("Unauthorized"));
  };

  const socialSignin = (provider: string) => {
    // Generate random security salt and store this
    sessionSalt = uuidv4();

    // Build callback url
    const callbackUrl = new URL(frontEndCallback);
    callbackUrl.searchParams.append("security", sessionSalt);

    // Build backend url
    const url = new URL(
      `${backendIdHost}/id/v1/external/${provider}/signin/challenge`
    );
    url.searchParams.append("callBackUrl", callbackUrl.toString());

    // Start flow in popup
    window.open(url, "_blank", "width=800,height=600,left=200,top=200");
  };

  // Handle callback response
  const receiveMessage = (event: any) => {
    // security check
    if (event.data.security === sessionSalt) {
      switch (event.data.action) {
        case "SocialSignin":
          setSocialSigninData(event.data.result);
          break;
        case "ResidenceVerification":
          setLocationResult(event.data.result);
          break;
        default:
          break;
      }
    } else {
      console.log("Avoid unknown message post");
      setSocialSigninData(undefined);
      setLocationResult(undefined);
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
              setDistrict(e.target.value);
              setVisualization(false);
            }}
            defaultValue={district}
          />
          <span> - </span>
          <button onClick={() => visualizeGoogleMap()}>Visualize</button>
        </div>
        <div>
          <b>Result: </b>
          <span>{JSON.stringify(locationResult)}</span>
        </div>
        <h4>Visualized:</h4>
        <div>
          {visualization && requestMap?.mapUrl && (
            <iframe
              style={{ width: "450px", height: "450px" }}
              title="map"
              id="map"
              // allow="geolocation *;"
              src={requestMap.mapUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
