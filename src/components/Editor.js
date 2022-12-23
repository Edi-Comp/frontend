import React, { useState, useEffect, useRef, useCallback } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
// editor styles
import "quill/dist/quill.snow.css";
function Editor() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();
  var timeout;

  useEffect(() => {
    const s = io("http://localhost:5000");
    setSocket(s);
    return () => {
      saveDocument();
      s.disconnect();
    };
  }, []);

  // On Reloading
  window.onbeforeunload = function (e) {
    saveDocument();
  };

  // On Closing Tab
  window.onpopstate = (e) => {
    saveDocument();
  };

  //To Push code to the database
  const saveDocument = () => {
    console.log("saving from frontend");
    socket.emit("save-document", quill.getText());
  };

  // loading the document when joining
  useEffect(() => {
    if (socket == null || quill == null) return;
    socket.once("load-document", (text) => {
      quill.setText(text);
      quill.enable();
    });
    socket.emit("join-room", 1, "zaid");
  }, [socket, quill]);

  // Update doc for other users when one of them saves their document
  useEffect(() => {
    if (quill == null || socket == null) return;
    socket.on("re-load-document", (doc) => {
      console.log("reloading");
      quill.setText(doc);
    });
  }, [socket, quill]);

  // Save Document on new user connecting
  useEffect(() => {
    if (quill == null || socket == null) return;
    socket.on("user-connected", (username) => {
      saveDocument();
    });
    socket.on("user-disconnected", (username) => {
      console.log(username + " diconnected");
    });
  }, [socket, quill]);

  // recieve changes socket to socket
  useEffect(() => {
    if (quill == null || socket == null) return;
    const handler = (delta) => {
      console.log("recieving");
      quill.updateContents(delta);
    };
    socket.on("recieve-message", handler);

    return () => {
      socket.off("recieve-message", handler);
    };
  }, [socket, quill]);

  // Send changes from socket to socket
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
          onKeyUp={() => {
            console.log("key up");
            clearTimeout(timeout);
            timeout = setTimeout(saveDocument, 60000);
          }}
          // onKeyDown={() => {
          //   console.log("key down")
          //   clearTimeout(timeout);
          // }}
        ></div>
      </div>
    </>
  );
}

export default Editor;
