# SQUAD_REFERENCE.md

**Authoritative reference for Squad API integration in SquadTrust.**

This file is the ground truth for every Squad API call in the project. It is
distilled directly from Squad's official documentation. Every endpoint, every
field name, every value here has been verified against the docs.

## Rules for Claude Code (and humans) when using this file

1. **Use exact field names from this file.** Squad's validator is strict and
   rejects unknown fields. Never invent, abbreviate, or pluralize a field name.
2. **If a field is not listed here for an endpoint, do not include it** unless
   you have just verified it against docs.squadco.com.
3. **If Squad returns a validation error mentioning a field**, do not loop
   through random shapes trying to make it pass. Surface the discrepancy and
   update this file.
4. **All amounts to Squad are in Kobo.** ₦1 = 100 Kobo. ₦500 = 50000 Kobo. Pass
   as integer or string per the endpoint's example below.
5. **All `transaction_reference` values must be globally unique** across all of
   the merchant's history. Generate with `f"{prefix}_{uuid4().hex}"`.
6. **For Transfer API specifically**, the `transaction_reference` must be
   prefixed with your merchant ID: `f"{MERCHANT_ID}_{uuid4().hex}"`. Squad
   rejects transfers without the merchant ID prefix.

---

## Environment

| | |
|---|---|
| Sandbox base URL | `https://sandbox-api-d.squadco.com` |
| Production base URL | `https://api-d.squadco.com` |
| Auth header | `Authorization: Bearer <SQUAD_SECRET_KEY>` |
| Sandbox key prefix | `sandbox_sk_` |
| Production key prefix | `sk_` |
| Content-Type | `application/json` |
| Squad webhook sender IP | `18.133.63.109` |
| Our sandbox merchant ID | `SBWCKYR7RP` |

---

## 1. Payment Gateway (Hosted Checkout)

### 1.1 Initiate Payment

```
POST /transaction/initiate
```

**Request body:**

| Field | Required | Type | Description |
|---|---|---|---|
| `email` | Yes | string | Customer email address |
| `amount` | Yes | integer | Amount in Kobo. ₦500 → `50000` |
| `currency` | Yes | string | `NGN` or `USD` |
| `initiate_type` | Yes | string | `"inline"` (embedded) or `"redirect"` |
| `transaction_ref` | Yes | string | Unique merchant-generated reference |
| `callback_url` | Yes | string | URL Squad redirects to after payment |
| `customer_name` | No | string | Display name on checkout |
| `pass_charge` | No | bool | `true` = customer pays fee, default `false` |
| `payment_channels` | No | string[] | Subset of `card`, `bank_transfer`, `ussd`, `squad` |
| `is_recurring` | No | bool | Set `true` to tokenize the card for future charges |
| `metadata` | No | object | Any custom data — returned in webhook |

**Sample request:**

```json
{
  "amount": 43000,
  "email": "henimastic@gmail.com",
  "currency": "NGN",
  "initiate_type": "inline",
  "transaction_ref": "4678388588350909090AH",
  "callback_url": "http://squadco.com"
}
```

**Response shape:** `200 OK` with `data.checkout_url`. Open this URL to load the
Squad payment modal.

---

### 1.2 Verify Transaction

```
GET /transaction/verify/{transaction_ref}
```

No request body. The `transaction_ref` goes in the URL path.

**Response:** `200 OK` with `data` object containing:

| Field | Description |
|---|---|
| `transaction_status` | One of `Success`, `Failed`, `Abandoned`, `Pending` |
| `amount` | Amount in Kobo |
| `email` | Customer email |
| `currency` | `NGN` / `USD` |

### 1.3 Verify Soft POS Transaction

```
GET /softpos/transaction/verify/{transaction_reference}
```

Same shape as 1.2 but for Soft POS (NFC) terminal transactions.

---

### 1.4 Simulate Payment (Sandbox Only — Payment Gateway)

