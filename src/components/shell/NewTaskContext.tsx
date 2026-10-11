"use client";

import { createContext, useContext, useState } from "react";
import { NewTaskPanel } from "./NewTaskPanel";

const NewTaskContext = createContext<{ open: () => void }>({ open: () => {} });

export function NewTaskProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NewTaskContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isOpen && <NewTaskPanel onClose={() => setIsOpen(false)} />}
    </NewTaskContext.Provider>
  );
}

export function useNewTask() {
  return useContext(NewTaskContext);
}

export function NewTaskButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const { open } = useNewTask();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
