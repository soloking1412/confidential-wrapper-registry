import "@testing-library/jest-dom"
import { vi } from "vitest"

// Polyfill localStorage for jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, "localStorage", { value: localStorageMock })

// Suppress console.error from React in tests
vi.spyOn(console, "error").mockImplementation(() => {})
