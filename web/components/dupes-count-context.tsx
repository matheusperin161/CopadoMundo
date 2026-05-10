"use client"

import { createContext, useContext, useState } from "react"

interface DupesCountContextValue {
  dupesCount: number
  setDupesCount: (n: number) => void
}

const DupesCountContext = createContext<DupesCountContextValue>({
  dupesCount: 0,
  setDupesCount: () => {},
})

export function DupesCountProvider({
  children,
  initialCount,
}: {
  children: React.ReactNode
  initialCount: number
}) {
  const [dupesCount, setDupesCount] = useState(initialCount)
  return (
    <DupesCountContext.Provider value={{ dupesCount, setDupesCount }}>
      {children}
    </DupesCountContext.Provider>
  )
}

export function useDupesCount() {
  return useContext(DupesCountContext)
}
