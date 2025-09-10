import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LandingPage = () => {
  const [role, setRole] = useState("");
  const [roomID, setRoomID] = useState("");
  const [userID, setUserID] = useState("");
  const roleRef = useRef();
  const userIDRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryRole = params.get("role");
    const queryRoomID = params.get("roomID");
    const userID = params.get("userID");

    if (queryRole && queryRoomID) {
      navigate("/whiteboard", {
        state: { role: queryRole, roomID: queryRoomID, userID: userID },
      });
    }
  }, [location, navigate]);

  const handleRedirect = async (e) => {
    e.preventDefault();
    setUserID(userIDRef.current.value);
    setRole(roleRef.current.value);
    const data = { roomID, role, userID };
    navigate("/whiteboard", { state: data });
    console.log("Redirected");
  };

  const styles = {
    container: {
      maxWidth: "400px",
      margin: "50px auto",
      padding: "20px",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      fontFamily: "Arial, sans-serif",
    },
    heading: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#333",
    },
    formGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontWeight: "bold",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "10px",
      fontSize: "14px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
    },
    select: {
      width: "100%",
      padding: "10px",
      fontSize: "14px",
      borderRadius: "4px",
      border: "1px solid #ccc",
      boxSizing: "border-box",
    },
    button: {
      width: "100%",
      padding: "10px",
      backgroundColor: "#4CAF50",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
      fontSize: "16px",
      cursor: "pointer",
    },
    buttonHover: {
      backgroundColor: "#45a049",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Select Your Role</h1>
      <form onSubmit={handleRedirect}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Role:</label>
          <select
            ref={roleRef}
            style={styles.select}
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            <option value="">Select Role</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Room ID:</label>
          <input
            type="text"
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            placeholder="Enter Room ID"
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>User ID:</label>
          <input
            ref={userIDRef}
            type="text"
            value={userID}
            onChange={(e) => 
              setUserID(e.target.value)
            }
            placeholder="Enter User ID"
            style={styles.input}
          />
        </div>
        <button
          type="submit"
          style={styles.button}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#45a049")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#4CAF50")}
        >
          Join Whiteboard
        </button>
      </form>
    </div>
  );
};

export default LandingPage;