```
POST /virtual-account/simulate/payment
```

For test escrow flows. After initiating a transaction that creates a dynamic
virtual account, call this endpoint to simulate the buyer paying into it.

**Request body:**

```json
{
  "virtual_account_number": "9279755518",
  "amount": "20000"
}
```

Note `amount` is a string here, in Kobo.

---

### 1.5 Query All Transactions

```
GET /transaction?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&perPage=20
```

**Caution:** `from` and `to` are required. Max one-month range. Requests
without dates return `400 Bad Request`.

Supports filters: `transaction_ref`, `from`, `to`, `amount`, `page`, `perPage`.

---

## 2. Squad Payment Modal (Frontend Widget)

For client-side initialization via JS SDK (not server-to-server).

```js
const squadInstance = new squad({
  onClose: () => console.log("Widget closed"),
  onLoad: () => console.log("Widget loaded"),
  onSuccess: () => console.log("Payment successful"),
  key: "sandbox_pk_...",       // PUBLIC key, not secret
  email: "buyer@example.com",
  amount: 10000,                // Already in Kobo
  currency_code: "NGN",
  transaction_ref: "optional_unique_ref",
  customer_name: "Aisha Mohammed",
  payment_channels: ["card", "bank", "ussd", "transfer"],
  callback_url: "https://squadtrust.io/callback",
  metadata: { order_id: "abc123" },
  pass_charge: false
});
squadInstance.setup();
squadInstance.open();
```

**Field names differ from the server API:**
- Modal uses `currency_code` (server uses `currency`)
- Modal uses `key` (public key) — server uses `Authorization: Bearer` (secret key)
- Modal `payment_channels` values: `card`, `bank`, `ussd`, `transfer`
- Server `payment_channels` values: `card`, `bank_transfer`, `ussd`, `squad`

---

## 3. Recurring Card Charges

### 3.1 Tokenize a Card

Set `"is_recurring": true` on the initiate call (section 1.1). The token_id
is returned in the webhook after the first successful payment.

### 3.2 Charge Tokenized Card

```
POST /transaction/charge_card
```

```json
{
  "amount": 10000,
  "token_id": "tJlYMKcwPd"
}
```

### 3.3 Cancel Tokenized Card

```
PATCH /transaction/cancel/recurring
```

```json
{
  "auth_code": ["AUTH_SlYtufQzy_452037"]
}
```

---

## 4. Direct API Integration (No Modal)

### 4.1 Charge Card Directly

```
POST /transaction/initiate/process-payment
```

```json
{
  "amount": 1000000,
  "pass_charge": true,
  "currency": "NGN",
  "webhook_url": "https://example.com/webhook",
  "card": {
    "number": "5555555555554444",
    "cvv": "121",
    "expiry_month": "12",
    "expiry_year": "50"
  },
  "payment_method": "card",
  "customer": {
    "name": "Tams Bills",
    "email": "buyer@example.com"
  },
  "redirect_url": "https://www.squadco.com/"
}
```

**Test cards (sandbox):**
| PAN | Behavior |
|---|---|
| `4242424242424242` | Direct OTP validation (amount < ₦7,500) |
| `5200000000001096` | 3DS authentication challenge |
| `5555555555554444` | PIN + OTP (two-step) |
| `5200000000000007` | Recurring payment test card |

### 4.2 Authorize Payment (after charge)

```
POST /transaction/payment/authorize
```

For PIN:
```json
{ "transaction_reference": "SQDEMO...", "authorization": { "pin": "1234" } }
```

For OTP:
```json
{ "transaction_reference": "SQDEMO...", "authorization": { "otp": "123456" } }
```

Sandbox test values: PIN = `1234`, OTP = `123456`.

### 4.3 Direct GTBank Account Debit

Same endpoint as 4.1 (`POST /transaction/initiate/process-payment`) with a
different body:

