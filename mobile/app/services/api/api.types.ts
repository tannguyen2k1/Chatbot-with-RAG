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
