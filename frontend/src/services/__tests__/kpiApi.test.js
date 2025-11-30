import { describe, it, expect, vi } from 'vitest'

// We'll mock axios.create to return an apiClient with a `get` method
vi.mock('axios', () => {
  return {
    create: () => ({
      get: vi.fn(),
    }),
  }
})

import axios from 'axios'
import { kpiApi } from '../kpiApi'

describe('kpiApi.getAssignedWorks', () => {
  it('normalizes percentage from string, null, and out-of-range values', async () => {
    const fakeGet = axios.create().get

    // prepare response data with various percentage shapes
    const worksPayload = [
      { id: 1, task_name: 'Task A', percentage: '45' },
      { id: 2, task_name: 'Task B', percentage: null },
      { id: 3, task_name: 'Task C', percentage: '150' },
      { id: 4, task_name: 'Task D', percentage: '-5' },
      { id: 5, task_name: 'Task E', percentage: 88 },
      { id: 6, task_name: 'Task F', percentage: '' },
    ]

    fakeGet.mockResolvedValueOnce({ data: { works: worksPayload } })

    const results = await kpiApi.getAssignedWorks(123)

    expect(results).toHaveLength(6)

    // Task A: '45' -> 45
    expect(results[0].percentage).toBe(45)
    expect(results[0]._debug_missing_percentage).toBe(false)
    expect(results[0]._debug_normalized_percentage).toBe(45)

    // Task B: null -> 0, missing flag true
    expect(results[1].percentage).toBe(0)
    expect(results[1]._debug_missing_percentage).toBe(true)
    expect(results[1]._debug_normalized_percentage).toBeUndefined()

    // Task C: '150' -> clamped to 100
    expect(results[2].percentage).toBe(100)
    expect(results[2]._debug_missing_percentage).toBe(false)
    expect(results[2]._debug_normalized_percentage).toBe(150)

    // Task D: '-5' -> clamped to 0
    expect(results[3].percentage).toBe(0)
    expect(results[3]._debug_normalized_percentage).toBe(-5)

    // Task E: 88 (number) -> 88
    expect(results[4].percentage).toBe(88)
    expect(results[4]._debug_missing_percentage).toBe(false)

    // Task F: empty string -> missing
    expect(results[5].percentage).toBe(0)
    expect(results[5]._debug_missing_percentage).toBe(true)
  })
})
