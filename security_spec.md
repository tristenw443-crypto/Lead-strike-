# Security Specification for LeadStrike

## 1. Data Invariants
- Each Lead MUST have a `businessName`, `url`, `email`, and `securityStatus`.
- Leads cannot be modified to spoof owner information (RBAC/Identity integrity).

## 2. The "Dirty Dozen" Payloads (Examples)
1. { "businessName": "", "url": "...", "email": "..." } // Missing required fields
2. { "businessName": "A", "url": "...", "email": "...", "riskScore": "high" } // Wrong type for riskScore
3. { "businessName": "A", "url": "...", "email": "...", "securityStatus": "NotValid" } // Invalid Enum
4. { "businessName": "...", "url": "...", "email": "...", "riskScore": 101 } // Out of bounds
5. { "businessName": "...", "url": "...", "email": "...", "securityStatus": "Unsecured", "ghostField": "bad" } // Injection attempt
... and so on.

## 3. Test Runner (Conceptual)
A set of tests in `firestore.rules.test.ts` to be implemented using the Firebase Rules Emulator to deny the payloads above.
