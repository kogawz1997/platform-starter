# Platform Starter

Monorepo starter สำหรับระบบแยกหน้าผู้เล่น + หน้าแอดมิน + Backend API

## Apps

- `apps/web-member` - หน้าผู้เล่น / Member App
- `apps/web-admin` - หน้าแอดมิน / Admin App
- `apps/api` - Backend API / NestJS

## Stack

- Next.js
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- MinIO / S3
- Docker
- Nginx

## Development Ports

- Member: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000

## Core Rules

- แยก Member App กับ Admin App ออกจากกัน
- แยก Member Auth กับ Admin Auth
- ระบบเงินต้องผ่าน WalletService เท่านั้น
- ทุกธุรกรรมต้องมี Ledger และ Transaction Log
- Callback ต้องมี Signature Guard, Idempotency และ Lock
- Admin API ต้องเช็ก RBAC / Permission ทุกครั้ง
- Admin action สำคัญต้องมี Audit Log
