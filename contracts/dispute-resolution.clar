;; dispute-resolution.clar

;; Define data structures
(define-map disputes
  { id: uint }
  {
    feed-id: uint,
    timestamp: uint,
    challenger: principal,
    challenged-value: int,
    stake: uint,
    status: (string-ascii 20),
    resolution: (optional (string-ascii 256))
  }
)

(define-data-var next-dispute-id uint u0)

;; Constants
(define-constant dispute-stake-amount u100000000) ;; 100 tokens
(define-constant dispute-period u144) ;; ~1 day (assuming 144 blocks per day)

;; Functions for managing disputes
(define-public (file-dispute (feed-id uint) (timestamp uint) (challenged-value int))
  (let
    (
      (dispute-id (var-get next-dispute-id))
    )
    ;; In a real implementation, we would check if the challenger has enough stake
    ;; and if the challenged value differs from the reported value
    (map-set disputes
      { id: dispute-id }
      {
        feed-id: feed-id,
        timestamp: timestamp,
        challenger: tx-sender,
        challenged-value: challenged-value,
        stake: dispute-stake-amount,
        status: "active",
        resolution: none
      }
    )
    (var-set next-dispute-id (+ dispute-id u1))
    (ok dispute-id)
  )
)

(define-public (resolve-dispute (dispute-id uint) (resolution (string-ascii 256)))
  (let
    (
      (dispute (unwrap! (map-get? disputes { id: dispute-id }) (err u404)))
    )
    (asserts! (is-eq (get status dispute) "active") (err u400))
    (asserts! (> block-height (+ (get timestamp dispute) dispute-period)) (err u403))
    ;; In a real implementation, we would check if the resolver has the authority to resolve disputes
    (ok (map-set disputes
      { id: dispute-id }
      (merge dispute
        {
          status: "resolved",
          resolution: (some resolution)
        }
      )
    ))
  )
)

(define-read-only (get-dispute (dispute-id uint))
  (map-get? disputes { id: dispute-id })
)

(define-read-only (is-dispute-active (dispute-id uint))
  (match (map-get? disputes { id: dispute-id })
    dispute (is-eq (get status dispute) "active")
    false
  )
)

