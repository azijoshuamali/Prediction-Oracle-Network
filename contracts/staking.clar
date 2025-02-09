;; staking.clar

;; Define data structures
(define-fungible-token stake-token)

(define-map staker-info
  { staker: principal }
  {
    amount: uint,
    locked-until: uint
  }
)

;; Constants
(define-constant min-stake u1000000) ;; 1 million micro-tokens
(define-constant lock-period u1440) ;; ~10 days (assuming 144 blocks per day)

;; Functions for managing stakes
(define-public (stake (amount uint))
  (let
    (
      (current-stake (default-to { amount: u0, locked-until: u0 } (map-get? staker-info { staker: tx-sender })))
    )
    (asserts! (>= amount min-stake) (err u400))
    (try! (ft-transfer? stake-token amount tx-sender (as-contract tx-sender)))
    (ok (map-set staker-info
      { staker: tx-sender }
      {
        amount: (+ (get amount current-stake) amount),
        locked-until: (+ block-height lock-period)
      }
    ))
  )
)

(define-public (unstake (amount uint))
  (let
    (
      (current-stake (unwrap! (map-get? staker-info { staker: tx-sender }) (err u404)))
    )
    (asserts! (>= (get amount current-stake) amount) (err u401))
    (asserts! (<= block-height (get locked-until current-stake)) (err u403))
    (try! (as-contract (ft-transfer? stake-token amount tx-sender (as-contract tx-sender))))
    (ok (map-set staker-info
      { staker: tx-sender }
      {
        amount: (- (get amount current-stake) amount),
        locked-until: (get locked-until current-stake)
      }
    ))
  )
)

(define-read-only (get-stake-info (staker principal))
  (map-get? staker-info { staker: staker })
)

(define-read-only (is-active-staker (staker principal))
  (let
    (
      (stake-info (unwrap! (map-get? staker-info { staker: staker }) false))
    )
    (and
      (>= (get amount stake-info) min-stake)
      (> (get locked-until stake-info) block-height)
    )
  )
)

