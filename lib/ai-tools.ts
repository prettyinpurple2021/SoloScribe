export const thinkDeeply = async (query: string, identity?: { why: string; vision: string; constraints: string }): Promise<string> => {
  const response = await fetch("/api/thinkDeeply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, identity }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to process request");
  }

  return data.text;
};

export const quickPolish = async (content: string, identity?: { why: string; vision: string; constraints: string }): Promise<string> => {
  const response = await fetch("/api/quickPolish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, identity }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to process request");
  }

  return data.text;
};
