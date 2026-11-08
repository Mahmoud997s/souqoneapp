import { PaginationMeta } from '../types/my-listings.types'

export class ListContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ListContractError'
    Object.setPrototypeOf(this, ListContractError.prototype)
  }
}

export interface ParsedListEnvelope<T> {
  items: T[]
  meta?: PaginationMeta
  hasNextPage: boolean
}

export function parseListEnvelope<T>(raw: unknown): ParsedListEnvelope<T> {
  if (raw === null || raw === undefined) {
    throw new ListContractError('Response payload is null or undefined')
  }

  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      hasNextPage: false,
    }
  }

  if (typeof raw !== 'object') {
    throw new ListContractError(`Expected list envelope object or array, received ${typeof raw}`)
  }

  const candidate = raw as Record<string, unknown>

  if (!('items' in candidate)) {
    throw new ListContractError('Response object missing "items" array')
  }

  if (!Array.isArray(candidate.items)) {
    const receivedType = candidate.items === null ? 'null' : typeof candidate.items
    throw new ListContractError(`Expected "items" to be an array, received ${receivedType}`)
  }

  if (candidate.meta === undefined) {
    return {
      items: candidate.items as T[],
      hasNextPage: false,
    }
  }

  if (candidate.meta === null || typeof candidate.meta !== 'object' || Array.isArray(candidate.meta)) {
    throw new ListContractError('Malformed pagination meta: expected an object')
  }

  const meta = candidate.meta as Record<string, unknown>
  const { total, page, limit, totalPages } = meta

  if (
    typeof total !== 'number' || !Number.isFinite(total) || total < 0 ||
    typeof page !== 'number' || !Number.isInteger(page) || page < 1 ||
    typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 ||
    typeof totalPages !== 'number' || !Number.isInteger(totalPages) || totalPages < 0
  ) {
    throw new ListContractError('Malformed pagination meta: fields must be valid non-negative numbers')
  }

  if (totalPages > 0 && page > totalPages) {
    throw new ListContractError(`Malformed pagination meta: page (${page}) cannot exceed totalPages (${totalPages})`)
  }

  if (totalPages === 0) {
    if (total > 0) {
      throw new ListContractError(`Malformed pagination meta: totalPages cannot be 0 when total (${total}) > 0`)
    }
    if ((candidate.items as unknown[]).length > 0) {
      throw new ListContractError(`Malformed pagination meta: totalPages cannot be 0 when items is not empty`)
    }
  }

  const paginationMeta: PaginationMeta = {
    total,
    page,
    limit,
    totalPages,
  }

  return {
    items: candidate.items as T[],
    meta: paginationMeta,
    hasNextPage: page < totalPages,
  }
}
