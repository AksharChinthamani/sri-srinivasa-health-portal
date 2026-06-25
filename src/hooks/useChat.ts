'use client';

import { useCallback, useState } from 'react';

export function useChat() {
  const [messages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (_message: string) => {
    setLoading(true);
    try {
      // Send message via API
    } finally {
      setLoading(false);
    }
  }, []);

  return { messages, loading, sendMessage };
}
