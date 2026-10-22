"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ErpDirectionId, NavigationSubItem, ErpDirection } from "@/config/navigationRegistry";

interface NavigationContextType {
  isSubmenuPinned: boolean;
  toggleSubmenu: () => void;
  setSubmenuPinned: (pinned: boolean) => void;
  mobileOpen: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  toolsDrawerOpen: boolean;
  setToolsDrawerOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  currentDirectionId: ErpDirectionId;
  setCurrentDirectionId: (id: ErpDirectionId) => void;
  roadmapItem: { item: NavigationSubItem; direction: ErpDirection | null } | null;
  openRoadmapDialog: (item: NavigationSubItem, direction: ErpDirection | null) => void;
  closeRoadmapDialog: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Lazy state initialization to read from localStorage without cascading renders
  const [isSubmenuPinned, setIsSubmenuPinned] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("noxia_submenu_pinned");
        if (saved !== null) {
          return saved === "true";
        }
      } catch {
        // Ignore localStorage access restrictions
      }
    }
    return true;
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentDirectionId, setCurrentDirectionId] = useState<ErpDirectionId>("dashboard");
  const [roadmapItem, setRoadmapItem] = useState<{
    item: NavigationSubItem;
    direction: ErpDirection | null;
  } | null>(null);

  const setSubmenuPinned = useCallback((pinned: boolean) => {
    setIsSubmenuPinned(pinned);
    try {
      localStorage.setItem("noxia_submenu_pinned", String(pinned));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleSubmenu = useCallback(() => {
    setIsSubmenuPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("noxia_submenu_pinned", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => setMobileOpen((prev) => !prev), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const openRoadmapDialog = useCallback(
    (item: NavigationSubItem, direction: ErpDirection | null) => {
      setRoadmapItem({ item, direction });
    },
    [],
  );

  const closeRoadmapDialog = useCallback(() => {
    setRoadmapItem(null);
  }, []);

  // Keyboard shortcut Ctrl+B and Ctrl+K global listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSubmenu();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSubmenu]);

  return (
    <NavigationContext.Provider
      value={{
        isSubmenuPinned,
        toggleSubmenu,
        setSubmenuPinned,
        mobileOpen,
        toggleMobile,
        closeMobile,
        toolsDrawerOpen,
        setToolsDrawerOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        currentDirectionId,
        setCurrentDirectionId,
        roadmapItem,
        openRoadmapDialog,
        closeRoadmapDialog,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
