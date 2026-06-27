import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/")
      .then((res) => setMessage(res.data.message))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "32px",
      }}
    >
      {message}
    </div>
  );
}

export default App;