```json
{
  "transaction_reference": "test001",
  "amount": 51800,
  "pass_charge": false,
  "currency": "NGN",
  "webhook_url": "www.sampleurl.com",
  "bank": {
    "bank_code": "058",
    "account_or_phoneno": "08146663666"
  },
  "payment_method": "bank",
  "customer": {
    "name": "William Udousoro",
    "email": "test@example.com"
  }
}
```

### 4.4 Validate Direct Bank Payment

```
POST /transaction/validate-payment
```

```json
{
  "transaction_reference": "SQDEMO...",
  "authorization": { "otp_token": "123456" }
}
```

`auth_model` will be `ValidateTOKEN` (hardware token / 7377#) or `ValidateOTP`
(SMS OTP).

### 4.5 Direct USSD

Same endpoint as 4.1, body:

```json
{
  "transaction_reference": "testussd",
  "amount": 56800,
  "pass_charge": false,
  "currency": "NGN",
  "webhook_url": "www.sampleurl.com",
  "ussd": { "bank_code": "058" },
  "payment_method": "ussd",
  "customer": { "name": "Test User", "email": "test@example.com" }
}
```

### USSD Bank Codes (use in direct USSD calls)

| Bank | Code | Bank | Code |
|---|---|---|---|
| Access (Diamond) | 063 | Access | 044 |
| Ecobank | 050 | FCMB | 214 |
| Fidelity Bank | 070 | First Bank | 011 |
| GTBank | 058 | Heritage Bank | 030 |
| Keystone Bank | 082 | Rubies MFB | 125 |
| Stanbic | 221 | Sterling | 232 |
| UBA | 033 | Union Bank | 032 |
| Unity Bank | 215 | VFD Bank | 566 |
| Wema Bank | 035 | Zenith Bank | 057 |
| Globus | 00103 | Premium Trust | 105 |
| LOTUS | 303 | Optimum Trust | 107 |
| Kuda MFB | 50211 | | |

---

## 5. Static Virtual Accounts (Permanent VAs)

### 5.1 Create B2C Virtual Account

```
POST /virtual-account
```

**Required fields:**

| Field | Required | Description |
|---|---|---|
| `customer_identifier` | Yes | Your unique ID for this customer |
| `first_name` | Yes | Must match BVN portal |
| `last_name` | Yes | Must match BVN portal |
| `mobile_num` | Yes | Format: `08123456789` |
| `email` | Yes | Customer email |
| `bvn` | Yes | 11-digit BVN — strict validation against name/DOB/gender |
| `dob` | Yes | Format: `MM/DD/YYYY` |
| `address` | Yes | Customer address |
| `gender` | Yes | `"1"` for male, `"2"` for female (string) |
| `beneficiary_account` | No | GTBank account for instant settlement |

**Sample:**

```json
{
  "customer_identifier": "SQUAD_101",
  "first_name": "Joseph",
  "last_name": "Ayodele",
  "mobile_num": "08123456789",
  "email": "ayo@squadco.com",
  "bvn": "22343211654",
  "dob": "07/19/1990",
  "address": "22 Kota street, UK",
  "gender": "1",
  "beneficiary_account": "4920299492"
}
```

**Critical:** BVN must match name, DOB, gender, and phone exactly as
registered. Mismatch → no account created.

### 5.2 Create B2B Virtual Account

```
POST /virtual-account/business
```

```json
{
  "customer_identifier": "SQUAD_101",
  "business_name": "Habaripay Limited",
  "mobile_num": "08139011943",
  "bvn": "22110011001",
  "beneficiary_account": "4920299492"
}
```

Requires merchant profiling before use. Email `help@squadco.com`.

### 5.3 Query VA Transactions

```
GET /virtual-account/customer/transactions/{customer_identifier}
GET /virtual-account/merchant/transactions
GET /virtual-account/merchant/transactions/all
```

### 5.4 Query VA Details

```
GET /virtual-account/customer/{virtual_account_number}
GET /virtual-account/{customer_identifier}
```

### 5.5 Query All Merchant Accounts

```
GET /virtual-account/merchant/accounts
```

### 5.6 Webhook Error Log

```
GET /virtual-account/webhook/logs
DELETE /virtual-account/webhook/logs/{transaction_ref}
```

Retrieves up to 100 missed webhook notifications. After processing, you MUST
delete each entry or it stays in the top 100 forever.

---

## 6. Dynamic Virtual Accounts (Per-Transaction)

**This is the core escrow primitive for SquadTrust.**

**Caution:** Merchant must be profiled by Squad before use. Email
`help@squadco.com` with merchant ID `SBWCKYR7RP` to request access.

### 6.1 Create Dynamic VA Pool

```
POST /virtual-account/create-dynamic-virtual-account
```

Creates ONE account per request and adds it to your pool. Call this multiple
times to build up a pool of accounts that will be assigned per transaction.

**Optional fields (use only if you need these behaviors):**

| Field | Description |
|---|---|
| `beneficiary_account` | GTBank account for instant settlement (must be GTBank) |
| `first_name` | Custom business display name (requires authorization) |
| `last_name` | Second part of custom display name |

For instant settlement to GTBank:
```json
{ "beneficiary_account": "0147799000" }
```

For custom business name (authorized merchants only):
```json
{
  "first_name": "Habaripay",
  "last_name": "Limited"
}
```

**Plain pool addition (most common):** send an empty body or just
`Content-Type: application/json` with `{}`.

### 6.2 Initiate Dynamic VA Transaction (Assign to Buyer)

**This is the endpoint to call when a buyer is ready to pay for a specific
escrow transaction.**

```
POST /virtual-account/initiate-dynamic-virtual-account
```

| Field | Required | Description |
|---|---|---|
| `amount` | Yes | Amount in Kobo (integer) |
| `transaction_ref` | Yes | Unique merchant reference |
| `duration` | Yes | Seconds the VA stays active (e.g., 600 = 10 min) |
| `email` | Yes | Buyer's email |

**Sample:**

```json
{
  "amount": 100,
  "transaction_ref": "Aq1111BddCDqdddqdqqEw2",
  "duration": 600,
  "email": "buyer@example.com"
}
```

**Response:** returns the assigned virtual account number. Buyer transfers
the exact `amount` to that VA within `duration` seconds.

### 6.3 Re-query Transaction

```
GET /virtual-account/get-dynamic-virtual-account-transactions/{transaction_reference}
```

Returns an array of all payment attempts: `SUCCESS`, `EXPIRED`, `MISMATCH`.
Mismatched and expired payments are auto-refunded by default.

### 6.4 Edit Amount/Duration

```
PATCH /virtual-account/update-dynamic-virtual-account-time-and-amount
```

```json
{
  "transaction_reference": "ify21",
  "amount": 5000
}
```

### 6.5 Simulate Payment (Sandbox Only)

```
POST /virtual-account/simulate/payment
```

```json
{
  "virtual_account_number": "9279755518",
  "amount": "20000"
}
```

Use this in tests and during demo rehearsals to simulate a buyer funding the
escrow VA.

### 6.6 Dynamic VA Webhook Events

Squad sends a POST to your webhook URL for three event types:

**SUCCESS** — exact amount, within duration:
```json
{
  "transaction_status": "SUCCESS",
  "merchant_reference": "test55",
  "merchant_amount": "100.00",
  "amount_received": "100.00",
  "transaction_reference": "REF...",
  "email": "buyer@example.com",
  "merchant_id": "P7SJ3KMH",
  "transaction_type": "dynamic_virtual_account",
  "date": "2025-03-21T08:52:42.729Z",
  "sender_name": "WILLIAM JOSEPH UDOUSORO"
}
```

**MISMATCH** — wrong amount sent, auto-refunded by Squad.

**EXPIRED** — payment after duration, auto-refunded by Squad.

**Webhook signature header:** `x-squad-encrypted-body`

**Hash algorithm:** HMAC-SHA512 of the JSON:
```json
{
  "transaction_reference": "...",
  "amount_received": "...",
  "merchant_reference": "..."
}
```
Signed with your `sandbox_sk_...` secret key.

---

## 7. Transfer API (Outbound Payouts)

**Used for releasing escrow funds and loan disbursements.**

### 7.1 Account Lookup (Required Before Transfer)

```
POST /payout/account/lookup
```

| Field | Required | Description |
|---|---|---|
| `bank_code` | Yes | 6-digit Squad bank code (see table below — NOT 3-digit USSD codes) |
| `account_number` | Yes | 10-digit NUBAN |

**Sample request:**

```json
{
  "bank_code": "000013",
  "account_number": "0123456789"
}
```

**Sample response:**

```json
{
  "status": 200,
  "success": true,
  "message": "Success",
  "data": {
    "account_name": "JENNY SQUAD",
    "account_number": "0123456789"
  }
}
```

**Always use the returned `account_name` in the next transfer call.** Squad
rejects transfers where the name doesn't match the lookup result.

### 7.2 Fund Transfer

```
POST /payout/transfer
```

| Field | Required | Description |
|---|---|---|
| `transaction_reference` | Yes | Format: `MERCHANTID_REFERENCE`. **Must include merchant ID prefix or it fails.** |
| `amount` | Yes | String, in Kobo. ₦100 → `"10000"` |
| `bank_code` | Yes | 6-digit code from table below |
| `account_number` | Yes | 10-digit NUBAN |
| `account_name` | Yes | Verified name from account lookup |
| `currency_id` | Yes | Always `"NGN"` |
| `remark` | Yes | Narration |

**Sample:**

```json
{
  "remark": "Escrow release for order #123",
  "bank_code": "000013",
  "currency_id": "NGN",
  "amount": "10000",
  "account_number": "0933384111",
  "transaction_reference": "SBWCKYR7RP_Test222",
  "account_name": "EZE SUNDAY"
}
```

### 7.3 Transfer Error Codes

| Code | Meaning | Action |
|---|---|---|
| 200 | Success | Proceed |
| 400 | Bad request | Check params |
| 401 | Unauthorized | Verify key |
| 403 | Invalid API keys | Verify key |
| 404 | Not found | Check transaction_reference |
| 412 | Reversed | Transfer was reversed |
| 422 | Unprocessed | Retry once |
| 424 | Timeout/failed | **Must re-query before retrying** |

### 7.4 Re-query Transfer

**Critical:** On `424` response, always call this before retrying. Otherwise
you risk double payment.

```
POST /payout/requery
```

```json
{ "transaction_reference": "SBWCKYR7RP_Test222" }
```

### 7.5 List Transfers

```
GET /payout/list
```

Returns paginated history.

---

## Transfer Bank Codes (6-digit, for `/payout/*` endpoints)

**These are DIFFERENT from the 3-digit USSD codes. Use these for the Transfer
API; use the 3-digit codes only for direct USSD payments (section 4.5).**

Common banks (subset — full list of 600+ in docs):

| Code | Bank |
|---|---|
| 000001 | Sterling Bank |
| 000002 | Keystone Bank |
| 000003 | FCMB |
| 000004 | UBA |
| 000005 | Diamond Bank |
| 000006 | JAIZ Bank |
| 000007 | Fidelity Bank |
| 000008 | Polaris Bank |
| 000009 | Citi Bank |
| 000010 | Ecobank |
| 000011 | Unity Bank |
| 000012 | StanbicIBTC |
| 000013 | **GTBank Plc** |
| 000014 | Access Bank |
| 000015 | Zenith Bank Plc |
| 000016 | First Bank |
| 000017 | Wema Bank |
| 000018 | Union Bank |
| 000023 | Providus Bank |
| 000027 | Globus Bank |
| 000029 | Lotus Bank |
| 100004 | Opay Digital Services |
| 100033 | PalmPay |
| 090267 | Kuda Microfinance Bank |

For other banks, refer to the full table in the docs (Transfer API page).

---

## 8. Direct Debit (Mandates)

For pre-authorized recurring debits. Not used in SquadTrust v1, but documented
for completeness.

### 8.1 Get Bank List

```
POST /transaction/mandate/banklists
```

Returns banks that support direct debit mandates.

### 8.2 Create Mandate

```
POST /transaction/mandate/create
```

```json
{
  "mandate_type": "emandate",
  "amount": "2000000",
  "account_number": "2473064070",
  "bank_code": "050",
  "description": "20kish pilot slive",
  "start_date": "2025-08-27",
  "end_date": "2026-01-20",
  "customer_email": "test@example.com",
  "transaction_reference": "livepilot0260118",
  "customerInformation": {
    "identity": { "type": "bvn", "number": "22984135000" },
    "firstName": "william",
    "lastName": "udousoro",
    "address": "no 11 claytus street",
    "phone": "08132448008"
  }
}
```

**Sandbox note:** Wait 24 hours after creation before debiting (sandbox
limitation). A second webhook fires when the mandate is ready.

### 8.3 Debit Mandate

```
POST /transaction/mandate/debit
```

```json
{
  "amount": 50000,
  "mandate_id": "sqaudDDa27chviz8nwhv3d6w4gy",
  "transaction_reference": "super32333",
  "narration": "test2004",
  "pass_charge": false,
  "customer_email": "test@example.com"
}
```

Debits can only occur once per day per mandate.

### 8.4 Cancel Mandate

```
POST /transaction/mandate/cancel
```

```json
{
  "mandateIds": ["sqaudDD657al1hrep7m4bc", "sqaudDD5c9elxp61u3sju"]
}
```

### 8.5 Get Mandate by Ref

```
GET /transaction/mandate/get-mandates/{ref}
```

---

## 9. POS Remote Request (Software-Driven POS Terminal)

**This is the REST API for invoking payments on a physical Squad POS terminal
remotely.** Distinct from the Soft POS SDK (which runs natively on Android
with NFC).

Base URL: `https://api-d.squadco.com/softpos/` (note: this set of endpoints
ships under the production host even in test docs)

### 9.1 Create Payment Request

```
POST /softpos/pos/remote-request
```

```json
{
  "terminal_id": "2035AB01",
  "amount": 350000,
  "account_type": "default"
}
```

### 9.2 Requery Payment Status

```
GET /softpos/pos/remote-request/{request_ref}
```

**Critical TTL:** Payment requests expire after 5 minutes. Poll every 2-3
seconds until you get success, failed, or 404 (expired).

### 9.3 POS Webhook

Configure your webhook URL in the Squad dashboard. POS terminals fire to it
directly on successful payments. Sample payload:

```json
{
  "amount": 1000,
  "merchant_id": "AABBCCDDEEFFGGHHJJKK",
  "payment_info": {
    "card_pan": "539983****5128",
    "card_type": "MasterCard",
    "cardholder_name": "MARTINS OLARINDE"
  },
  "status": "success",
  "payment_method": "card",
  "transaction_type": "Purchase",
  "response_code": "00",
  "transaction_reference": "SQDEMO080830159201",
  "terminal_id": "2058ZUTK",
  "response_message": "Transaction Successful",
  "rrn": "080830159201",
  "stan": "159201",
  "currency": "NGN"
}
```

---

## 10. Other APIs

### 10.1 Aggregator / Sub-Merchants

```
POST /merchant/create-sub-users
```

Profile yourself as an aggregator; create sub-merchants dynamically.

### 10.2 Ledger Balance

```
GET /merchant/balance
```

Returns balance in Kobo. Not available for USD.

### 10.3 Disputes / Chargebacks

```
GET /dispute
```

Get all disputes. Subsequent endpoints to accept/reject chargebacks.

### 10.4 Refunds

```
POST /transaction/refund
```

Full refund:
```json
{
  "gateway_transaction_ref": "wvszq...",
  "refund_type": "Full",
  "reason_for_refund": "Customer requested",
  "transaction_ref": "vszqsdrujscpua"
}
```

Partial refund:
```json
{
  "gateway_transaction_ref": "SQOKOY...",
  "refund_type": "Partial",
  "reason_for_refund": "Damaged item",
  "transaction_ref": "SQOKOY...",
  "refund_amount": "20000"
}
```

### 10.5 Airtime & Data Vending

```
POST /vending/purchase/airtime
POST /vending/purchase/data
GET /vending/data-bundles?network=MTN
GET /vending/transactions
```

Min airtime: ₦50. Sample airtime: `{ "phone_number": "08139011943", "amount": 5000 }`.

---

## 11. Webhooks — Universal Setup

**Configure in:** Squad Dashboard → Profile → API & Webhook → Webhook URL.

**Squad expects HTTP 200 in response.** Other status codes mark the
notification as "missed" and queue it in the error log.

**Critical: implement a duplicate transaction checker** on your side. Squad
may resend webhooks. Use `transaction_reference` as your idempotency key.

### 11.1 Sample Webhook Payloads

**Card transaction:**
```json
{
  "Event": "charge_successful",
  "TransactionRef": "SQTEST6389164239897900003",
  "Body": {
    "amount": 10000,
    "transaction_ref": "SQTEST6389164239897900003",
    "transaction_status": "Success",
    "email": "buyer@example.com",
    "merchant_id": "SBBWRX1Z3S",
    "currency": "NGN",
    "transaction_type": "Card",
    "merchant_amount": 10000,
    "created_at": "2025-08-24T15:26:38.994",
    "payment_information": {
      "payment_type": "card",
      "pan": "424242******4242|0825",
      "card_type": "verve"
    },
    "is_recurring": false
  }
}
```

**Bank transfer**, **USSD**, and **Transfer** webhooks follow the same shape
with different `transaction_type` values: `Bank`, `Ussd`, `Transfer`,
`MerchantUssd`.

### 11.2 Webhook Signature Validation

**Two parallel systems exist. Know which one applies:**

#### System A: Standard Webhooks (Card / Bank / USSD / Transfer / Static VA)

**Header:** `x-squad-signature`
**Algorithm:** HMAC-SHA512 of the entire request body, hex-encoded
**Key:** Your secret key

Three versions exist for Static VA:

**V1:** Hash the entire JSON payload.

**V2 / V3:** Hash only six pipe-separated fields:
```
transaction_reference|virtual_account_number|currency|principal_amount|settled_amount|customer_identifier
```

V3 also changes the format of `transaction_reference` (use prior format for
re-queries) and adds a `version: "v3"` field to the payload.

#### System B: Dynamic VA Webhooks

**Header:** `x-squad-encrypted-body`
**Algorithm:** HMAC-SHA512
**Hash input:** JSON serialization of exactly these three fields:
```json
{
  "transaction_reference": "...",
  "amount_received": "...",
  "merchant_reference": "..."
}
```
**Key:** Your secret key
**Output format:** lowercase hex

**Python implementation:**
```python
import hmac
import hashlib
import json

def verify_dva_webhook(payload: dict, header_signature: str, secret_key: str) -> bool:
    data_to_hash = json.dumps({
        "transaction_reference": payload["transaction_reference"],
        "amount_received":       payload["amount_received"],
        "merchant_reference":    payload["merchant_reference"],
    }, separators=(", ", ": "))  # Match Squad's C# JsonSerializer output

    expected = hmac.new(
        secret_key.encode("utf-8"),
        data_to_hash.encode("utf-8"),
        hashlib.sha512,
    ).hexdigest().lower()

    return hmac.compare_digest(expected, header_signature.lower())
```

### 11.3 Webhook Error Log (Recovery)

If your server returns non-200 or is unreachable, Squad logs the missed
webhook. Retrieve with:

```
GET /virtual-account/webhook/logs
```

Returns up to 100 missed notifications. Process them, then **delete each
one** to remove from the queue:

```
DELETE /virtual-account/webhook/logs/{transaction_ref}
```

---

## 12. SquadTrust-Specific Endpoint Map

Quick reference for which endpoints SquadTrust uses for which feature.

### Escrow (Safe-Pay)
- Create transaction: `POST /virtual-account/initiate-dynamic-virtual-account`
- Receive payment: webhook on `dynamic_virtual_account` (System B)
- Release funds to merchant: `POST /payout/account/lookup` → `POST /payout/transfer`
- Re-query on 424: `POST /payout/requery`
- Sandbox simulation: `POST /virtual-account/simulate/payment`

### Soft POS (NFC Tap-to-Pay)
- Verify transaction: `GET /softpos/transaction/verify/{ref}`
- SDK (Android) handles client-side NFC capture — out of band of this REST API

### Credit Score / Loan
- Pull merchant transaction history: `GET /virtual-account/merchant/transactions/all`
- Loan disbursement: `POST /payout/account/lookup` → `POST /payout/transfer`

### Dashboard Live Updates
- Webhook handler for `dynamic_virtual_account` events (System B signature)
- Webhook handler for `Transfer` events (System A signature)

---

## 13. Hard-Won Gotchas

1. **`sandbox_sk_` keys** for sandbox base URL. Production keys silently 401.
2. **Kobo everywhere.** `int(naira * 100)`. Never floats — display only at UI edges.
3. **Unique `transaction_reference`** every time. `f"{prefix}_{uuid4().hex}"`.
4. **Transfer reference must be prefixed with merchant ID**:
   `f"{MERCHANT_ID}_{uuid4().hex}"` → `"SBWCKYR7RP_abc123"`. Without the prefix,
   `/payout/transfer` rejects with a validation error.
5. **Transfer bank codes are 6-digit** (`000013` for GTBank), not 3-digit USSD
   codes (`058`). Two different code systems exist — see sections 4.5 and 7.
6. **Always `lookup` before `transfer`.** Use the returned `account_name` in
   the transfer body. Squad rejects transfers with mismatched names.
7. **On 424 from Transfer, ALWAYS re-query.** Never blind-retry — you can pay
   twice.
8. **Dynamic VA needs merchant profiling.** Even in sandbox. Email
   `help@squadco.com` with merchant ID `SBWCKYR7RP` if you get an error
   mentioning profiling or KYC. This is also true for B2B Static VAs.
9. **Webhook returns must be HTTP 200**, no matter your internal state. Use
   `try/except` and always return 200; log errors separately.
10. **Two webhook signature systems** exist (sections 11.2-A vs 11.2-B). Pick
    the right one based on the event type.
11. **Static VA BVN validation is strict.** First name, last name, DOB,
    gender, and phone must all match the BVN record exactly.
12. **Static VA `gender` is a string**: `"1"` male, `"2"` female. Not integer,
    not `"M"`/`"F"`.
13. **Static VA `dob` format**: `MM/DD/YYYY` (US-style with slashes), not
    ISO. The docs example is `"07/19/1990"`.
14. **Dynamic VA `duration` is in seconds.** `600` = 10 min. `86400` = 24h.
15. **Webhook sender IP** is `18.133.63.109` — useful for firewall allowlist
    on production.

---

## 14. Where to confirm a field

If anything in this file ever fails against the live sandbox:
1. Re-read this file first — most "errors" are typos.
2. Check the official docs page that section came from.
3. Email `help@squadco.com` with merchant ID `SBWCKYR7RP`.
4. Update this file with the correction and a dated note.

**Never edit the integration code to guess around a Squad rejection. Update
this reference instead.**