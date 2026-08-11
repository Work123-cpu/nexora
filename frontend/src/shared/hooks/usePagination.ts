import { useState } from 'react'

export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const reset = () => setPage(initialPage)

  return { page, pageSize, setPage, setPageSize, reset }
}
