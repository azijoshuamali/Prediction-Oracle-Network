import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock storage for staker info
const stakerInfo = new Map()

// Constants
const MIN_STAKE = 1000000
const LOCK_PERIOD = 1440

// Mock functions to simulate contract behavior
function stake(staker: string, amount: number) {
  if (amount < MIN_STAKE) throw new Error("Insufficient stake amount")
  
  const currentStake = stakerInfo.get(staker) || { amount: 0, lockedUntil: 0 }
  stakerInfo.set(staker, {
    amount: currentStake.amount + amount,
    lockedUntil: Date.now() + LOCK_PERIOD * 1000, // simulating block time in seconds
  })
  
  return true
}

function unstake(staker: string, amount: number) {
  const currentStake = stakerInfo.get(staker)
  if (!currentStake) throw new Error("No stake found")
  if (currentStake.amount < amount) throw new Error("Insufficient stake")
  if (Date.now() < currentStake.lockedUntil) throw new Error("Stake is still locked")
  
  stakerInfo.set(staker, {
    amount: currentStake.amount - amount,
    lockedUntil: currentStake.lockedUntil,
  })
  
  return true
}

function getStakeInfo(staker: string) {
  return stakerInfo.get(staker)
}

function isActiveStaker(staker: string) {
  const stake = stakerInfo.get(staker)
  return stake && stake.amount >= MIN_STAKE && Date.now() < stake.lockedUntil
}

describe("Staking Contract", () => {
  beforeEach(() => {
    stakerInfo.clear()
  })
  
  it("should allow staking", () => {
    const result = stake("staker1", 2000000)
    expect(result).toBe(true)
    expect(stakerInfo.get("staker1").amount).toBe(2000000)
  })
  
  it("should not allow staking below minimum", () => {
    expect(() => stake("staker1", 500000)).toThrow("Insufficient stake amount")
  })
  
  it("should allow unstaking after lock period", () => {
    stake("staker1", 2000000)
    
    // Fast-forward time
    vi.useFakeTimers()
    vi.advanceTimersByTime(LOCK_PERIOD * 1000 + 1)
    
    const result = unstake("staker1", 1000000)
    expect(result).toBe(true)
    expect(stakerInfo.get("staker1").amount).toBe(1000000)
    
    vi.useRealTimers()
  })
  
  it("should not allow unstaking during lock period", () => {
    stake("staker1", 2000000)
    expect(() => unstake("staker1", 1000000)).toThrow("Stake is still locked")
  })
  
  it("should correctly identify active stakers", () => {
    stake("staker1", 2000000)
    expect(isActiveStaker("staker1")).toBe(true)
    
    // Fast-forward time past lock period
    vi.useFakeTimers()
    vi.advanceTimersByTime(LOCK_PERIOD * 1000 + 1)
    
    expect(isActiveStaker("staker1")).toBe(false)
    
    vi.useRealTimers()
  })
})

