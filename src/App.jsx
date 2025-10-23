import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./App.css";

const App = () => {
  const [mainChatArray, setMainChatArray] = useState(
    JSON.parse(localStorage.getItem("mainChatArray")) || []
  );
  const [chatArray, setChatArray] = useState(
    JSON.parse(localStorage.getItem("chatArray")) || []
  );
  const [query, setQuery] = useState(
    JSON.parse(localStorage.getItem("typedQuery")) || ""
  );
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleChange = (e) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    localStorage.setItem("chatArray", JSON.stringify(chatArray));

    window.scrollBy({
      top: 300,
      behavior: "smooth",
    });
  }, [chatArray]);

  useEffect(() => {
    localStorage.setItem("typedQuery", JSON.stringify(query));
  }, [query]);

  useEffect(() => {
    localStorage.setItem("mainChatArray", JSON.stringify(mainChatArray));
  }, [mainChatArray]);

  const geminiResponse = async (query) => {
    try {
      // maintain conversation history properly
      const conversation = chatArray.flatMap((item) => [
        {
          role: "user",
          parts: [{ text: item.que }],
        },
        {
          role: "model",
          parts: [{ text: item.res }],
        },
      ]);

      // Add current user query
      conversation.push({
        role: "user",
        parts: [{ text: `${query}\n\nUse this info if helpful` }],
      });

      // Send correct structured payload to Gemini
      const response = await axios.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBE9xbENPJURmat3usnhN8TNeGvioRSQeY",
        {
          contents: conversation,
        }
      );

      const summary =
        response.data.candidates?.[0]?.content?.parts?.[0]?.text.replaceAll(
          "**",
          ""
        ) || "No response received.";

      // Update state + localStorage
      setChatArray((prev) => {
        const updated = [...prev, { que: query, res: summary }];
        localStorage.setItem("chatArray", JSON.stringify(updated));
        return updated;
      });
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching Gemini response:", err);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const final = () => {
    geminiResponse(query);
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const createNewChat = () => {
    setMainChatArray([...mainChatArray, { oldChat: chatArray }]);
    setChatArray([]);
  };

  const activeChat = (chat) => {
    setChatArray(chat);
  };
  // Utility to convert plain text URLs to clickable <a> tags safely
  const linkifyText = (text) => {
    if (typeof text !== "string") return text;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4ea1ff", textDecoration: "underline" }}
          >
            {part}
          </a>
        );
      } else {
        return part;
      }
    });
  };

  const deleteChat = (chatToDelete) => {
    const filteredChats = mainChatArray.filter(
      (eachChat) => eachChat !== chatToDelete
    );
    setMainChatArray(filteredChats);
  };

  const generatePdf = (item) => {
    const doc = new jsPDF();
    doc.text(item.res, 10, 10);
    const blob = new Blob([doc.output("blob")], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chat.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setPdfUrl(url);
  };

  return (
    <div className="main-page">
      <h1>ask list</h1>
      <button onClick={createNewChat}>New Chat</button>
      <h1>Previous chats</h1>
      <ul>
        {mainChatArray.map((oldChats, id) => (
          <div>
            <button onClick={() => deleteChat(oldChats)}>delete</button>
            <li
              onClick={() => activeChat(oldChats.oldChat)}
              style={{ height: "60px", overflow: "hidden" }}
              key={id}
            >
              <h3>Chat {id + 1}</h3>
              <ul
                style={{
                  listStyleType: "none",
                  padding: "20px",
                  margin: "20px",
                  border: "1px solid black",
                }}
              >
                {oldChats.length !== 0 &&
                  oldChats.oldChat.map((chat, idx) => (
                    <li key={idx}>
                      <p style={{ textAlign: "right" }}>{chat.que}</p>
                      <p style={{ textAlign: "left" }}>{chat.res}</p>
                    </li>
                  ))}
              </ul>
            </li>
          </div>
        ))}
      </ul>
      <button onClick={scrollToBottom}>scroll</button>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="add task"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            geminiResponse(query);
          }
        }}
        className="search-box"
      />
      <button onClick={final}>add</button>
      <ul>
        {chatArray.map((item, index) => (
          <li className="full-chat" key={index}>
            <p style={{ textAlign: "right", width: "100vw", order: "1" }}>
              {item.que}
            </p>
            {loading ? (
              <p style={{ textAlign: "left" }}>loading...</p>
            ) : (
              <div
                style={{
                  width: "50vw",
                  backgroundColor: "#1e1e1e",
                  color: "#eaeaea",
                  padding: "16px 20px",
                  borderRadius: "10px",
                  lineHeight: "1.8",
                  fontSize: "16px",
                  fontFamily: "poppins, sans-serif",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  border: "1px solid #333",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                  margin: "14px 0",
                  textAlign: "justify",
                  marginTop: "100px",
                  order: "0",
                }}
              >
                {Array.isArray(item.res) ? (
                  item.res.map((line, index) => (
                    <p
                      key={index}
                      style={{
                        textAlign: "left",
                        width: "50vw",
                        marginBottom: "5px",
                      }}
                    >
                      {linkifyText(line)}
                    </p>
                  ))
                ) : (
                  <p style={{ textAlign: "left", width: "50vw" }}>
                    {linkifyText(item.res)}
                  </p>
                )}
                <button onClick={() => generatePdf(item)}>Generate Pdf</button>
                {pdfUrl && (
                  <>
                    <iframe
                      src={pdfUrl}
                      frameborder="0"
                      width="600"
                      height="400"
                      title="PDF Preview"
                    ></iframe>
                    <a href={pdfUrl} download="chat.pdf">
                      Download PDF
                    </a>
                  </>
                )}
              </div>
            )}
          </li>
        ))}

        <h1>have fun</h1>
      </ul>
    </div>
  );
};

export default App;
