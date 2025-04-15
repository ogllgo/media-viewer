'use client'

import { useState, useEffect } from "react";

export default function Home() {
  const [filePath, setFilePath] = useState("endpoint.txt");
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);

  function update(data: FormData) {
    const newPath = data.get("newPath");
    if (newPath)
      setFilePath(newPath.toString());
  }
  useEffect(() => {
    fetch(`http://localhost:3000/next?path=${filePath}`)
      .then(res => res.json())
      .then(data => {

      })
  })

  return (
    <div>
      <p>Hello, World!</p>

      <p>We are at: {filePath}</p>

      <form action={update}>
        <input name="newPath" />
        <button type="submit">Update</button>
      </form>
    </div>
  )
}
