import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = '@souqone_recent_searches'
const MAX_HISTORY = 10

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const addSearch = useCallback(async (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return

    setHistory(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
      return updated
    })
  }, [])

  const removeSearch = useCallback(async (term: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item !== term)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
      return updated
    })
  }, [])

  const clearHistory = useCallback(async () => {
    setHistory([])
    try {
      await AsyncStorage.removeItem(STORAGE_KEY)
    } catch {
      // Fail silently
    }
  }, [])

  return {
    history,
    isLoading,
    addSearch,
    removeSearch,
    clearHistory,
  }
}
