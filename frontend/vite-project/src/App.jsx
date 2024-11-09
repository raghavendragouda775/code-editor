import { useEffect, useState } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import { Editor } from '@monaco-editor/react';

const socket = io("https://codeeditor-ste1.onrender.com");

function App() {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("//START CODE HERE");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const[typing,setTyping]=useState("");


  useEffect(() => {
    socket.on("userJoined", (users) => {
   
      setUsers(users); 
    });
    socket.on("codeUpdate",(newCode)=>{
      setCode(newCode)
    })
   socket.on("UserTyping",(user)=>{
    setTyping(`${user.slice(0,8)}...is typing`)
    setTimeout(()=>{
      setTyping("")
    },2000);
    
   })
   socket.on("languageUpdate",(newLangauge)=>{
    setLanguage(newLangauge)
   })
    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate")
      socket.off("UserTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(()=>{
     const handleBeforeUnload=()=>{
      socket.emit("leaveRoom");

     }
     window.addEventListener("beforeunload",handleBeforeUnload);
     return(()=>{
      window.removeEventListener("beforeunload",handleBeforeUnload)
     })
  },[])

  // Join the specified room
  const joinRoom = () => {
    if (roomId && userName) {
      
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    console.log("Emitting codeChange and typing:", { roomId, userName });
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing",{roomId,userName});
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="User Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }
  const handleChangeLanguage=e=>{
    const newLangauge=e.target.value;
    setLanguage(newLangauge);
    socket.emit("languageChange",{roomId,language:newLangauge})
  }
  const leaveRoom=()=>{
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("//START CODE HERE");
    setCode("javascript");
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">Copy Id</button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>

        <h3>Users in Room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}...</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleChangeLanguage}
            
      
        >
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
        </select>
        
        <button className="leave-button" onClick={leaveRoom}>Leave Room</button>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
          }}
        />
      </div>
    </div>
  );
}

export default App;
