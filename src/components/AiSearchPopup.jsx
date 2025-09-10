import React, { useState } from "react";
import { emitQuestion } from "../socketConn/socketConn";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";

const AiSearchPopup = ({ onClose, userID }) => {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("english");

  const answerFromAI = useSelector((state) => state.ai.answerFromAI);

  const getResponseFromAI = () => {
    const questionText =
      question +
      " please answer in " +
      language +
      " Language only if it is explicit content do not give answer just warn about the ";
    emitQuestion({ question: questionText, userID });
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    console.log("Selected language:", e.target.value);
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClose && typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: "absolute",
        top: 200,
        left: 450,
        background: "#fff",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        width: 500,
        maxHeight: "80vh",
        overflowY: "auto",
        zIndex: 9999,
      }}
    >
      <button
        type="button"
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          borderRadius: "50%",
          width: "28px",
          height: "28px",
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: "1",
        }}
        onClick={handleClose}
        onMouseDown={handleClose}
      >
        ×
      </button>

      <div style={{ marginTop: "10px" }}>
        <p
          style={{ marginBottom: "15px", fontSize: "16px", fontWeight: "600" }}
        >
          Search For Definition Or Word Meaning
        </p>

        <div style={{ marginBottom: "15px" }}>
          <input
            style={{
              padding: "10px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "#f9fafb",
              color: "#374151",
              marginRight: "10px",
              width: "200px",
              outline: "none",
            }}
            type="text"
            value={question}
            placeholder="Enter your question..."
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            type="button"
            style={{
              padding: "10px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
            onClick={getResponseFromAI}
          >
            Get Response
          </button>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="language-select"
            style={{
              display: "block",
              marginBottom: "5px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
            }}
          >
            Select Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              color: "#374151",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="urdu">Urdu</option>
            <option value="marathi">Marathi</option>
            <option value="tamil">Tamil</option>
            <option value="telugu">Telugu</option>
            <option value="bengali">Bengali</option>
            <option value="gujarati">Gujarati</option>
            <option value="kannada">Kannada</option>
            <option value="malayalam">Malayalam</option>
            <option value="punjabi">Punjabi</option>
            <option value="odia">Odia</option>
          </select>
        </div>

        {answerFromAI && (
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "12px",
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#374151",
              }}
            >
              {answerFromAI}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AiSearchPopup;
