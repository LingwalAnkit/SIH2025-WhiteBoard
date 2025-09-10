import React, { useState } from 'react';
import { emitQuestion } from '../socketConn/socketConn';
import { useSelector } from 'react-redux';

const AiSearchPopup = ({ onClose, userID }) => {
  const [question, setQuestion] = React.useState('');
  const getResponseFromAI = () => {
    const questionText = question + " please answer in " + language + " Language only if it is explicit content do not give answer just warn about the "
    emitQuestion({ question: questionText, userID })
  }
  const [language, setLanguage] = useState("english");

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    console.log("Selected language:", e.target.value);
  };
  const answerFromAI = useSelector((state) => state.ai.answerFromAI);
  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 50,
        background: "#fff",
        padding: "20px",
        border: "1px solid #ddd",
        maxHeight: '80vh',
      }}
    >
      <button style={{
        borderRadius: '100%',
        padding: '5px',
        backgroundColor: 'transparent',
        border: 'none',

      }} onClick={() => { onClose() }}>
        X
      </button>
      <div style={{
        marginBottom: 3,
        overflowY: 'scroll',
        maxHeight: '70vh'
      }}>
        <p style={{
          marginBottom: 4,
        }}> Search For Definition Or Word Meaning </p><br />
        <div>
          <input style={{
            padding: 8,
            border: 'none',
            backgroundColor: '#5d5d5d',
            color: 'white',
            marginRight: 10
          }} type="text" value={question} onChange={(e) => { setQuestion(e.target.value) }} />
          <button style={{
            padding: 8,
            backgroundColor: '#5d5d5d',
            color: 'white',
            border: 'none'

          }} onClick={() => { getResponseFromAI() }}>Get Response</button> <br />
          <label htmlFor="language-select">Select a Language: </label>
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            style={{
              padding: 10,
              marginTop: 10
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


        {
          <pre style={{
            margin: 10,
            padding: 5,
            width: '30rem'
          }}>
            {answerFromAI}
          </pre>
        }

      </div>
    </div>
  );
};

export default AiSearchPopup;
