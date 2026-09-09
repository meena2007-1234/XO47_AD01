import { useState } from "react";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("welcome");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const sendOtp = () => {
    if (mobile.length === 10) {
      setScreen("otp");
    } else {
      alert("Please enter a valid 10-digit mobile number");
    }
  };

  const verifyOtp = () => {
    if (otp.length === 6) {
      setScreen("dashboard");
    } else {
      alert("Please enter 6-digit OTP");
    }
  };

  return (
    <div className="app">

      {screen === "welcome" && (
        <div className="card">
          <div className="shield">🛡️</div>

          <h1>ShoulderGuard</h1>

          <p className="subtitle">
            Smart Shoulder Surfing Protection
          </p>

          <p className="description">
            Protect your sensitive information from people
            looking at your smartphone screen.
          </p>

          <button onClick={() => setScreen("login")}>
            Get Started
          </button>

          <div className="privacy">
            🔒 Your privacy is our priority
          </div>
        </div>
      )}

      {screen === "login" && (
        <div className="card">

          <div className="icon">📱</div>

          <h2>Welcome Back</h2>

          <p className="description">
            Enter your mobile number to continue
          </p>

          <input
            type="tel"
            placeholder="Enter mobile number"
            maxLength="10"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/\D/g, ""))
            }
          />

          <button onClick={sendOtp}>
            Send OTP
          </button>

          <p className="small-text">
            We'll send a 6-digit verification code
          </p>

        </div>
      )}

      {screen === "otp" && (
        <div className="card">

          <div className="icon">🔐</div>

          <h2>Verify OTP</h2>

          <p className="description">
            Enter the 6-digit OTP sent to
          </p>

          <strong>+91 {mobile}</strong>

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            maxLength="6"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, ""))
            }
          />

          <button onClick={verifyOtp}>
            Verify & Continue
          </button>

          <p className="small-text">
            Didn't receive OTP? Resend OTP
          </p>

        </div>
      )}

      {screen === "dashboard" && (
        <div className="card">

          <div className="shield">🛡️</div>

          <h1>ShoulderGuard</h1>

          <p className="subtitle">
            Protection Ready
          </p>

          <div className="status">
            🟢 Account Verified
          </div>

          <button>
            Start Monitoring
          </button>

        </div>
      )}

    </div>
  );
}

export default App;