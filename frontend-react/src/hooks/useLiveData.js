import { useState, useEffect, useRef } from 'react'

export function useWebSocket(url) {
    const [data, setData] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef(null)

    useEffect(() => {
        // Create WebSocket connection
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            console.log('WebSocket connected')
            setIsConnected(true)
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                setData(message)
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
            setIsConnected(false)
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
            setIsConnected(false)

            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                console.log('Attempting to reconnect...')
            }, 5000)
        }

        return () => {
            ws.close()
        }
    }, [url])

    const sendMessage = (message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message))
        }
    }

    return { data, isConnected, sendMessage }
}

export function useLiveData(queryFn, interval = 5000) {
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const result = await queryFn()
                setData(result)
                setError(null)
            } catch (err) {
                setError(err)
                console.error('Error fetching live data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        // Initial fetch
        fetchData()

        // Set up interval for live updates
        const intervalId = setInterval(fetchData, interval)

        return () => clearInterval(intervalId)
    }, [queryFn, interval])

    return { data, isLoading, error }
}
