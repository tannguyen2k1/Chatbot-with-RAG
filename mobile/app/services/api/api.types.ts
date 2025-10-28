/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

/**
 * User type from backend
 */
export interface User {
  id: number
  username: string
  email?: string
  full_name?: string
  phone?: string
  is_active: number
  tenant_id: number
  roles?: string[]
  permissions?: Record<string, string[]>
  created_at: string
  updated_at?: string
}

export interface PaginatedUserResponse {
  data: User[]
  total: number
  page: number
  page_size: number
}

export interface UserRequest {
  username: string
  password?: string
  email?: string
  full_name?: string
  phone?: string
  is_active?: boolean | number
  roles?: string[]
}

/**
 * Login request type
 */
export interface LoginRequest {
  username: string
  password: string
  tenant_code: string
}

/**
 * Login response type
 */
export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

/**
 * Demo type
 */
export interface Demo {
  id: number
  title: string
  description?: string
  created_at: string
  updated_at?: string
}

/**
 * Paginated Demo response
 */
export interface PaginatedDemoResponse {
  data: Demo[]
  total: number
  page: number
  page_size: number
}

/**
 * Demo create/update request
 */
export interface DemoRequest {
  title: string
  description?: string
}

// Role types
export interface Role {
  id: number
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface PaginatedRoleResponse {
  data: Role[]
  total: number
  page: number
  page_size: number
}

export interface RoleRequest {
  name: string
  description?: string
}

// Tenant types
export interface Tenant {
  id: number
  name: string
  tenant_code: string
  domain?: string | null
  subdomain?: string | null
  expiration_date?: string | null
  is_active: boolean
}

export interface PaginatedTenantResponse {
  data: Tenant[]
  total: number
  page: number
  page_size: number
}

export interface TenantRequest {
  name: string
  tenant_code: string
  domain?: string | null
  subdomain?: string | null
  expiration_date?: string | null
  is_active?: boolean
}

// Audit Log types
export interface AuditLogItem {
  id: number
  action: string
  table_name: string
  record_id: number
  timestamp: string
  old_value?: string | null
  new_value?: string | null
  description?: string | null
  user?: { id: number; username?: string; full_name?: string } | null
}

export interface PaginatedAuditLogResponse {
  data: AuditLogItem[]
  total: number
  page: number
  page_size: number
}
