import React, { useState, useEffect, useRef, useCallback } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
// editor styles
import "quill/dist/quill.snow.css";
function Editor() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  
  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  // loading the perticular id document
  useEffect(() => {
    if (socket == null || quill == null) return;
    socket.once("load-document", (text) => {
      quill.setText(text);
      quill.enable();
    });
    socket.emit("join-room", 1, "zaid");
  }, [socket, quill]);


  // This code will work only when two people are connected from beginning, any person coming in between will not see the previous data because the editor is not yet connected to database
  // recieved changes
  useEffect(() => {
    if (quill == null || socket == null) return;
    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("recieve-message", handler);
    return () => {
      socket.off("recieve-message", handler);
    };
  }, [socket, quill]);

  // useEffect for change in quill editor text
  useEffect(() => {
    if (quill == null || socket == null) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-message", delta);
    };
    quill.on("text-change", handler);
    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  // editor ref to a div with the id : code-editor
  const editorRef = useCallback((editor) => {
    if (editor == null) return;
    editor.innerHTML = "";
    const codeEditor = document.createElement("div");
    editor.append(codeEditor);
    let q = new Quill(codeEditor, { theme: "snow" });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  // check selected file if its null or not
  return (
    <>
      <div className="lines-editor">
        <div
          id="code-editor"
          className="main-editor-code"
          ref={editorRef}
        ></div>
      </div>
    </>
  );
}

export default Editor;
