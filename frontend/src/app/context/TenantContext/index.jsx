"use client"
import React, { createContext, useContext, useState, useEffect } from "react"
import { parse } from "tldts"

const TenantContext = createContext()

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null)
  const [tenantCode, setTenantCode] = useState("root")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const hostname = window.location.hostname
      let subdomain = ""

      if (hostname.endsWith(".localhost")) {
        // Xử lý thủ công cho *.localhost
        subdomain = hostname.replace(".localhost", "")
      } else {
        // Dùng tldts cho domain thật
        const parsed = parse(hostname, { allowPrivateDomains: true })
        subdomain = parsed.subdomain || ""
      }

      if (subdomain && !["www", "api"].includes(subdomain.toLowerCase())) {
        setTenantCode(subdomain)
      } else {
        setTenantCode("root")
      }
    } catch (error) {
      console.error("Error detecting tenant:", error)
      setTenantCode("root")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = {
    tenant,
    tenantCode,
    isLoading,
    setTenant
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
