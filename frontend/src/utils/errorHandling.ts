/**
 * Standardized error handling utilities for consistent error management
 */

export interface ErrorInfo {
  message: string
  code?: string
  details?: any
}

export class AppError extends Error {
  public readonly code?: string
  public readonly details?: any

  constructor(message: string, code?: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

/**
 * Standardizes error messages from various sources
 */
export function normalizeError(error: unknown): ErrorInfo {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      details: error.details
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'GENERIC_ERROR'
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
      code: 'STRING_ERROR'
    }
  }

  return {
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
    details: error
  }
}

/**
 * Creates user-friendly error messages
 */
export function getUserFriendlyMessage(error: unknown, context?: string): string {
  const normalized = normalizeError(error)
  
  // Map specific error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Unable to connect to the server. Please check your internet connection.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'NOT_FOUND': 'The requested item could not be found.',
    'UNAUTHORIZED': 'You are not authorized to perform this action.',
    'FORBIDDEN': 'Access denied.',
    'CONFLICT': 'This action conflicts with existing data.',
    'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.'
  }

  const baseMessage = errorMessages[normalized.code || ''] || normalized.message
  
  if (context) {
    return `${context}: ${baseMessage}`
  }
  
  return baseMessage
}

/**
 * Handles errors in store actions with consistent patterns
 */
export function handleStoreError(
  error: unknown,
  errorRef: { value: string | null },
  context: string,
  shouldThrow = false
): void {
  const userMessage = getUserFriendlyMessage(error, context)
  errorRef.value = userMessage
  
  // Log the full error for debugging
  console.error(`Store error in ${context}:`, error)
  
  if (shouldThrow) {
    throw error
  }
}

/**
 * Wraps async operations with standardized error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorRef: { value: string | null },
  context: string,
  shouldThrow = false
): Promise<T | null> {
  try {
    errorRef.value = null
    return await operation()
  } catch (error) {
    handleStoreError(error, errorRef, context, shouldThrow)
    return null
  }
}

/**
 * Creates a retry wrapper for operations that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        break
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError
}
