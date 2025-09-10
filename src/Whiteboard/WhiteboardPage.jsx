import React, { useEffect, useRef, useState } from "react";
import CursorOverlay from "../CursorOverlay/CursorOverlay";
import { connectWithSocketServer } from "../socketConn/socketConn";
import Whiteboard from "./Whiteboard";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";

const AUDIO_SERVER_URL = "http://localhost:3001";

const peerConfig = {
  iceServers: [
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:asia.relay.metered.ca:80",
      username: "72f03df1b6a58f38d7fd81ab",
      credential: "guctVzh/8qDU4KU0",
    },
    {
      urls: "turn:asia.relay.metered.ca:80?transport=tcp",
      username: "72f03df1b6a58f38d7fd81ab",
      credential: "guctVzh/8qDU4KU0",
    },
    {
      urls: "turn:asia.relay.metered.ca:443",
      username: "72f03df1b6a58f38d7fd81ab",
      credential: "guctVzh/8qDU4KU0",
    },
    {
      urls: "turns:asia.relay.metered.ca:443?transport=tcp",
      username: "72f03df1b6a58f38d7fd81ab",
      credential: "guctVzh/8qDU4KU0",
    },
  ],
};

function WhiteboardPage() {
  const location = useLocation();
  const data = location.state;
  console.log(`from min wb page ${JSON.stringify(data)}`);

  const audioSocketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const [usernames, setUsernames] = useState({});
  const [roles, setRoles] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  // Add this line with your other useState hooks
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    connectWithSocketServer(data.roomID, data.userID);
    // eslint-disable-next-line
  }, [data.roomID, data.userID]);

  useEffect(() => {
    const joinRoom = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000, sampleSize: 16 },
        video: false,
      });
      localStreamRef.current = stream;

      const socket = io(AUDIO_SERVER_URL);
      audioSocketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join-room", {
          roomId: data.roomID,
          username: data.userID,
          role: data.role,
        });
      });

      socket.on("all-users", (users) => {
        users.forEach(({ userId, username: uname, role: urole }) => {
          setUsernames((prev) => ({ ...prev, [userId]: uname }));
          setRoles((prev) => ({ ...prev, [userId]: urole }));
          const pc = createPeerConnection(userId, true);
          peerConnectionsRef.current[userId] = pc;
        });
      });

      socket.on("user-joined", ({ userId, username: uname, role: urole }) => {
        setUsernames((prev) => ({ ...prev, [userId]: uname }));
        setRoles((prev) => ({ ...prev, [userId]: urole }));
        const pc = createPeerConnection(userId, false);
        peerConnectionsRef.current[userId] = pc;
      });

      socket.on("offer", async ({ sdp, sender }) => {
        const pc = createPeerConnection(sender, false);
        peerConnectionsRef.current[sender] = pc;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { target: sender, sdp: pc.localDescription });
      });

      socket.on("answer", async ({ sdp, sender }) => {
        const pc = peerConnectionsRef.current[sender];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
      });

      socket.on("ice-candidate", async ({ candidate, sender }) => {
        const pc = peerConnectionsRef.current[sender];
        if (pc && candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socket.on("user-left", (userId) => {
        const pc = peerConnectionsRef.current[userId];
        if (pc) {
          pc.close();
          delete peerConnectionsRef.current[userId];
        }
        setRemoteStreams((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
        setUsernames((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
        setRoles((prev) => {
          const { [userId]: _, ...rest } = prev;
          return rest;
        });
      });

      socket.on("mute", () => {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
        setIsMuted(true);
      });

      socket.on("unmute", () => {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        setIsMuted(false);
      });
    };

    const createPeerConnection = (userId, isOffer) => {
      const pc = new RTCPeerConnection(peerConfig);
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          audioSocketRef.current.emit("ice-candidate", {
            target: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        setRemoteStreams((prev) => ({ ...prev, [userId]: stream }));
      };

      if (isOffer) {
        pc.onnegotiationneeded = async () => {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          audioSocketRef.current.emit("offer", {
            target: userId,
            sdp: pc.localDescription,
          });
        };
      }
      return pc;
    };

    joinRoom();

    return () => {
      if (audioSocketRef.current) {
        audioSocketRef.current.disconnect();
      }
    };
  }, [data.roomID, data.userID, data.role]);

  const toggleMute = () => {
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  };

  const handleMuteStudent = (userId) => {
    audioSocketRef.current.emit("mute-student", { target: userId });
  };

  const handleUnmuteStudent = (userId) => {
    audioSocketRef.current.emit("unmute-student", { target: userId });
  };

  return (
    <div
      style={{
        width: "10vw",
      }}
    >
      <Whiteboard role={data.role} userID={data.userID} roomID={data.roomID} />
      <CursorOverlay />
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          // This container helps position the two elements on top of each other
          width: "320px",
          height: "450px",
          pointerEvents: "none", // Pass clicks through the container
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "flex-end",
        }}
      >
        {/* Expanded Panel View */}
        <div
          style={{
            width: "320px",
            maxHeight: "450px",
            backgroundColor: "white",
            borderRadius: "12px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            // The transition magic happens here
            transition: "opacity 300ms ease, transform 300ms ease",
            transformOrigin: "bottom right",
            // Conditionally apply styles for open/closed states
            opacity: isPanelOpen ? 1 : 0,
            transform: isPanelOpen ? "scale(1)" : "scale(0.95)",
            pointerEvents: isPanelOpen ? "auto" : "none",
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 15px",
              borderBottom: "1px solid #e0e0e0",
              backgroundColor: "#f7f7f7",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", color: "#333" }}>
              Participants ({Object.keys(remoteStreams).length + 1})
            </h3>
            <button
              onClick={() => setIsPanelOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 5px",
                color: "#666",
              }}
            >
              &times;
            </button>
          </div>

          {/* Participants List (No changes inside this div) */}
          <div style={{ overflowY: "auto", padding: "10px 15px" }}>
            {/* Your Own Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <p style={{ margin: 0, fontWeight: "bold" }}>
                You ({data.userID})
              </p>
              <button
                onClick={toggleMute}
                style={{
                  padding: "5px 12px",
                  borderRadius: "5px",
                  border: isMuted ? "1px solid #ccc" : "1px solid #d9534f",
                  backgroundColor: isMuted ? "#f0f0f0" : "#d9534f",
                  color: isMuted ? "#333" : "white",
                  cursor: "pointer",
                }}
              >
                {isMuted ? "Unmute" : "Mute"}
              </button>
            </div>

            {/* Remote Participants */}
            {Object.entries(remoteStreams).map(([id, stream]) => (
              <div
                key={id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {usernames[id] || "Unknown"} ({roles[id] || "student"})
                </p>
                <audio
                  autoPlay
                  playsInline
                  ref={(el) => {
                    if (el) el.srcObject = stream;
                  }}
                  style={{ display: "none" }}
                />
                {data.role === "teacher" && roles[id] === "student" && (
                  <div
                    style={{ display: "flex", gap: "8px", marginLeft: "10px" }}
                  >
                    <button
                      onClick={() => handleMuteStudent(id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "5px",
                        border: "1px solid #d9534f",
                        backgroundColor: "#d9534f",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Mute
                    </button>
                    <button
                      onClick={() => handleUnmuteStudent(id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "5px",
                        border: "1px solid #5cb85c",
                        backgroundColor: "#5cb85c",
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      Unmute
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Collapsed "Dot" View */}
        <button
          onClick={() => setIsPanelOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            fontSize: "12px",
            position: "absolute", // Positioned within the container
            bottom: 0,
            right: 0,
            // Transition and conditional styles for the dot
            transition: "opacity 300ms ease, transform 300ms ease",
            transformOrigin: "bottom right",
            opacity: isPanelOpen ? 0 : 1,
            transform: isPanelOpen ? "scale(0.95)" : "scale(1)",
            pointerEvents: isPanelOpen ? "none" : "auto",
          }}
        >
          <span style={{ fontSize: "18px", fontWeight: "bold" }}>
            {Object.keys(remoteStreams).length + 1}
          </span>
          <span>Users</span>
        </button>
      </div>
    </div>
  );
}

export default WhiteboardPage;
