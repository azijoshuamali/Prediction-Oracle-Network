import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock storage for disputes
const disputes = new Map()
let nextDisputeId = 0

// Constants
const DISPUTE_STAKE_AMOUNT = 100000000
const DISPUTE_PERIOD = 144

// Mock functions to simulate contract behavior
function fileDispute(feedId: number, timestamp: number, challengedValue: number, challenger: string) {
  // In a real scenario, we would check if the challenger is an active staker
  // and if the challenged value differs from the reported value
  const disputeId = nextDisputeId++
  disputes.set(disputeId, {
    feedId,
    timestamp,
    challenger,
    challengedValue,
    stake: DISPUTE_STAKE_AMOUNT,
    status: "active",
    resolution: null,
  })
  return disputeId
}

function resolveDispute(disputeId: number, resolution: string, resolver: string) {
  const dispute = disputes.get(disputeId)
  if (!dispute) throw new Error("Dispute not found")
  if (dispute.status !== "active") throw new Error("Dispute is not active")
  if (Date.now() < dispute.timestamp + DISPUTE_PERIOD * 1000) throw new Error("Dispute period not over")
  
  // In a real scenario, we would check if the resolver is an active staker
  
  disputes.set(disputeId, {
    ...dispute,
    status: "resolved",
    resolution,
  })
  
  return true
}

function getDispute(disputeId: number) {
  return disputes.get(disputeId)
}

describe("Dispute Resolution Contract", () => {
  beforeEach(() => {
    disputes.clear()
    nextDisputeId = 0
  })
  
  it("should file a dispute", () => {
    const disputeId = fileDispute(1, Date.now(), 2000, "challenger1")
    expect(disputeId).toBe(0)
    expect(disputes.size).toBe(1)
    expect(disputes.get(0).status).toBe("active")
  })
  
  it("should resolve a dispute after the dispute period", () => {
    const timestamp = Date.now()
    const disputeId = fileDispute(1, timestamp, 2000, "challenger1")
    
    // Fast-forward time past dispute period
    vi.useFakeTimers()
    vi.advanceTimersByTime(DISPUTE_PERIOD * 1000 + 1)
    
    const result = resolveDispute(disputeId, "Resolved in favor of the challenger", "resolver1")
    expect(result).toBe(true)
    expect(disputes.get(disputeId).status).toBe("resolved")
    expect(disputes.get(disputeId).resolution).toBe("Resolved in favor of the challenger")
    
    vi.useRealTimers()
  })
  
  it("should not resolve a dispute before the dispute period ends", () => {
    const disputeId = fileDispute(1, Date.now(), 2000, "challenger1")
    expect(() => resolveDispute(disputeId, "Too early", "resolver1")).toThrow("Dispute period not over")
  })
  
  it("should not resolve a non-existent dispute", () => {
    expect(() => resolveDispute(999, "Non-existent", "resolver1")).toThrow("Dispute not found")
  })
  
  it("should not resolve an already resolved dispute", () => {
    const timestamp = Date.now()
    const disputeId = fileDispute(1, timestamp, 2000, "challenger1")
    
    // Fast-forward time past dispute period
    vi.useFakeTimers()
    vi.advanceTimersByTime(DISPUTE_PERIOD * 1000 + 1)
    
    resolveDispute(disputeId, "First resolution", "resolver1")
    expect(() => resolveDispute(disputeId, "Second resolution", "resolver2")).toThrow("Dispute is not active")
    
    vi.useRealTimers()
  })
})

