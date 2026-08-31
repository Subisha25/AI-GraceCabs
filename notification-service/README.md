# Grace Cabs — Dedicated SMS & WhatsApp Notification Microservice

A lightweight, robust Node.js + TypeScript notification microservice dedicated exclusively to SMS and WhatsApp delivery.

## Architecture

- **SMS**: 2Factor.in Gateway (Direct Single SMS, OTP Dispatch, and DLT Transactional Templates)
- **WhatsApp**: Meta WhatsApp Cloud API (Graph API v21.0)
- **Authentication**: Service-to-service Bearer token
- **Logging**: Masked phone recipient logging (`+91 90****0818`) with sensitive token redaction

## Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Service health and uptime |
| `POST` | `/api/notifications/sms` | Yes | Direct SMS or auto-detected OTP |
| `POST` | `/api/notifications/sms/template` | Yes | 2Factor DLT Approved Transactional Template SMS |
| `POST` | `/api/notifications/whatsapp` | Yes | Meta WhatsApp Cloud API Text Message |
| `POST` | `/api/notifications/whatsapp/template` | Yes | Meta WhatsApp Cloud API Template Message |

## Running Locally

```bash
npm install
npm run dev
npm test
npm run build
npm start
```
